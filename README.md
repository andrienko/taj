Taj
===
Taj Asynchronous Jammer is a yet another piping mechanism for JS.

Here's an example of use:

    var Taj = require('./taj');
    var chain = new Taj();
    
    // Creating new callback
    chain.registerCallback('add',function(pass, value){
      pass(this+value); // this will be the walue ".run" function below is called with.
    });
    
    // now "add" function is registered and can be chained
    
    // Adding it to chain's queue. Twice
    chain
      .add(', world')
      .add('!');
    
    // Running the chain
    chain.run('Hello',function(){
      console.log(this);
    });
    
    // Output will be 'Hello, world!' as a String
    // (primitive gets transformed to obj after passed through apply)
    
The idea is you register several functions and define a queue of them and their arguments. 

You can register multiple functions at once using `.registerCallbacks` method, passing it an object which keys will be
funciton names and values should be callbacks.

You may use .then to add a function to the queue without registering it

    chain
      .then(function(pass){
          pass(this+'test');
      })
      
 - You can also pass parameters array as a second argument of `.then`, these will be applied just like with registered
functions.
 - If you need a different queue - normally you should create a different chain (different Taj object), but also you can
 use the `.resetQueue` method, that will clear the queue.
 - getFunction method will return a function that does the same as if you wrote chain.run
 - You can access queue and callbacks via chain.__state value 
 - When passing primitive values through the chain - the object will be returned (because `apply` is used). If you want
 to explicitly use primitive values the best way would be wrapping them with an object, something like 
 `.run({value: 'Hello'}, function(){ ... })`

