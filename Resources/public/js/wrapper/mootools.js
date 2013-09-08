var Wrapper = new function() {
        
    this.addEvent = function(elementId, event, func){
        if($(elementId)){
            $(elementId).addEvent(event, function(e){
                func(e);
            });
        }
    };
    
    this.fireEvent = function(elementId, event){
        if($(elementId)){
            $(elementId).fireEvent(event);
        }
    };
    
    this.scrollToBottom = function(elementId){
        if($(elementId)){
            new Fx.Scroll($(elementId)).toBottom();
        }
    };
    
    this.setFocus = function(elementId){
        if($(elementId)){
            $(elementId).focus();
        }
    };
}

