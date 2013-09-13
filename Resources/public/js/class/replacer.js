
var ChatReplacer = new function() {
  
  
    this.replace = function(text, username){        
        // create "ME" Emote
        text = text.replace(/\/me(.*)/, '<span class="emote">'+username+' $1</span>');
        // create URLs
        var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        text = text.replace(exp,"<a href='$1' target='_blank'>$1</a>"); 
        return text;
    };
    
};