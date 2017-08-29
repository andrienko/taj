Taj
===
Taj is a yet another piping mechanism. I needed something like this one so I wrote one.
Probably in future I will develop it somehow.

To be honest it is a rarther weird mechanism, but it is made to suit perfectly some of my needs.

The story is I wrote it and then decided it's reuseable, so I started picking a cool name for it and it turned out all
the cool suitable names were already taken by dozens of libs doing similar things (yeah, I'm reinventing the wheel
basically, but it's a good thing this time). I'm writing the library for personal use basically, but any help/questions
are welcome.

"taj" stands for "taj asynchronous jammer"

How does it work?
---
It just lets you define a set of methods and then chain them, passing arguments if necessary and passing a (single)
variable through the pipe if needed.

That is - first you define methods, and only then run all or some of them. By chaining you are not running anything -
instead you are adding methods to queue, that will be launched only when you call a `go()` method. 

My usual problem is organizing async code. I believe there's no need in promises and deferred calls - because one could
simply define a set of methods inside some kind of objects and call them from inside of each other in whatever order
one needs. 
 
### Usage

You have to create an instance and add methods to it (you can pass them in constructor). Then (if you need it) you set 
the initial value and chain methods you've just defined. Then you add the last, `.go` method, which receives a function
that will be called once the chaining is done. The function will receive the resulting value (if there were any).

    var taj = require('taj');
    
    var chain = new taj();

    // Define the method called "upper"

    // Methods receive two parameters - the current value
    // and the callback that should be called once everything
    // is done (instead of return)

    chain.link('upper', function (input, output){
         output(input.toUpperCase())
    });


    // In addition, they will receive all the arguments
    // you pass while chaining:

    chain.link('add', function (input, output, string) {
        output(input + string);
    });
    
    // Now you can chain methods you've defined:

    chain.set('hello')               // setting the initial value

      .add(', world!')                 
      .upper()
      .add('.. Hey!')

      .go(function (output) {        // command to start chain
          console.log(output);       // that receives a callback
        }                            // that will be called once
      )                              // chaining is done
    ;

You can shorten things up by passing initial value and chain links inside the constructor:

    var chain = new taj('hello',{
      upper:function (input, output){
        output(input.toUpperCase())
      },
      add:function (input, output, string) {
        output(input + string);
      }

    });

That is pretty much all

### Methods

Some method names are reserved and you can not use them as names for your links (well you can, but it may break
something)

#### link

Creates a "link" in your "chain". Creating a link does not run your code - instead it creates the method of your
chaining object. So, after typing

    var chain = new taj([]);
    chain.link('hero', function(heroes,output,name){
      heroes.push(name);
      output(heroes);
    });

You create a new method you can call:

    chain.hero('batman').hero('iron man').go(function(heroes){
      console.log('Superheroes: ' + heroes.join(', '));
    });

This should output "Superheroes: batman,iron man"

#### next (callback)

Adds an anonymous link to the execution pipe

#### onError (callback)

Defines an error logger. This is not really meant for exceptions catching tho. Only to not depend on console.

the lib silently ignores errors in your links by default. You can use the onError method to set error handler

    new taj()
        .link('test',function(){meh();})
        .onError(function(error_obj){console.log(error_obj.text, error_obj.exception);})
        .test()
        .go();

Should output something like `Error in test [ReferenceError: meh is not defined]`

#### onReady (callback)

Defines a callback that will be executed when chaining methods are finished.
Will receive a current value if it is defined/used

#### set (name, callback)

Sets the value of the output. You could have written this method yourself: 

    taj.link('set', function(input,output,value){ output(value) });

#### go([callback], [value])

Nothing will be executed until this method is called. 

- If callback is passed - it will be same as calling `onReady(callback).go()`
- If value is passed - it will be same as calling `set(value).onReady(callback).go()`

### So, what about asynchronous calls?

Here's an idea then. Let's imagine we're in browser:

    var AJAX = new taj('', {
      getBody:function (input, output, url) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
    
        request.onload = function () {
          var result = '';
          if(this.status>=200 && this.status<400){
            try{
              result = JSON.parse(this.response);
            } catch (e) {}
          }
          output(result);
        }

      }
    });

Now, calling something like this:
    
    AJAX.getBody('http://your.url').go(function (data) {
      console.log(data);
    });

..will result in parsed JSON (or an empty string on error) to be outputted to console.

Yeah, you could've done that with jQuery's chaining mechanism. Or promises. Or whatever.

### Caveats

 - The "output" function is also passed as `this` argument to all the links. Also it has two properties - `chain`, which contains a link to current chain object, and `error` which is a function triggering `onError` callback.
 - Do not forget that objects are passed by link. It can be somehow useful tho
 - The library is for working with async code. You always have to call output function inside your links.