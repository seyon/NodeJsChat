// Adapted slightly from Sam Dutton
// Set name of hidden property and visibility change event
// since some browsers only offer vendor-prefixed support
var hidden, state, visibilityChange; 
if (typeof document.hidden !== "undefined") {
	hidden = "hidden";
	visibilityChange = "visibilitychange";
	state = "visibilityState";
} else if (typeof document.mozHidden !== "undefined") {
	hidden = "mozHidden";
	visibilityChange = "mozvisibilitychange";
	state = "mozVisibilityState";
} else if (typeof document.msHidden !== "undefined") {
	hidden = "msHidden";
	visibilityChange = "msvisibilitychange";
	state = "msVisibilityState";
} else if (typeof document.webkitHidden !== "undefined") {
	hidden = "webkitHidden";
	visibilityChange = "webkitvisibilitychange";
	state = "webkitVisibilityState";
}

var Chat = new function() {
    
    this.myStatus   = "visible";
    this.username   = "Anonymous";
    this.hash       = "";
    this.uid        = "";
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
        if(chatConfig.uid){
            this.uid = chatConfig.uid;
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
            that.addUser();
        });

        this.socket.on('updateusers', function (usernames) {
            that.updateUserList(usernames);
         });

        // listener, whenever the server emits 'updatechat', this updates the chat body
        this.socket.on('writeMessages', function (data) {
            var count = 0;
            data.each(function(messageData){
                that.addMessageRow(messageData.message, messageData.username, messageData.date, '', messageData.css, true);
                count++;
            });
            Wrapper.scrollToBottom('chatbox_messages');
            that.debugMessage('scoll messages down');
        });

        // listener, whenever the server emits 'updatechat', this updates the chat body
        this.socket.on('writeMessage', function (messageData) {
            that.addMessageRow(messageData.message, messageData.username, messageData.date, '', messageData.css);
        });

        this.socket.on('updatechatlog', function (username, action) {
            that.addTranslatedRow(username, action);
        });

        // listener, whenever the server emits 'updaterooms', this updates the room the client is in
        this.socket.on('updaterooms', function(rooms, current_room) {

        });

        this.setObserver();

        
        return true;
    };
    
    this.addTranslatedRow = function(username, action){
        if(action === 'joined'){
            var trans = chatTranslations.user_joined;
        } else if(action === 'leaves'){
            var trans = chatTranslations.user_leaves;
        } else if(action === 'connected'){
            var trans = chatTranslations.connection_success;
        }
        trans = trans.replace('%s', username);
        this.addMessageRow(trans, 'Server', null, 'notice');
    };
    
    this.addUser = function(){ 
        this.socket.emit('adduser', this.username, this.myStatus, 0, this.hash, this.uid);
        this.addTranslatedRow(this.username, 'connected');
        this.debugMessage('add user '+this.username+' with status '+this.myStatus);
    };
    
    this.updateUserList = function(usernames){
        
        usernames = ChatUtil.usort(usernames, function (a, b) {
            if(a.admin < b.admin){
                return 1;
            } else if(a.mod < b.mod){
                return 0;
            } else {
                return -1;
            }
        });
        
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
    
    this.addMessageRow = function(message, user, time, additionalClassName, additionalUserClassName, skippScroll){
        
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
        
        if(!additionalUserClassName){
            additionalUserClassName = '';
        }
        
        message = ChatEmote.replace(message, user);
        
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
        userDiv.className = 'user '+additionalUserClassName;
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
        this.addMessageRow(chatTranslations.connection_wait);
        this.debugMessage('print connection message');
    };
    
    this.printConnectionError = function () {
        this.addMessageRow(chatTranslations.connection_error, null, null, 'error');
        this.debugMessage('print connection error message');
    };
    
    this.setObserver = function(){
        var that = this;
        
        Wrapper.addEvent('chatbox_send', 'click', function() {
            var textarea = document.getElementById('chatbox_text');
            var message = textarea.value;
            message = ChatUtil.nl2br(message);
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
        
        document.addEventListener(visibilityChange, function(e) {
            if(document[hidden]){
                e.visibilityState = 'hidden';
            } else {
                e.visibilityState = 'visible';
            }
            if(that.socket && e.visibilityState){
                that.socket.emit('changeStatus', e.visibilityState);
                that.debugMessage('changeStatus '+e.visibilityState);
            }
        }, false);
        
        this.debugMessage('set observers');
    };
    
    this.debugMessage = function(message){
        if(this.enableDebug){
            console.debug(message);
        }
    };

};