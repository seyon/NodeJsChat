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
        
        if(me.mod === 1){
            socket.emit('get_reports');
        }
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
    
    this.createReportRow = function(report, container){
        var divReport   = document.createElement('div');
        divReport.className = 'log_row';
        divReport.innerHTML = report.username+': '+report.message;
        container.appendChild(divReport);
    };
    
    this.displayReports = function(reports){
        
        var containter = document.getElementById('chatbox_moderator');
        var containterLogs = document.getElementById('chatbox_moderator_logs');
        
        if(containter && containterLogs){
            containter.style.display = 'block';
            containterLogs.innerHTML = '';
            for(var i = 0; i < reports.length; i++){
                var report = reports[i];
                var divReport   = document.createElement('div');
                var divHeader   = document.createElement('div');
                var date        = new Date(report.date);
                divHeader.innerHTML = ChatUtil.createDateString(date)+' '+ChatUtil.createTimeString(date)+' '+report.username+': '+report.subject;
                divHeader.className = 'report_header'
                var divBody     = document.createElement('div');
                var logs        = JSON.parse(report.chatlog);
                for(var ii = 0; ii < logs.length; ii++){
                    var log = logs[ii];
                    this.createReportRow(log, divBody);
                }
                divBody.className = 'report_chatlog'
                divReport.appendChild(divHeader);
                divReport.appendChild(divBody);
                containterLogs.appendChild(divReport);
                this.setReportEvents(divHeader, divBody);
            }
        }
        
    };
    
    this.setReportEvents = function(divHeader, divBody){
        Wrapper.addEvent(divHeader, 'click', function(){
            if(divBody.style.display === 'block'){
                divBody.style.display = 'none';
            } else {
                divBody.style.display = 'block';
            }
        });
    };
    
    this.addSocketEvents = function(socket){
        
        var that = this;
        
        socket.on('force_reload', function() {
            location.reload();
        });
        
        socket.on('kick_callback', function() {
            socket.disconnect();
            Chat.addErrorMessageRow(chatTranslations.kicked);
        });
        
        socket.on('display_reports', function(reports) {
            that.displayReports(reports);
        });
        
    };
    
};