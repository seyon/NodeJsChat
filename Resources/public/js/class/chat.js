var Chat = new function() {
    
    this.myStatus   = "visible";
    this.username   = "Anonymous";
    this.hash       = "";
    this.socket     = null;
    this.enableDebug= false;
    
    this.init = function () {
         
        this.printConnectingMessage();
        this.checkConfig();
        this.includeJs();
             
    };
    
    this.checkConfig = function(){
        if(chatConfig.ip === '__host__'){
            chatConfig.ip = window.location.hostname;
        }
        if(chatConfig.debug){
            this.enableDebug = true;
        }
        if(chatConfig.username){
            this.username = chatConfig.username;
        }
        if(chatConfig.username){
            this.hash = chatConfig.hash;
        }
    };
    
    this.includeJs = function(){
        var that = this;
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'http://'+chatConfig.ip+':'+chatConfig.port+chatConfig.file;
        head.appendChild(script);
        script.onload = function(){
            that.prepare();
        };
        script.onerror = function(){
            that.printConnectionError();
        };
        // IE 6 & 7
        script.onreadystatechange = function() {
            if (this.readyState === 'complete') {
                that.prepare();
            } else if (this.readyState === 'error' || this.readyState === 'failed') {
                that.printConnectionError();
            }
        };
    };
    
    this.prepare = function(){
        if(typeof io !== 'undefined' && io){
            var success = this.connect();
            if(!success){
                this.printConnectionError();
            }
        } else {
            this.printConnectionError();
        }
    };
    
    this.connect = function () {
        
        if(!this.username || this.username === ""){
            this.debugMessage('no username');
            return false;
        }

        // only connect if its the first time
        if(this.socket){
            this.socket.emit('changeStatus', this.myStatus);
            this.debugMessage('change status to '+this.myStatus);
            return true;
        }

        var that    = this;

        this.socket = io.connect(chatConfig.ip+':'+chatConfig.port);       

        // on connection to server, ask for user's name with an anonymous callback
        this.socket.on('connect', function(){
            that.addUser(that.username, that.myStatus);
        });

        this.socket.on('updateusers', function (usernames) {
            that.updateUserList(usernames);
         });

        // listener, whenever the server emits 'updatechat', this updates the chat body
        this.socket.on('writeMessages', function (data) {
            var count = 0;
            data.each(function(messageData){
                that.addMessageRow(messageData.message, messageData.username, messageData.date, '', true);
                count++;
            });
            if(count === 0){
                that.addMessageRow('connection established', null, null, '', true);
            }
            Wrapper.scrollToBottom('chatbox_messages');
            that.debugMessage('scoll messages down');
        });

        // listener, whenever the server emits 'updatechat', this updates the chat body
        this.socket.on('writeMessage', function (messageData) {
            that.addMessageRow(messageData.message, messageData.username, messageData.date);
        });

        this.socket.on('updatechatlog', function (username, data) {
            that.addMessageRow(data, username, null, 'notice');
        });

        // listener, whenever the server emits 'updaterooms', this updates the room the client is in
        this.socket.on('updaterooms', function(rooms, current_room) {

        });

        this.setObserver();

        
        return true;
    };
    
    this.addUser = function(username, status){ 
        this.socket.emit('adduser', username, status, 0, this.hash);
        this.debugMessage('add user '+username+' with status '+status);
    };
    
    this.updateUserList = function(usernames){
        
        this.debugMessage('update userlist started...');
        
        if(document.getElementById('chatbox_userlist')){

            this.clearUserlist();
            
            this.debugMessage(usernames);
            for (var key in usernames) {
                var data                = usernames[key];
                this.debugMessage(data);
                var username            = data.username;
                var image               = "bullet";
                var div                 = document.createElement('div');
                var usernameDiv         = document.createElement('div');
                var statusImg           = document.createElement('img');
                div.className           = 'user';

                console.debug(data);
                if(data.mobile){
                    username    = username.replace('[mobile]', ''); 
                    image       = "Android_Robot";
                }
                
                if(data.status && data.status === 'hidden'){
                    image = image+"_red.png";
                } else {
                   image = image+"_green.png";
                }
                
                if(username === this.username){
                    div.id ='chatbox_me';
                    statusImg.id ='chatbox_me_icon';
                }
                if(data && data.admin){
                    div.className += ' admin';
                } else if(data && data.mod){
                    div.className += ' mod';
                }
                usernameDiv.innerHTML   = username;
                
                statusImg.src = "/bundles/seyonnodejschat/images/icons/"+image;
                div.appendChild(statusImg);
                div.appendChild(usernameDiv);
                document.getElementById('chatbox_userlist').appendChild(div);
            }
         }
         
        this.debugMessage('update userlist finished');
    };
    
    this.clearUserlist = function(){
        document.getElementById('chatbox_userlist').innerHTML = '';
        this.debugMessage('clear userlist');
    };
    
    this.addMessageRow = function(message, user, time, additionalClassName, skippScroll){
        
        this.debugMessage('add message row started...');

        if(!time || time === 'undefined'){
            time = new Date().getTime();
        }

        if(!user){
            user = 'Server';
        }
        
        if(!additionalClassName){
            additionalClassName = '';
        }
        
        var div = document.createElement('div');
        div.className = 'message';
        
        var date = new Date(time);
        var h = date.getHours();
        if(h.toString().length <= 1){
            h = '0'+h;
        }
        var m = date.getMinutes();
        if(m.toString().length <= 1){
            m = '0'+m.toString();
        }
        var timeDiv = document.createElement('div');
        timeDiv.className = 'time';
        timeDiv.innerHTML = h+':'+m+' | ';
        
        var userDiv = document.createElement('div');
        userDiv.className = 'user';
        userDiv.innerHTML = user+': ';
        
        var textDiv = document.createElement('div');
        textDiv.className = 'text '+additionalClassName;
        textDiv.innerHTML = message;
        
        div.appendChild(timeDiv);
        div.appendChild(userDiv);
        div.appendChild(textDiv);
        
        document.getElementById('chatbox_messages').appendChild(div);

        if(!skippScroll || skippScroll === 'undefined'){
            Wrapper.scrollToBottom('chatbox_messages');
        }
        
        this.debugMessage('add message row finished');
    };
    
    this.clearMessages = function(){
        document.getElementById('chatbox_messages').innerHTML = '';
        this.debugMessage('clear messages');
    };
    
    this.printConnectingMessage = function () {
        this.addMessageRow("Connecting ... please wait");
        this.debugMessage('print connection message');
    };
    
    this.printConnectionError = function () {
        this.addMessageRow("Could not connect to the chat server", null, null, 'error');
        this.debugMessage('print connection error message');
    };
    
    this.setObserver = function(){
        var that = this;
        
        Wrapper.addEvent('chatbox_send', 'click', function() {
            var textarea = document.getElementById('chatbox_text');
            var message = textarea.value;
            message = that.nl2br(message);
            textarea.value = '';
            that.debugMessage('sendchat');
            that.debugMessage(that.socket);
            that.debugMessage(message);
            if(that.socket && message && message !== ""){
                // tell server to execute 'sendchat' and send along one parameter
                that.socket.emit('sendchat', message);
            }
            Wrapper.setFocus('chatbox_text');
            return false;
        });
        
        Wrapper.addEvent('chatbox_text', 'keypress', function(e) {
            if(e.code === 13 && !e.shift && !e.shiftKey) {
                Wrapper.fireEvent('chatbox_send', 'click');
                that.debugMessage('fireEvent click');
                if(e){
                    e.preventDefault();
                }
            }
        });
        
        Wrapper.addEvent(window, 'visibilitychange', function(e) {
            if(that.socket && e.visibilityState){
                that.socket.emit('changeStatus', e.visibilityState);
                that.debugMessage('changeStatus '+e.visibilityState);
            }
        });
        
        this.debugMessage('set observers');
    };
    
    this.debugMessage = function(message){
        if(this.enableDebug){
            console.debug(message);
        }
    };
    
    this.nl2br = function  (str) {
        // http://kevin.vanzonneveld.net
        // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: Philip Peterson
        // +   improved by: Onno Marsman
        // +   improved by: Atli Þór
        // +   bugfixed by: Onno Marsman
        // +      input by: Brett Zamir (http://brett-zamir.me)
        // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: Brett Zamir (http://brett-zamir.me)
        // +   improved by: Maximusya
        // *     example 1: nl2br('Kevin\nvan\nZonneveld');
        // *     returns 1: 'Kevin<br />\nvan<br />\nZonneveld'
        // *     example 2: nl2br("\nOne\nTwo\n\nThree\n", false);
        // *     returns 2: '<br>\nOne<br>\nTwo<br>\n<br>\nThree<br>\n'
        // *     example 3: nl2br("\nOne\nTwo\n\nThree\n", true);
        // *     returns 3: '<br />\nOne<br />\nTwo<br />\n<br />\nThree<br />\n'
        var breakTag = '<br ' + '/>'; // Adjust comment to avoid issue on phpjs.org display

        return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
    }

};