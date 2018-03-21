

(function(global, varname){

  var Lib = function () {
    if(!this instanceof Lib) return new Lib();
    this.__state = {
      queue: [],
      callbacks: {},
      events: {}
    }
  };

  Lib[varname] = Lib;

  var isValidCallbackName = function(name){
    return !Lib.prototype.hasOwnProperty(name);
  }

  var addQueueStep = function(object, callback, arguments){
    var queueObject = {
      callback: callback,
      arguments: arguments
    };
    object.__state.queue.push(queueObject);
  }

  var registerCallback = function(object, name, callback){
    if(isValidCallbackName(name)){
      object[name]=function(){
        addQueueStep(object,callback,arguments);
        return this;
      }
    }
  };

  var TajEvent = function(target, name, data){
    this.eventName = name;
    this.data = data;
    this.target = target;
  };

  var triggerEvent = function(object, eventName, eventData){
    if(object.__state.events[eventName] === undefined){
      return;
    }
    var event = new TajEvent(object,eventName,eventData || {})
    object.__state.events[eventName].forEach(function(callback){
      callback.call(object,event);
    })
  };

  Lib.prototype.addEventListener = function(eventName, callback){
    if(typeof callback !== 'function'){
      return;
    }
    if(this.__state.events[eventName] === undefined) this.__state.events[eventName] = [];
    this.__state.events[eventName].push(callback);
    return this;
  };

  Lib.prototype.__state = {queue:[],callbacks:{},events:{}};

  Lib.prototype.registerCallback = function(name, callback){
    if(typeof callback === 'function'){
        registerCallback(this, name, callback);
    }
    return this;
  };

  Lib.prototype.resetQueue = function(){
    this.__state.queue.queue.length = 0;
    return this;
  };

  Lib.prototype.registerCallbacks = function(callbacks){
    for (var callbackName in callbacks) {
      if (callbacks.hasOwnProperty(callbackName)) {
        this.registerCallback(callbackName, callbacks[callbackName]);
      }
    }
    return this;
  };

  Lib.prototype.run = function(thisArgument, finalCallback){
    var thisArg = thisArgument;
    var instance = this;
    var queueCounter = 0;
    var nextStep = function(){
      if(queueCounter<instance.__state.queue.length){
        var queueStep = instance.__state.queue[queueCounter++];

        var pass = function(value){
          triggerEvent(instance, 'next',value);
          thisArg = value;
          nextStep();
        };
        pass.error = function(error){
          triggerEvent(instance,'error',error);
        };
        pass.pass = function(){
          triggerEvent(instance, 'pass');
          nextStep();
        };

        queueStep.callback.apply(thisArg, [].concat.apply([pass], queueStep.arguments));
      } else {
        if(typeof finalCallback === 'function') {
          triggerEvent(instance, 'done',thisArg);
          finalCallback.apply(thisArg, []);
        }
      }
    };
    nextStep();
    return this;
  };

  Lib.prototype.then = function(callback,args){
    addQueueStep(this,callback,args||[]);
    return this;
  };

  Lib.prototype.getFunction = function(){
    var chain = this;
    return function (){
      chain.run.apply(chain, arguments);
    }
  };


  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Lib;
  } else {
    global[varname] = Lib;
  }

})(this, 'Taj');


var da = function () {
  var Taj = function (initVal, links) {
    this.__queue = [];
    this.__links = {};
    this.__error_handler = function () {
    };
    if (initVal) this.set(initVal);
    if (links) this.link(links);
  };

  var TajErr = function (type, exception, text, data) {
    this.type = type;
    this.exception = exception;
    this.text = text;
    this.data = data;
  }

  Taj.prototype = {
    __queue: null, __links: null, __error_handler: null,
    __nextStep: function () {
      var that = this;
      if (this.__queue.length) {
        var call_info = this.__queue.shift();

        var cb;

        if (call_info.type === 'link') {
          cb = this.__links[call_info.name];
        } else if (call_info.type === 'anonymous') {
          cb = call_info.callback;
        }

        var outputFn = function (output) {
          if (typeof output !== 'undefined') that.output = output;
          that.__nextStep();
        };
        outputFn.pass = function () {
          that.__nextStep();
        };
        outputFn.error = function (err) {
          that.__error_handler(err);
        };
        outputFn.chain = this;

        try {
          cb.apply(outputFn, [this.output, outputFn].concat([].slice.call(call_info.args)));
        } catch (e) {
          this.__error_handler(new TajErr('callback_error', e, 'Error in ' + (call_info.name === undefined ? 'anonymous link' : call_info.name), call_info));
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
      if (value !== undefined) this.set(value);
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
          this.__error_handler(new TajErr('wrong_link_name', undefined, name + ' is not allowed as a name of link.', name));
        } else {
          var that = this;
          if (typeof callback === 'function') {
            this.__links[name] = callback;
            this[name] = function () {
              that.__queue.push({type: 'link', name: name, args: arguments});
              return that;
            };
          } else {
            this.__error_handler(new TajErr('link_not_a_function', undefined, 'Not a function', callback));
          }
        }
      }
      return this;
    },
    next: function (callback) {
      this.__queue.push({type: 'anonymous', callback: callback, args: []});
      return this;
    }
  };
}
