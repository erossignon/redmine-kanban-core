
// module.exports =  require("harmony-collections");



function HashMap(iteratable) {

   // TODO __defineGetter : length as a readonly property
   Object.defineProperty(this,"length", { get: function(){return this.size(); },  enumerable: false });

   this._internal = {};
   if (iteratable) {
        for (v in iteratable) { this.set(v,iteratable[v]);  }
}
}

HashMap.prototype.set = function(key, value) {
  "use strict";
  this._internal[key] = value;
};

HashMap.prototype.has = function(key) {
    return typeof this._internal[key] === 'undefined' ? false: true;
};

/**
 * Returns the value associated to the key, or undefined if there is none.
 */
HashMap.prototype.get = function(key) {
  "use strict";
  return this._internal[key];
};

HashMap.prototype.size = function() {
  "use strict";
  var count = 0;
  for (var prop in this._internal) {
    if(this._internal.hasOwnProperty(prop)) {
      count++;
    }
  }
  return count;
};

HashMap.prototype.forEach = function(func) {
  "use strict";
  for (var prop in this._internal) {
    if(this._internal.hasOwnProperty(prop)) {
      func(this._internal[prop],prop);
    }
  }
};

exports.HashMap = HashMap;

