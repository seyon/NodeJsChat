
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

// Set it up!
Element.NativeEvents[visibilityChange] = 2;
Element.Events[visibilityChange] = {
	base: visibilityChange,
	condition: function(event) {
		event[state] = document[state];
		event.visibilityState = document[state];
		return true;
	}
};

// on load of page
window.addEvent('load', function(){
    
    var myStatus = "hidden";
    var socket = null;
    
    if(typeof io !== 'undefined' && io){
        
        if($('chatbox_offline')){
            $('chatbox_offline').setStyle('visibility', 'hidden');
        }
        
        function switchRoom(room){
            if(socket){
                $('conversation').set('html', '');
                socket.emit('switchRoom', room);
            }
        }
        
        function writeMessage(data){
            var newElement = new Element('div');
            var html = '<b>['+data.date+'] '+data.username+':</b> '+data.message+'<br />';
            newElement.set('html', html);
            newElement.inject($('conversation'), 'bottom');
            new Fx.Scroll($('conversation')).toBottom();
            if(myStatus === "hidden"){
                $('chatbox_new_message').setStyle('display', 'inline');
            }
        }
        
        function connectToChat(){
            
            if(!userName || userName === ""){
                return false;
            }
            
            // nur aufbauen wenn es noch kein Socket gibt
            if(socket){
                socket.emit('changeStatus', myStatus);
                return true;
            }
            
            socket = io.connect('http://www.finalfantasy-14.de:3000');

            // on connection to server, ask for user's name with an anonymous callback
            socket.on('connect', function(){
               // call the server-side function 'adduser' and send one parameter (value of prompt)
                   socket.emit('adduser', userName, myStatus);
            });

            socket.on('updateusers', function (usernames) {
                
               if($('chatbox_userlist')){
                   
                   $('chatbox_userlist').set('html', '');
               
                    Object.each(usernames, function(data){
                        var username = data.username;
                        var newElement = new Element('div', {'class':'user'});
                        //
                        if(data.mobile){
                           username = username.replace('[mobile]', ''); 
                        }
                        newElement.set('html', username);
                        newElement.inject($('chatbox_userlist'), 'bottom');
                        
                        var image = "bullet";
                        if(data.mobile){
                            image = "Android_Robot";
                        }
                        
                        if(data.status && data.status === 'hidden'){
                            var newImg = new Element('img', {'src': "/bundles/sitelayout/images/icons/"+image+"_red.png"});
                        } else {
                            var newImg = new Element('img', {'src': "/bundles/sitelayout/images/icons/"+image+"_green.png"});
                        }
                        newImg.inject(newElement, 'top');
                        if(data.username === userName){
                            newElement.set('id', 'chatbox_me');
                            newImg.set('id', 'chatbox_me_icon');
                        }
                    });
                }
            });

            // listener, whenever the server emits 'updatechat', this updates the chat body
            socket.on('writeMessages', function (data) {
                data.each(function(messageData){
                    writeMessage(messageData);
                });
                
            });

            // listener, whenever the server emits 'updatechat', this updates the chat body
            socket.on('writeMessage', function (data) {
                writeMessage(data);
            });

            socket.on('updatechatlog', function (username, data) {
               //var newElement = new Element('div');
               //var html = '<b>'+username+':</b> '+data+'<br />';
               //newElement.set('html', html);
               //newElement.inject($('chatbox_log'), 'top');
            });

            // listener, whenever the server emits 'updaterooms', this updates the room the client is in
            socket.on('updaterooms', function(rooms, current_room) {

            });
            
            if($('conversation')){
               new Fx.Scroll($('conversation')).toBottom(); 
            }
        }

        $('chatbox_header').addEvent('click', function() {
            
            if(!userName){
                userName = prompt("Gibt deinen namen ein oder Logge dich ein!");
            }
            
            if(userName){
                $('chatbox_container').toggle();
                if(myStatus === "visible"){
                    myStatus = "hidden";
                } else {
                    myStatus = "visible";
                    $('chatbox_new_message').setStyle('display', 'none');
                }
            }
            
            if(userName){
                connectToChat();
                if(myStatus === "visible"){
                    $('data').focus();
                }
                if($('conversation')){
                    new Fx.Scroll($('conversation')).toBottom(); 
                }
            }
        });
        

        // when the client clicks SEND
        $('datasend').addEvent('click', function() {
            var message = $('data').get('value');
            $('data').set('value', '');
            $('data').set('html', '');
            if(socket && message && message !== ""){
                // tell server to execute 'sendchat' and send along one parameter
                socket.emit('sendchat', message);
            }
            $('data').focus();
            return false;
        });

        // when the client hits ENTER on their keyboard
        $('data').addEvent('keypress', function(e) {
            if(e.code == 13) {
                $(this).blur();
                $('datasend').fireEvent('click');
                if(e){
                    e.preventDefault();
                }
            }
        });
        
        $('data').addEvent('visibilitychange', function(e) {
            if(e.code == 13) {
                $(this).blur();
                $('datasend').fireEvent('click');
            }
        });
        
        // Now use it!
        document.addEvent(visibilityChange, function(e) {
            if(socket && e.visibilityState){
                socket.emit('changeStatus', e.visibilityState);
            }
        });
        
        $('chatbox_header').addClass('active');
        
        
    } else {
        if($('chatbox_offline')){
            $('chatbox_offline').set('html', 'offline');
        }
    }
    
});
