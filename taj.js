

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