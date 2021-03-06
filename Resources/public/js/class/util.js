
var ChatUtil = new function() {

    this.usort = function(inputArr, sorter) {
        // http://kevin.vanzonneveld.net
        // +   original by: Brett Zamir (http://brett-zamir.me)
        // +   improved by: Brett Zamir (http://brett-zamir.me)
        // %        note 1: This function deviates from PHP in returning a copy of the array instead
        // %        note 1: of acting by reference and returning true; this was necessary because
        // %        note 1: IE does not allow deleting and re-adding of properties without caching
        // %        note 1: of property position; you can set the ini of "phpjs.strictForIn" to true to
        // %        note 1: get the PHP behavior, but use this only if you are in an environment
        // %        note 1: such as Firefox extensions where for-in iteration order is fixed and true
        // %        note 1: property deletion is supported. Note that we intend to implement the PHP
        // %        note 1: behavior by default if IE ever does allow it; only gives shallow copy since
        // %        note 1: is by reference in PHP anyways
        // *     example 1: stuff = {d: '3', a: '1', b: '11', c: '4'};
        // *     example 1: stuff = usort(stuff, function (a, b) {return(a-b);});
        // *     results 1: stuff = {0: '1', 1: '3', 2: '4', 3: '11'};
        var valArr = [],
          k = '',
          i = 0,
          strictForIn = false,
          populateArr = {};

        if (typeof sorter === 'string') {
          sorter = this[sorter];
        } else if (Object.prototype.toString.call(sorter) === '[object Array]') {
          sorter = this[sorter[0]][sorter[1]];
        }

        // BEGIN REDUNDANT
        this.php_js = this.php_js || {};
        this.php_js.ini = this.php_js.ini || {};
        // END REDUNDANT
        strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js.ini['phpjs.strictForIn'].local_value !== 'off';
        populateArr = strictForIn ? inputArr : populateArr;


        for (k in inputArr) { // Get key and value arrays
          if (inputArr.hasOwnProperty(k)) {
            valArr.push(inputArr[k]);
            if (strictForIn) {
              delete inputArr[k];
            }
          }
        }
        try {
          valArr.sort(sorter);
        } catch (e) {
          return false;
        }
        for (i = 0; i < valArr.length; i++) { // Repopulate the old array
          populateArr[i] = valArr[i];
        }

        return strictForIn || populateArr;
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
    };
    
    this.createTimeString = function(date){
        var h = date.getHours();
        if(h.toString().length <= 1){
            h = '0'+h;
        }
        var m = date.getMinutes();
        if(m.toString().length <= 1){
            m = '0'+m.toString();
        }
        return h+':'+m;
    };
    
    this.createDateString = function(date){
        var d = date.getDay();
        if(d.toString().length <= 1){
            d = '0'+d;
        }
        var m = date.getMonth();
        if(m.toString().length <= 1){
            m = '0'+m.toString();
        }
        var y = date.getYear();
        if (y < 999){
          y += 1900;
        }
        return d+'.'+m+'.'+y;
    };
};