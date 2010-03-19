/*
 * Copyright (c) 2010 Sharegrove Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
    Animator is simple msjs.base instance that produces values ranging from 
    0 to 100 over a given duration. The animator will call its list of callback
    functions about 30 times a second. Callbacks are guaranteed to be called once and
    only once with the starting and ending values of 0 and 100
    @class A generic animation driver
 */ 
var animConstructor = function(){};

var animator = animConstructor.prototype;



/**
    @constructs
    Makes an animator with the given duration and callback list.
    @param {Number} duration The number of milliseconds for which the animator
    should run.
    @param {Array} callback A function to be called-back by this animator
*/
animator.make = function(duration, callback){
    var anim = new animConstructor();
    anim._callback = callback;
    anim.duration = duration;
    anim._start();
    return anim;
}

animator._from = 0;
animator._to = 100;
animator._value = null;
animator._isRunning = false;
animator.duration = 1000; //default of 1 second

animator.beginPoleDelta = .25;
animator.endPoleDelta = .25;

animator._start = function (){
    if ( this._isRunning ) return;
    this._value = this._from;
    // create direction multiplier
    var dir = 1;

    // set beginPole and endPole values
    if ( this._value < this._to ) {
        this.beginPole = this._value - dir*this.beginPoleDelta;
        this.endPole = this._to + dir*this.endPoleDelta;
    }else{
        this.beginPole = this._value + dir*this.beginPoleDelta;
        this.endPole = this._to - dir*this.endPoleDelta;
    }

    // calculate value for primary_K
    // a default value of 1.0 means the attribute will be static, i.e.
    // the animation will still be calculated but the result will
    // always be the same.
    this.primary_K = 1.0;

    var kN = 1.0*(this.beginPole - this._to )*
                 (this._value - this.endPole);

    var kD = 1.0*(this.beginPole - this._value)*
                 (this._to - this.endPole);

    // NOTE: in future this should probaly check for really small amounts not
    // just zero
    if (kD != 0) this.primary_K = Math.abs(kN/kD);

    this._master.addToUpdate(this);
}

animator._startTime = 0;
animator.advance = function(time){
    if (this._didForceFinish) return true;
    if (this._startTime ==0) this._startTime = time;
    var amDone = false;

    // If this is its first iteration then calc the necessary paramters.
    // Calling this function here allows animators to be added to a queue at
    // different times and then "synced" at start of execution, i.e. next onIdle
    // event.
    var dTime = time - this._startTime;
    var newValue;
    if ( dTime < this.duration ) {
        newValue = this._calcNextValue(dTime);
    } else {
        newValue = this._to;
        amDone = true;
    }
    this._value = newValue;
    try{
        this._callback(newValue);
    }catch (e){
        msjs.log('animation error', e);
    }finally{
        this._isRunning = !amDone;
    }
    return amDone;
}

animator._didForceFinish = false;
animator.forceFinish = function(){
    if (!this._isRunning) return;
    this.advance(Infinity);
    this._didForceFinish = true;
}

animator._calcNextValue = function( timeDifference ) {
    // return the _value by default
    var nextValue  = this._value;

    // shortcuts
    var aEndPole   = this.endPole;
    var aBeginPole = this.beginPole;

    // calculate new "K" value based on time difference
    var K = Math.exp((timeDifference*1.0/this.duration)*
                      Math.log(this.primary_K));

    // calculate nextValue using the pole and new K value
    if( K != 1.0 ) {
       var aNumerator   = aBeginPole*aEndPole*(1 - K);
       var aDenominator = aEndPole - K*aBeginPole;
       if( aDenominator != 0.0 ) nextValue = aNumerator/aDenominator;
    }
    return nextValue;
}

/**
  animator _master is a plain object that prods running
  animators to advance

  Careful: this node isn't packed; it's only active
  on the client */
animator._master = {};
animator._master._updateList = [];

//Be careful! this function can run multi-threaded with a msjs update
//All master list manipulation should happen here
animator._master.advanceAnimators = function (){
    var time = (new Date()).getTime();
    var newList = null;

    for ( var i = 0; i < this._updateList.length; i++ ){
        var anim = this._updateList[i];
        var isDone = anim.advance(time);
        //replace done animators with null
        if (isDone) {
            //untested
            if (!newList) newList = this._updateList.slice(0,i);
        } else if (newList){
            newList.push(anim);
        }

    }

    if (newList) this._updateList = newList;
    while (this._queuedUpdates.length){
        this._updateList.push(this._queuedUpdates.pop());
    }

    if (!this._updateList.length) this.stop();
};

animator._master._queuedUpdates = [];
animator._master.addToUpdate = function(anim){
    //ok to store references, since animators only run on client
    this._queuedUpdates.push(anim);
    //careful not to call update in response to update
    this._start();
}

animator._master._start = function(){
    //client only
    var self = this;
    if (this._domId == null){
        this._domId = setInterval( function(){self.advanceAnimators();}, 33); //roughly 30 fps
    }
}

animator._master.stop = function(){
    if (this._domId != null) clearInterval(this._domId);
    this._domId = null;
}

msjs.publish(animator, "Client");

/*! msjs.server-only **/
animator._start = function (){
    this._callback(100);
};
