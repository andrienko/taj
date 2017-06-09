var Taj = function (initVal, links) {
  this.__queue = [];
  this.__links = {};
  this.__error_handler = function () {
  };
  if (initVal) this.set(initVal);
  if (links) this.link(links);
};

Taj.prototype = {
  __queue: null, __links: null, __error_handler: null,
  __nextStep: function () {
    var that = this;
    if (this.__queue.length) {
      var call_info = this.__queue.shift();
      var cb = this.__links[call_info.name];

      var outputFn = function (output) {
        that.output = output;
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
        this.__error_handler('Error in ' + call_info.name + ':', call_info, cb, e);
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
  go: function (callback) {
    if (typeof callback === 'function') {
      this.onReady(callback);
    }
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
    if (typeof name == 'object') {
      for (var ln in name) {
        if (name.hasOwnProperty(ln)) {
          this.link(ln, name[ln]);
        }
      }
    } else {
      if (Object.keys(Taj.prototype).indexOf(name) != -1) {
        this.__error_handler(name, ' is not allowed as a name of link.');
      } else {
        var that = this;
        if (typeof callback == 'function') {
          this.__links[name] = callback;
          this[name] = function () {
            that.__queue.push({name: name, args: arguments});
            return that;
          };
        } else {
          this.__error_handler(callback, ' is not a function ');
        }
      }
    }

    return this;
  }
};

module.exports = Taj;