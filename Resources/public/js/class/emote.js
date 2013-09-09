
var ChatEmote = new function() {
  
  
    this.replace = function(text, username){        
        text = text.replace(/\/me(.*)/, '<span class="emote">'+username+' $1</span>');
        return text;
    };
    
};