/*

  HTML5 Track

    wrapper for html5 media element

*/

var u      = require('./utils')
var events = require('./events')
var detect = require('./detect')
var debug  = require('./debug');

var HTML5Track = function(name, opts, mix) {

  var track = this;

  var defaults = {

    source: false,   // path to audio source (without file extension) OR html5 <audio> or <video> element

    gain:        1,  // initial/current gain (0-1)

    start:       0,  // start time in seconds
    cachedTime:  0,  // local current time (cached for resuming from pause)
    startTime:   0,  // time started (cached for accurately reporting currentTime)

    looping:  false, //
    autoplay: true,  // play immediately on load
    muted:    (mix.muted) ? true : false
  };

  // override option defaults
  track.options = u.extend(defaults, opts || {});

  track.name = name;

  // Status
  track.status = {
    loaded:  false,
    ready:   false,
    playing: false
  }

  track.mix = mix;  // reference to parent

  track.events = {};
  track.tweens = {};

  track.element = undefined; // html5 <audio> or <video> element


  debug.log(1, 'createTrack "' + track.name + '", mode: "html5", autoplay: ' + track.options.autoplay);

  // Load
  // ~~~~

  if(typeof track.options.source === 'string' && track.options.source.indexOf('blob:') !== 0) {
    // append extension only if it’s a file path
    track.options.source  += track.mix.options.fileTypes[0];

    track.element = document.createElement('audio');

  } else if(typeof track.options.source === 'object') {
    track.element = track.options.source;
    track.source = track.element.src;
  }

  track.useElement();

};


/*

  Event Functionality

*/
HTML5Track.prototype.on      = events.on;
HTML5Track.prototype.one     = events.one;
HTML5Track.prototype.off     = events.off;
HTML5Track.prototype.trigger = events.trigger;






/*

  Load

*/
HTML5Track.prototype.useElement = function() {
  var track = this;

  // Add options if they're set.
  if (track.options.looping)  track.element.loop  = true;
  if (track.options.muted)    track.element.muted = true;
  if (track.options.autoplay) track.element.autoplay = true;

  // Event listeners
  var ready = function() {
    track.status.loaded = true
    if(track.options.autoplay) track.play();
    track.trigger('load', track);
  }

  track.element.addEventListener('load', ready, false);
  track.element.addEventListener('canplaythrough', ready, false);

  track.element.addEventListener('error', function() { track.trigger('loadError') });

  track.element.src = track.options.source;
  track.element.load();
}



/*

  Play

*/
HTML5Track.prototype.play = function() {

  var track = this;

  debug.log(1, 'Playing track "' + track.name + '" >')

  track.gain(track.options.gain);

  track.status.ready = true;
  track.element.play();
  track.trigger('play', track);

  return track
}


/*

  Pause

*/

HTML5Track.prototype.pause = function(at) {
  var track = this;
  if(!track.status.ready || !track.status.playing) return;

  track.element.pause();
  debug.log(2, 'Pausing track "' + track.name + '" at ' + track.options.cachedTime)
  track.trigger('pause', track);

  return track
}


//  #### ###### ######  ######
// ##      ##  ##    ## ##   ##
//  ####   ##  ##    ## ######
//     ##  ##  ##    ## ##
// #####   ##   ######  ##

HTML5Track.prototype.stop = function() {
  var track = this;

  if(!track.status.ready || !track.status.playing) return;

  track.element.pause();
  track.element.currentTime = 0;

  track.status.playing = false;
  track.trigger('stop', track);

  debug.log(2, 'Stopping track "' + track.name)

  return track
}





function dummy(){ return this }

HTML5Track.prototype.pan = dummy
HTML5Track.prototype.tweenPan = dummy



//  #####   #####  #### ###  ##
// ##      ##   ##  ##  #### ##
// ##  ### #######  ##  ## ####
// ##   ## ##   ##  ##  ##  ###
//  #####  ##   ## #### ##   ##

// Gain getter/setter
HTML5Track.prototype.gain = function(val) {
  var track = this;

  if(typeof val === 'number') {

    val = u.constrain(val, 0, 1); // normalize value

    track.element.volume = val * track.mix.options.gain;

    debug.log(2, '"' + track.name + '" setting gain to ' + track.options.gain);
    track.trigger('gain', track.options.gain, track);

    return track;
  }

  return track.element.volume
}

HTML5Track.prototype.tweenGain = function(_val, _tweenDuration) {
  var track = this;

  if(typeof setTo !== 'number' || typeof duration !== 'number')
    throw new Error('Invalid arguments to tweenGain()');

  // replace existing gain tween
  if(track.tweens.gain) track.tweens.gain.stop()

  track.tweens.gain = new TWEEN.Tween({ currentGain: track.options.gain })
    .to({ currentGain: _val }, _tweenDuration)
    .easing(TWEEN.Easing.Sinusoidal.InOut)
    .onUpdate(function() {
      track.gain(this.currentGain)
    })
    .start()

}

HTML5Track.prototype.mute = function() {
  this.options.muted = true;
  return this;
}

HTML5Track.prototype.unmute = function() {
  this.element.muted = false;
  return this;
}



/*

  ###### #### ###  ### ######
    ##    ##  ######## ##
    ##    ##  ## ## ## #####
    ##    ##  ##    ## ##
    ##   #### ##    ## ######

*/

// set/get
HTML5Track.prototype.currentTime = function(setTo) {
  if(!this.status.ready) return;
  var track = this;

  if(typeof setTo === 'number') {
    debug.log(2, 'setting track "' + track.name + '" to time', setTo)
    track.element.currentTime = setTo;
    return track
  }

  return track.element.currentTime;
}

// 00:01/00:02
HTML5Track.prototype.formattedTime = function(includeDuration) {
  if(includeDuration)
    return u.timeFormat(this.currentTime()) + '/' + u.timeFormat(this.duration());
  else
    return u.timeFormat(this.currentTime());
}

HTML5Track.prototype.duration = function() {
  return this.element.duration || 0;
}

module.exports = HTML5Track;
