//NODE_ENV=production node ffxivchat.js  > ffxivchat_log.log 2> ffxivchat_err.log

// forever start ffxivchat.js
// forever stop ffxivchat.js
var dbconfig = require('./dbconfig.js');
var express = require("express");
var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

io.enable('browser client minification');  // send minified client
io.enable('browser client etag');          // apply etag caching logic based on version number
io.enable('browser client gzip');          // gzip the file
io.set('log level', 4);                    // reduce logging
io.set('transports', [                     // enable all transports (optional if you want flashsocket)
    'websocket'
  , 'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
]);

server.listen(3000);

//mysql connect for access check
var mysql      = require('mysql');
var db_config = {
  host     : dbconfig.host,
  user     : dbconfig.username,
  password : dbconfig.password,
  database : dbconfig.database
};

var connection;
function handleDisconnect() {
  connection = mysql.createConnection(db_config); // Recreate the connection, since
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();



// usernames which are currently connected to the chat
var usernames = {};
var defaultRoom = 'room_1';
// rooms which are currently available in chat
var rooms = ['room_1'];
var roomChatlogs = {};

try {

    io.sockets.on('connection', function (socket) {

        // when the client emits 'adduser', this listens and executes
        socket.on('adduser', function(username, visibility, mobile, hash){

            try {
                
                if(typeof visibility === "undefined" || !visibility){
                    var visibility = 'visible';
                }

                if(!mobile){
                    var mobile = 0;
                } else {
                    username = '[mobile] ' + username;
                }

                if(username && username !== "" && typeof username !== "undefined"){
                    
                    socket.username = username;
                    socket.room     = defaultRoom;
                    socket.muted    = 0;
                    
                    if(!usernames[defaultRoom]){
                        usernames[defaultRoom] = {};
                    }
                    
                    var me = usernames[defaultRoom][socket.id];
                    
                    if(!me){
                        me = {'id': socket.id, 'username': username, 'status': visibility, 'mobile': mobile, 'count': 1, 'admin': 0, 'mod': 0, 'hash': hash, 'muted' : socket.muted}; 
                        if(typeof hash !== "undefined" && hash !== ""){
                            var sql = 'SELECT * FROM nodejs_chat_session WHERE `hash` = "'+hash+'"';
                            connection.query(sql, function(err, rows, fields) {
                                if (err) throw err;
                                if(rows && rows.length > 0){
                                    socket.admin = me.admin = rows[0].isAdmin;
                                    socket.mod = me.mod = rows[0].isMod;
                                    adduser(me, defaultRoom);
                                }
                            });
                        } else {
                            adduser(me, defaultRoom);
                        }
                    } else {
                        if(me){
                            if(me.count){
                                me.count++;
                            }
                            adduser(me, defaultRoom);
                        }
                    }
                    console.log(me);
                    
                }
            } catch (e){
                console.log(e);
            }

            function adduser(me, room){
                
                usernames[room][me.id] =  me;
                
                if(me && me.count && me.count === 1){

                    // send client to room 1
                    socket.join(room);
                    
                    // echo to room 1 that a person has connected to their room
                    socket.broadcast.to(room).emit('updatechatlog', me.username, 'joined');
                    
                    // send the new userlist
                    io.sockets.in(room).emit('updateusers', usernames[room]);
                    
                    // send last Chatlog
                    if(roomChatlogs[room] && roomChatlogs[room].length > 0){
                        socket.emit('writeMessages', roomChatlogs[room]);
                    } 
                    
                    socket.emit('adduser_callback', me);
                }
            }

        });

        // when the client emits 'sendchat', this listens and executes
        socket.on('changeStatus', function (status) {
            
            try {
                if(
                    usernames && 
                    usernames[socket.room] && 
                    usernames[socket.room][socket.id]
                ){
                    var me = usernames[socket.room][socket.id];
                    me.status = status;
                    usernames[socket.room][socket.id] = me;
                    io.sockets.in(socket.room).emit('updateusers', usernames[socket.room]);
                }
            } catch (e){
                console.log(e);
            }
            
        }),  

        // when the client emits 'sendchat', this listens and executes
        socket.on('force_reload', function () {
            try {
                if(
                    socket.admin === 1
                ){
                    io.sockets.emit('force_reload');
                }
            } catch (e){
                console.log(e);
            }
        }),  

        // when the client emits 'sendchat', this listens and executes
        socket.on('sendchat', function (data) {

            try {
                
                if(data && socket && socket.room){

                    if(socket.muted && socket.muted === 1){
                        socket.emit('updatechatlog', socket.username, 'muted');
                    } else {
                        var username = socket.username;
                        var date = new Date();
                        var time = date.getTime();
                        var me = usernames[socket.room][socket.id];
                        var cssClass = '';

                        if(me.admin){
                            cssClass = 'admin';
                        } else if(me.admin){
                            cssClass = 'mod';
                        }

                        var messageData = {};
                        messageData.username    = username;
                        messageData.message     = data;
                        messageData.date        = time;
                        messageData.css         = cssClass;

                        io.sockets.in(socket.room).emit('writeMessage', messageData);

                        if(!roomChatlogs[socket.room]){
                            roomChatlogs[socket.room] = new Array();
                        }

                        var length = roomChatlogs[socket.room].length;
                        if(length > 100){
                            roomChatlogs[socket.room] = new Array();
                            length = 0;
                        }

                        roomChatlogs[socket.room][length] = messageData;
                    }
                }
                
            } catch (e){
                console.log(e);
            }
        });

        socket.on('report_posts', function(subject){
            if(roomChatlogs[socket.room] && roomChatlogs[socket.room].length > 0){
                if(!subject || typeof subject === 'undefined'){
                    var subject = '';
                }
                var sql = 'INSERT INTO nodejs_chat_reports SET ?';
                var messageData = JSON.stringify(roomChatlogs[socket.room]);
                var ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;
                var date;
                    date = new Date();
                    date = date.getUTCFullYear() + '-' +
                        ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
                        ('00' + date.getUTCDate()).slice(-2) + ' ' + 
                        ('00' + date.getUTCHours()).slice(-2) + ':' + 
                        ('00' + date.getUTCMinutes()).slice(-2) + ':' + 
                        ('00' + date.getUTCSeconds()).slice(-2);
                var data = {'ip': ip, 'username': socket.username, 'date': date, 'chatlog': messageData, 'subject': subject};
                console.log(data);
                connection.query(sql, data, function(err, result) {
                    if (err) throw err;
                    socket.emit('report_success');
                    io.sockets.in(socket.room).emit('updatechatlog', socket.username, 'report_success');
                });
            }
        });

        // kick given user if you have the access
        socket.on('get_reports', function(){
            if(socket.mod === 1){
                var sql = 'SELECT * FROM nodejs_chat_reports ORDER BY `date` DESC';
                connection.query(sql, function(err, rows, fields) {
                    if (err) throw err;
                    if(rows && rows.length > 0){
                        socket.emit('display_reports', rows);
                    }
                });
            }
        });

        // kick given user if you have the access
        socket.on('kick_user', function(uid){
            if(socket.mod === 1 && io.sockets.socket(uid)){
                var username = io.sockets.socket(uid).username;
                io.sockets.socket(uid).kicked = 1;
                io.sockets.socket(uid).emit('kick_callback');
                if(io.sockets.socket(uid)){
                    io.sockets.socket(uid).disconnect();
                }
                io.sockets.in(socket.room).emit('updatechatlog', username, 'was_kicked');
            }
        });

        // kick given user if you have the access
        socket.on('mute_user', function(uid){
            if(socket.mod === 1){
                if(io.sockets.socket(uid) && io.sockets.socket(uid).muted && io.sockets.socket(uid).muted === 1){
                    usernames[socket.room][uid].muted = io.sockets.socket(uid).muted = 0;
                } else {
                    io.sockets.socket(uid).emit('updatechatlog', socket.username, 'muted');
                    usernames[socket.room][uid].muted = io.sockets.socket(uid).muted = 1;
                }
                io.sockets.in(socket.room).emit('updateusers', usernames[socket.room]);
            }
        });

        // when the user disconnects.. perform this
        socket.on('disconnect', function(){
            try {
                if(socket && socket.room && usernames && usernames[socket.room]){
                    // remove the username from global usernames list
                    delete usernames[socket.room][socket.id];
                    // update list of users in chat, client-side
                    if(!socket.kicked || socket.kicked !== 1){
                        socket.broadcast.to(socket.room).emit('updatechatlog', socket.username, 'leaves');
                    }
                    io.sockets.in(socket.room).emit('updateusers', usernames[socket.room]);
                }
                socket.leave(socket.room);
            } catch (e){
                console.log(e);
            }
        });
    });

} catch (e){
    console.log(e);
}