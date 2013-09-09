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
io.set('log level', 1);                    // reduce logging
io.set('transports', [                     // enable all transports (optional if you want flashsocket)
    'websocket'
  , 'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
]);

//mysql connect for access check
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : dbconfig.host,
  user     : dbconfig.username,
  password : dbconfig.password,
  database : dbconfig.database
});
connection.connect();

server.listen(3000);

// usernames which are currently connected to the chat
var usernames = {};
var defaultRoom = 'room_1';
// rooms which are currently available in chat
var rooms = ['room_1'];
var roomChatlogs = {};

try {

    io.sockets.on('connection', function (socket) {

        // when the client emits 'adduser', this listens and executes
        socket.on('adduser', function(username, visibility, mobile, hash, uid){

            try {
                
                if(typeof uid === "undefined" || uid === ""){
                    var uid = Math.random().toString(36).substr(2,9);
                }
                
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
                    socket.uid      = uid;
                    socket.room     = defaultRoom;
                    
                    if(!usernames[defaultRoom]){
                        usernames[defaultRoom] = {};
                    }
                    
                    var me = usernames[defaultRoom][uid];
                    
                    if(!me){
                        me = {'username': username, 'status': visibility, 'mobile': mobile, 'count': 1, 'admin': 0, 'mod': 0, 'hash': hash, 'uid': uid}; 
                        if(typeof hash !== "undefined" && hash !== ""){
                            var sql = 'SELECT * FROM nodejs_chat_session WHERE `hash` = "'+hash+'"';
                            connection.query(sql, function(err, rows, fields) {
                                if (err) throw err;
                                if(rows && rows.length > 0){
                                    me.admin = rows[0].isAdmin;
                                    me.mod = rows[0].isMod;
                                    adduser(me, defaultRoom);
                                }
                            });
                        } else {
                            adduser(me, defaultRoom);
                        }
                    } else {
                        me.count++;
                        adduser(me, defaultRoom);
                    }
                    console.log(me);
                    
                }
            } catch (e){
                console.log(e);
            }

            function adduser(me, room){
                
                usernames[room][me.uid] =  me;
                
                if(me.count === 1){

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
                }
            }

        });

        // when the client emits 'sendchat', this listens and executes
        socket.on('changeStatus', function (status) {
            try {
                if(
                    usernames && 
                    usernames[socket.room] && 
                    usernames[socket.room][socket.uid]
                ){
                    var me = usernames[socket.room][socket.uid];
                    me.status = status;
                    usernames[socket.room][socket.uid] = me;
                    io.sockets.in(socket.room).emit('updateusers', usernames[socket.room]);
                }
            } catch (e){
                console.log(e);
            }
        }),   

        // when the client emits 'sendchat', this listens and executes
        socket.on('sendchat', function (data) {

            try {
                if(data && socket && socket.room){

                    var username = socket.username;
                    var date = new Date();
                    var time = date.getTime();

                    var messageData = {};
                    messageData.username    = username;
                    messageData.message     = data;
                    messageData.date        = time;

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
            } catch (e){
                console.log(e);
            }
        });

        socket.on('switchRoom', function(newroom){
    //        if(usernames[socket.room] && usernames[socket.room][socket.username]){
    //            delete usernames[socket.room][socket.username];
    //        }
    //		// leave the current room (stored in session)
    //		socket.leave(socket.room);
    //		// join new room, received as function parameter
    //		socket.join(newroom);
    //		socket.emit('updatechatlog', 'SERVER', 'du befindest dich nun in '+ newroom);
    //		// sent message to OLD room
    //		socket.broadcast.to(socket.room).emit('updatechatlog', 'SERVER', socket.username+' verläst uns.');
    //		// update socket session room title
    //		socket.room = newroom;
    //		socket.broadcast.to(newroom).emit('updatechatlog', 'SERVER', socket.username+' ist uns beigetreten');
    //		socket.emit('updaterooms', rooms, newroom);
        });

        // when the user disconnects.. perform this
        socket.on('disconnect', function(){
            try {
                if(socket && socket.room && usernames && usernames[socket.room]){
                    var me = usernames[socket.room][socket.uid];
                    me.count--;
                    if(me.count <= 0){
                        // remove the username from global usernames list
                        delete usernames[socket.room][socket.uid];
                        // update list of users in chat, client-side
                        socket.broadcast.to(socket.room).emit('updatechatlog', socket.username, 'leaves');
                        io.sockets.in(socket.room).emit('updateusers', usernames[socket.room]);
                    }
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