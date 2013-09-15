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

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
};

var Chat = new function() {
    
    this.myStatus   = "visible";
    this.username   = "Anonymous";
    this.hash       = "";
    this.socket     = null;
    this.enableDebug= false;
    this.me         = {mod: 0, admin: 0};
    
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

        try {
            
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
            this.socket.on('report_success', function() {
                confirm(chatTranslations.report_success);
            });

            // listener, whenever the server emits 'updaterooms', this updates the room the client is in
            this.socket.on('adduser_callback', function(myData) {
                that.me = myData;
                that.addContextmenuEvents();
            });

            ChatModerator.addSocketEvents(that.socket);

            this.setObserver();
        } catch(e){
            this.debugMessage(e);
        }

        
        return true;
    };
    
    this.addContextmenuEvents = function() {
        var users = document.getElementsByClassName('chatbox_userlist_user');
        for(var i = 0; i < users.length; i++){
            var user = users[i];
            var id = user.id;
            id = id.replace('chatbox_userlist_user_', '');
            this.addContextmenuEvent(user, id, this.me);
        }
        if(this.me && this.me.mod === 1){
            ChatModerator.addActions(this.me, this.socket);
        }
    };
    
    this.addTranslatedRow = function(username, action){
        if(action === 'joined'){
            var trans = chatTranslations.user_joined;
        } else if(action === 'leaves'){
            var trans = chatTranslations.user_leaves;
        } else if(action === 'connected'){
            var trans = chatTranslations.connection_success;
        } else if(action === 'report_success'){
            var trans = chatTranslations.report_success_notice;
        } else if(action === 'muted'){
            var trans = chatTranslations.muted;
        } else if(action === 'was_kicked'){
            var trans = chatTranslations.was_kicked;
        }
        trans = trans.replace('%s', username);
        this.addNoticeMessageRow(trans, 'Server');
    };
    
    this.addUser = function(){ 
        this.socket.emit('adduser', this.username, this.myStatus, 0, this.hash);
        this.addTranslatedRow(this.username, 'connected');
        this.debugMessage('add user '+this.username+' with status '+this.myStatus);
    };
    
    this.updateUserList = function(usernames){

        if(document.getElementById('chatbox_userlist')){

            this.clearUserlist();
            
            var ulAdmin    = document.createElement('ul');
            var ulMod      = document.createElement('ul');
            var ulDefault  = document.createElement('ul');
            
            var liAdminLabel    = document.createElement('li');
            var liModLabel      = document.createElement('li');
            var liDefaultLabel  = document.createElement('li');
            
            liAdminLabel.className = 'label';
            liModLabel.className = 'label';
            liDefaultLabel.className = 'label';
            
            liAdminLabel.innerHTML = chatTranslations.userlist_label_admin;
            liModLabel.innerHTML = chatTranslations.userlist_label_mod;
            liDefaultLabel.innerHTML = chatTranslations.userlist_label_default;
            
            
            ulAdmin.appendChild(liAdminLabel);
            ulMod.appendChild(liModLabel);
            ulDefault.appendChild(liDefaultLabel);
            
            document.getElementById('chatbox_userlist').appendChild(ulAdmin);
            document.getElementById('chatbox_userlist').appendChild(ulMod);
            document.getElementById('chatbox_userlist').appendChild(ulDefault);
            
            this.debugMessage(usernames);
            
            for (var key in usernames) {
                
                var data                = usernames[key];
                this.debugMessage(data);
                
                var username            = data.username;
                var image               = "bullet";
                var div                 = document.createElement('li');
                var usernameDiv         = document.createElement('div');
                var statusImg           = document.createElement('img');
                div.className           = 'user chatbox_userlist_user';

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
                console.debug(data);
                if(data && data.muted){
                    var muteImg = document.createElement('img');
                    muteImg.src = "/bundles/seyonnodejschat/images/icons/sound_mute.png";
                    div.appendChild(muteImg);
                }
                
                div.appendChild(usernameDiv);
                div.id = 'chatbox_userlist_user_'+data.id;
                
                if(data.admin === 1){
                    ulAdmin.appendChild(div);
                } else if(data.mod === 1){
                    ulMod.appendChild(div);
                } else {
                    ulDefault.appendChild(div);
                }
            }
            
            this.addContextmenuEvents();
         }
         
        this.debugMessage('update userlist finished');
    };
    
    this.addContextmenuEvent = function(div, key, me){
        
        this.lastContextmenuKey = '';
        var lastContextmenuKey = '';
        var socket = this.socket;
        Wrapper.addEvent(div, 'click', function(e){

            var createNew = true;

            if(document.getElementById('chatbox_contextmenu')){
                document.getElementById('chatbox_contextmenu').remove();
                if(this.lastContextmenuKey === key){
                    createNew = false;
                }
            }

            if(!document.getElementById('chatbox_contextmenu') && createNew){
                var context = document.createElement('ul');
                context.id = 'chatbox_contextmenu';
                context.className = 'contextmenu';
                var li = document.createElement('li');
                li.innerHTML = chatTranslations.contextmenu_wisper;
                li.className = 'inactive';
                context.appendChild(li);
                ChatModerator.addContextItems(me, context, socket, key);
                document.getElementById('chatbox_userlist_user_'+key).appendChild(context);
                if(e){
                    e.preventDefault();
                }
            }
            
            
            lastContextmenuKey = key;
        });
        
        this.lastContextmenuKey = lastContextmenuKey;
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
        
        if(additionalClassName === 'error' || additionalClassName === 'notice'){
            additionalClassName = additionalClassName + ' nobreak';
        }
        
        if(!additionalUserClassName){
            additionalUserClassName = '';
        }
        
        message = ChatReplacer.replace(message, user);
        
        var div = document.createElement('div');
        div.className = 'message';
        
        var date = new Date(time);
        var timeDiv = document.createElement('div');
        timeDiv.className = 'time';
        timeDiv.innerHTML = ChatUtil.createTimeString(date)+' | ';
        
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
    
    this.addNoticeMessageRow = function(message, username, time){
        this.addMessageRow(message, username, time, 'notice');
    };
    
    this.addErrorMessageRow = function(message, username, time){
        this.addMessageRow(message, username, time, 'error');
    };
    
    this.clearMessages = function(){
        document.getElementById('chatbox_messages').innerHTML = '';
        this.debugMessage('clear messages');
    };
    
    this.printConnectingMessage = function () {
        this.addNoticeMessageRow(chatTranslations.connection_wait);
    };
    
    this.printConnectionError = function () {
        this.addErrorMessageRow(chatTranslations.connection_error);
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
        
        Wrapper.addEvent('report_posts', 'click', function(e) {
            
            if(document.getElementById('chatbox_dialog')){
                document.getElementById('chatbox_dialog').remove();
            }
            
            var dialog = document.createElement('div');
            dialog.id = 'chatbox_dialog';
            
            var message = document.createElement('div');
            message.className = 'message';
            message.innerHTML = chatTranslations.report_question;
            
            
            var label = document.createElement('label');
            label.innerHTML = chatTranslations.report_subject_label;
            var input = document.createElement('input');
            var button = document.createElement('button');
            button.innerHTML = chatTranslations.report_send_button;
            var button2 = document.createElement('button');
            button2.innerHTML = chatTranslations.report_cancel_button;
            
            dialog.appendChild(message);
            dialog.appendChild(label);
            dialog.appendChild(input);
            dialog.appendChild(button);
            dialog.appendChild(button2);
            
            document.body.appendChild(dialog);
            
            Wrapper.addEvent(button, 'click', function(e){
                that.socket.emit('report_posts', input.value);
                if(document.getElementById('chatbox_dialog')){
                    document.getElementById('chatbox_dialog').remove();
                }
                if(e){
                    e.preventDefault();
                }
            });
            
            Wrapper.addEvent(button2, 'click', function(e){
                if(document.getElementById('chatbox_dialog')){
                    document.getElementById('chatbox_dialog').remove();
                }
                if(e){
                    e.preventDefault();
                }
            });
            
            if(e){
                e.preventDefault();
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
        try {
            if(this.enableDebug){
                console.debug(message);
            }
        } catch(e){
            //console.debug(e);
        }
    };

};