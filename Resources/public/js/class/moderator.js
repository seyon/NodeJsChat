var ChatModerator = new function() {
    
    this.addActions = function(me, socket){
        
        var div = document.getElementById('chatbox_mod_actions');
        if(div){
            div.remove();
        }
        
        var divActions = document.getElementById('chatbox_actions');
        var div = document.createElement('div');
        div.className = 'left mod_actions';
        div.id = 'chatbox_mod_actions';
        
        if(me.admin === 1){
            var action1 = document.createElement('a');
            action1.innerHTML = chatTranslations.force_reload;
            action1.href = '#';
            Wrapper.addEvent(action1, 'click', function(e){
                socket.emit('force_reload');
            });
            div.appendChild(action1);
        }
        divActions.appendChild(div);
    };
    
    this.addContextItems = function(me, contextElement, socket, uid){
        if(me && me.mod === 1){
            var li = document.createElement('li');
            li.innerHTML = chatTranslations.contextmenu_mute;
            Wrapper.addEvent(li, 'click', function(e){
                socket.emit('mute_user', uid);
            });
            contextElement.appendChild(li);
            var li = document.createElement('li');
            li.innerHTML = chatTranslations.contextmenu_kick;
            Wrapper.addEvent(li, 'click', function(e){
                socket.emit('kick_user', uid);
            });
            contextElement.appendChild(li);
            var li = document.createElement('li');
            li.innerHTML = chatTranslations.contextmenu_ban;
            li.className = 'inactive';
            contextElement.appendChild(li);
        }
    };
    
    this.displayReports = function(reports){
        
        var containter = document.getElementById('chatbox_moderator');
        
        if(containter){
            var divReport = document.createElement('div');
            
        }
        
    };
    
    this.addSocketEvents = function(socket){
        
        socket.on('display_reports', function(reports) {
            ChatModerator.displayReports(reports);
        });
        
        socket.on('force_reload', function() {
            location.reload();
        });
        
        socket.on('kick_callback', function() {
            socket.disconnect();
            Chat.addErrorMessageRow(chatTranslations.kicked);
        });
        
    };
    
};