var Taj = function (initVal, links) {
  this.__queue = [];
  this.__links = {};
  this.__error_handler = function () {
  };
  if (initVal) this.set(initVal);
  if (links) this.link(links);
};

var TajErr = function(type, exception, text, data){
  this.type = type;this.exception = exception;this.text = text;this.data = data;
}

Taj.prototype = {
  __queue: null, __links: null, __error_handler: null,
  __nextStep: function () {
    var that = this;
    if (this.__queue.length) {
      var call_info = this.__queue.shift();

      var cb;

      if(call_info.type === 'link') {
        cb = this.__links[call_info.name];
      } else if(call_info.type === 'anonymous'){
        cb = call_info.callback;
      }

      var outputFn = function (output) {
        if(typeof output !== 'undefined') that.output = output;
        that.__nextStep();
      };
      outputFn.pass = function(){
        that.__nextStep();
      };
      outputFn.error = function (err) {
        that.__error_handler(err);
      };
      outputFn.chain = this;

      try {
        cb.apply(outputFn, [this.output, outputFn].concat([].slice.call(call_info.args)));
      } catch (e) {
        this.__error_handler(new TajErr('callback_error', e, 'Error in ' + (call_info.name === undefined?'anonymous link':call_info.name), call_info));
      }
    } else {
      this.atTheEnd(this.output);
    }
    return this;
  },
  set: function (input) {
    this.output = input;
    return this;
  },
  go: function (callback, value) {
    if (typeof callback === 'function') {
      this.onReady(callback);
    }
    if(value !== undefined) this.set(value);
    return this.__nextStep();
  },
  onReady: function (callback) {
    this.atTheEnd = callback;
    return this;
  },
  onError: function (callback) {
    this.__error_handler = callback;
    return this;
  },
  link: function (name, callback) {
    if (typeof name === 'object') {
      for (var ln in name) {
        if (name.hasOwnProperty(ln)) {
          this.link(ln, name[ln]);
        }
      }
    } else {
      if (Object.keys(Taj.prototype).indexOf(name) !== -1) {
        this.__error_handler(new TajErr('wrong_link_name',undefined, name+' is not allowed as a name of link.', name));
      } else {
        var that = this;
        if (typeof callback === 'function') {
          this.__links[name] = callback;
          this[name] = function () {
            that.__queue.push({type:'link', name: name, args: arguments});
            return that;
          };
        } else {
          this.__error_handler(new TajErr('link_not_a_function',undefined,'Not a function', callback));
        }
      }
    }
    return this;
  },
  next: function (callback) {
    this.__queue.push({type:'anonymous', callback:callback, args:[]});
    return this;
  }
};

if(typeof module !== 'undefined' && module.exports) {
  module.exports = Taj;
} else {
  this.Taj = Taj;
}