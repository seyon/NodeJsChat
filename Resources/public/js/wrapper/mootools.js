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

