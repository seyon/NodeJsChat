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
var defaultRoom = 'Eingangshalle';
// rooms which are currently available in chat
var rooms = ['Eingangshalle','Taverne','AFK Room'];
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
                    
                    // store the username in the socket session for this client
                    socket.username = username;
                    // store the room name in the socket session for this client
                    socket.room = defaultRoom;
                    // add the client's username to the global list
                    if(!usernames[defaultRoom]){
                        usernames[defaultRoom] = {};
                    }
                    
                    var me = usernames[defaultRoom][username];
                    
                    if(!me){
                        me = {'username': username, 'status': visibility, 'mobile': mobile, 'count': 1, 'admin': 0, 'mod': 0, 'hash': hash}; 
                        console.log(me);
                        if(typeof hash !== "undefined" && hash){
                            var sql = 'SELECT * FROM nodejs_chat_session WHERE `hash` = "'+hash+'"';
                            console.log(sql);
                            connection.query(sql, function(err, rows, fields) {
                                if (err) throw err;
                                console.log(rows);
                                if(rows && rows.length > 0){
                                    console.log(rows[0]);
                                    me.admin = rows[0].isAdmin;
                                    me.mod = rows[0].isMod;
                                    console.log(me);
                                    adduser(me, username);
                                }
                            });
                        }
                    } else {
                        me.count++;
                        adduser(me, username);
                    }
                    
                }
            } catch (e){
                //console.log(e);
            }

            function adduser(me, username){
                
                usernames[defaultRoom][username] =  me;

                // send client to room 1
                socket.join(defaultRoom);
                // echo to client they've connected
                //socket.emit('updatechatlog', 'SERVER', 'du befindest dich nun in '+defaultRoom);
                // echo to room 1 that a person has connected to their room
                socket.broadcast.to(socket.room).emit('updatechatlog', 'SERVER', username + ' ist beigetreten.');
                socket.emit('updaterooms', rooms, defaultRoom);
                // send the new userlist
                io.sockets.in(socket.room).emit('updateusers', usernames[defaultRoom]);
                if(roomChatlogs[socket.room] && roomChatlogs[socket.room].length > 0){
                    socket.emit('writeMessages', roomChatlogs[socket.room]);
                } 
                 
            }

        });

        // when the client emits 'sendchat', this listens and executes
        socket.on('changeStatus', function (status) {
            try {
                if(
                    usernames && 
                    usernames[socket.room] && 
                    usernames[socket.room][socket.username]
                ){
                    var me = usernames[socket.room][socket.username];
                    me.status = status;
                    usernames[socket.room][socket.username] = me;
                    io.sockets.in(socket.room).emit('updateusers', usernames[socket.room]);
                }
            } catch (e){
                //console.log(e);
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
                //console.log(e);
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
                    var me = usernames[socket.room][socket.username];
                    me.count--;
                    if(me.count <= 0){
                        // remove the username from global usernames list
                        delete usernames[socket.room][socket.username];
                        // update list of users in chat, client-side
                        io.sockets.in(socket.room).emit('updateusers', usernames[socket.room]);
                    }
                }
                // echo globally that this client has left
                socket.broadcast.emit('updatechatlog', 'SERVER', socket.username + ' verlässt uns');
                socket.leave(socket.room);
            } catch (e){
                //console.log(e);
            }
        });
    });

} catch (e){
    //console.log(e);
}