(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var mix = require('./modules/mix');
window.HeliosAudioMixer = mix;
},{"./modules/mix":5}],2:[function(require,module,exports){
/*

  Debug

*/

var u = require('./utils')

var debug = {};
module.exports = debug;

// 0 none, 1 only errors, 2 everything
debug.level = 1;

// u.log(1, arg, arg, arg) -> console.log('[Mixer] arg arg arg')
debug.log = function(lvl) {
  if(lvl <= debug.level) {
    var str = '[Mixer] '
    for (var i = 1; i < arguments.length; i++)
      str += arguments[i] + ' '
    console.log(str)
  }
}

debug.setLogLvl = function(lvl) {
  this.debug = u.constrain(lvl, 0, 2);
  debug.log(0, 'Set log level:', lvl)
}
},{"./utils":8}],3:[function(require,module,exports){
var detect = {};

/*

  Media types

*/

detect.audioTypes = (function() {
  var el = document.createElement('audio')

  return {
    '.m4a': !!(el.canPlayType && el.canPlayType('audio/mp4; codecs="mp4a.40.2"').replace(/no/, '')),
    '.mp3': !!(el.canPlayType && el.canPlayType('audio/mpeg;').replace(/no/, '')),
    '.ogg': !!(el.canPlayType && el.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''))
  }
})();

detect.videoTypes = (function() {
  var el = document.createElement('video');

  return {
    '.webm': !!(el.canPlayType && el.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/no/, '')),
    '.mp4':  !!(el.canPlayType && el.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, '')),
    '.ogv':  !!(el.canPlayType && el.canPlayType('video/ogg; codecs="theora"').replace(/no/, ''))
  }
})();

/*

  Dependecies

*/

detect.browser = (function() { return window.bowser || false; })();
detect.tween   = (function() { return window.TWEEN || false })();

/*

  Browser features

*/
detect.webAudio = (function(){
  var webAudio = !!(window.AudioContext || window.webkitAudioContext);

  var badff  = !!(detect.browser.name === 'Firefox' && detect.version && detect.version < 25);
  var badios = !!(detect.browser.ios === true && detect.browser.version === 7)

  if(badff || badios) webAudio = false;

  return webAudio;
})();

detect.promise = (function(){
  return 'Promise' in window
      && 'resolve' in window.Promise
      &&  'reject' in window.Promise
      &&     'all' in window.Promise
})();

detect.supported = (function(){
  return (detect.browser && detect.tween && detect.webAudio && detect.promise)
})()


module.exports = detect;
},{}],4:[function(require,module,exports){
/*

  Simple event system

*/
var Events = function(){

  var events = {};

  return {
    on:      on,
    one:     one,
    off:     off,
    trigger: trigger
  }

  function on(type, callback) {
    events[type] = events[type] || [];
    events[type].push({
      id: (new Date).getTime(),
      cb: callback
    });

    return this
  }

  // todo: make this not wipe out other events of its type
  function one(type, callback) {
    var _this = this
    events[type] = events[type] || [];

    var id = (new Date).getTime();
    var cb = function(){
      _this.off(type, id);
      callback(_this);
    };

    events[type].push({ id: id, cb: cb });

    return this
  }

  function off(type, id) {
    if(type === '*'){
      events = {};
    } else if( !!(type) && typeof id !== 'undefined' ){
      for (var i = events[type].length - 1; i >= 0; i--) {
        if( events[type][i].id === id ){
          events[type].splice(i,1);
        }
      };
    } else {
      events[type] = [];
    }

    return this
  }

  function trigger(type) {
    if(!events[type]) return;
    var _this = this

    var args = Array.prototype.slice.call(arguments, 1);

    if(events[type].length)
      events[type].forEach(function(f){
        f.cb.apply(_this, args);
      })
  }
}

module.exports = Events;
},{}],5:[function(require,module,exports){
/*

  ###  ### #### ##   ##
  ########  ##   ## ##
  ## ## ##  ##    ###
  ##    ##  ##   ## ##
  ##    ## #### ##   ##

*/

var u          = require('./utils')
var events     = require('./events')
var Track      = require('./track')
var html5Track = require('./track-html5')
var detect     = require('./detect')
var debug      = require('./debug')


var Mix = function(opts) {

  var mix = this;

  var defaults = {
    fileTypes: [ '.mp3', '.m4a', '.ogg' ],
    html5: !detect.webAudio,
    gain: 1, // master gain for entire mix
  }

  this.options = u.extend(defaults, opts || {});

  this.setLogLvl = debug.setLogLvl

  this.tracks  = [];    // tracks as numbered array
  this.lookup  = {};    // tracks as lookup table: lookup['trackname']

  this.muted   = false; // master mute status

  this.context = null;  // AudioContext object (if webAudio is available)

  this.detect  = detect; // external reference to detect object


  this.update = update;
  this.report = report;

  this.extend = u.extend; // expose reference to extend so plugins can use it

  // File Types
  // ********************************************************

  for (var i = this.options.fileTypes.length - 1; i >= 0; i--) {
    if(!detect.audioTypes[ this.options.fileTypes[i] ])
      this.options.fileTypes.splice(i, 1);
  }

  if(this.options.fileTypes.length <= 0) {
    console.warn('Can’t initialize: none of the specified audio types can play in this browser.')
    return;
  }


  // Initialize
  // ********************************************************

  if(detect.webAudio){
    this.context = (typeof AudioContext === 'function' ? new window.AudioContext() : new window.webkitAudioContext() )
  }

  debug.log(1, 'initialized,', (detect.webAudio ? 'Web Audio Mode,' : 'HTML5 Mode,'), 'can play:', this.options.fileTypes)


  // ********************************************************

  function update() {
    TWEEN.update();
    mix.tracks.forEach(function(track){
      track.updateTimelineEvents();
    })
  };

  function report(){
    var report = ""
    for (var i = 0; i < mix.tracks.length; i++)
      report += mix.tracks[i].gain() + '\t' + mix.tracks[i].currentTime() + '\t' + mix.tracks[i].name + '\n'
    console.log(report)
  }

};

/*

  Event Functionality

*/
Mix.prototype.on      = events.on;
Mix.prototype.one     = events.one;
Mix.prototype.off     = events.off;
Mix.prototype.trigger = events.trigger;


/**************************************************************************

  Track Management

**************************************************************************/

Mix.prototype.createTrack = function(name, opts) {
  var mix = this;

  if(!name){
    throw new Error('Can’t create track with no name');
    return;
  }

  if(mix.lookup[name]) {
    debug.log(0, 'a track named “' + mix.name + '” already exists')
    return false;
  }

  var track = mix.options.html5 ? new html5Track(name, opts, mix) : new Track(name, opts, mix);

  // if(track.error) throw new Error(track.error);

  mix.tracks.push(track);
  mix.lookup[name] = track;

  return track;
};




Mix.prototype.removeTrack = function(_input) {

  var mix = this;

  // _input can be either a string or a track object
  var trackName;
  if(typeof _input === 'string')
    trackName = _input
  else if(typeof _input === 'object' && _input.name)
    trackName = _input.name

  var track = mix.lookup[trackName];

  if(!track) {
    debug.log(1, 'can’t remove "' + trackName + '", it doesn’t exist');
    return;
  }


  var rest  = [];
  var arr   = mix.tracks;
  var total = arr.length;

  for (var i = 0; i < total; i++) {
    if(arr[i] && arr[i].name === trackName) {
      rest = arr.slice(i + 1 || total);
      arr.length = (i < 0) ? (total + i) : (i);
      arr.push.apply(arr, rest);
    }
  }

  track.pause();
  track.events = [];

  // stop memory leaks!
  if(track.element)
    track.element.src = '';

  track.trigger('remove', mix);

  track = null;
  delete mix.lookup[trackName];
  debug.log(2, 'Removed track "' + trackName + '"');

};


Mix.prototype.getTrack = function(name) {
  return this.lookup[name] || false;
};





/**************************************************************************

  Global Mix Control

**************************************************************************/

Mix.prototype.pause = function() {

  debug.log(2, 'Pausing ' + this.tracks.length + ' track(s) ||')

  for (var i = 0; i < this.tracks.length; i++)
    this.tracks[i].pause()
};

Mix.prototype.play = function() {

  debug.log(2, 'Playing ' + this.tracks.length + ' track(s) >')

  for (var i = 0; i < this.tracks.length; i++)
    this.tracks[i].play()
};

Mix.prototype.stop = function() {
  debug.log(2, 'Stopping ' + this.tracks.length + ' track(s) .');
  this.tracks.forEach(function(track){
    track.stop();
  })
};




Mix.prototype.mute = function() {
  if(this.muted) return
  this.muted = true
  debug.log(2, 'Muting ' + this.tracks.length + ' tracks')
  for (var i = 0; i < this.tracks.length; i++)
    this.tracks[i].mute();
};


Mix.prototype.unmute = function() {
  if(!this.muted) return
  this.muted = false
  debug.log(2, 'Unmuting ' + this.tracks.length + ' tracks')
  for (var i = 0; i < this.tracks.length; i++)
    this.tracks[i].unmute();
};



Mix.prototype.gain = function(masterGain) {
  if(typeof masterGain === 'number') {
    masterGain = u.constrain(masterGain, 0, 1);
    this.options.gain = masterGain;

    // tracks multiply their gain by the mix’s gain, so when
    // we change the master gain we need to call track.gain()
    // to get the intended result
    for (var i = 0; i < this.tracks.length; i++)
      this.tracks[i].gain(this.tracks[i].gain());
  }

  return this.options.gain;
}



module.exports = Mix;
},{"./debug":2,"./detect":3,"./events":4,"./track":7,"./track-html5":6,"./utils":8}],6:[function(require,module,exports){
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
  return new Promise(function(resolve, reject){
    if(typeof _val !== 'number' || typeof _tweenDuration !== 'number') reject(Error('Invalid value for duration.'))
    debug.log(2, '"' + track.name + '" tweening gain ' + track.options.gain + ' -> ' + _val + ' ('+_tweenDuration+'ms)')

    // replace existing gain tween
    if(track.tweens.gain) track.tweens.gain.stop()

    track.tweens.gain = new TWEEN.Tween({ currentGain: track.options.gain })
      .to({ currentGain: _val }, _tweenDuration)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .onUpdate(function() {
        track.gain(this.currentGain)
      })
      .onComplete(function() {
        resolve(track)
      })
      .start()

  })
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

},{"./debug":2,"./detect":3,"./events":4,"./utils":8}],7:[function(require,module,exports){
/*

  ###### #####   #####   ##### ##  ##
    ##   ##  ## ##   ## ##     ## ##
    ##   #####  ####### ##     ####
    ##   ##  ## ##   ## ##     ## ##
    ##   ##  ## ##   ##  ##### ##  ##

*/

var u      = require('./utils');
var detect = require('./detect');
var debug  = require('./debug');
var Events = require('./events');

var Track = function(name, opts, mix){
  var track = this;

  if(!opts.source)
    throw new Error('Can’t create a track without a source.');

  var nodeCreators = {
    analyse:    createAnalyse,
    gain:       createGain,
    panner:     createPanner,
    convolver:  createConvolver,
    compressor: createCompressor
  };

  // validate node types
  var nodeError = false;
  if(opts.nodes)
    if(opts.nodes.length){
      opts.nodes.forEach(function(node){
        if( typeof node === 'string' && !nodeCreators[node] )
            nodeError = '"'+node+'" is an unsupported node type';
      })
    }
  if(nodeError) throw new Error(nodeError)

  var defaults = {

    sourceMode: 'buffer', // 'buffer' 'element' 'mediaStream'

    source: false,   // path to audio source (without file extension)

    nodes:      [],  // array of strings: names of desired additional audio nodes

    gain:        1,      // initial/current gain (0-1)
    gainCache:   false,  // for resuming from mute

    pan:         0,  // circular horizontal pan

    panX:        0,  // real 3d pan
    panY:        0,  //
    panZ:        0,  //

    // html5 media-style state
    loop:      false,
    autoplay:  true,
    muted:    (mix.muted) ? true : false
  };

  // override option defaults
  var options = u.extend(defaults, opts || {});

  // todo: handle this elsewhere?
  if(options.gainCache === false)
    options.gainCache = options.gain;

  var status = {
    loaded:  false, // media is loaded
    ready:   false, // nodes are created, we’re ready to play
    playing: false, // currently playing
    paused:  true,  // TODO: implement to match html5
  };

  var tweens = {};
  var nodes  = {};

  var startTime  = 0; // global (unix) time started (cached for accurately reporting currentTime)
  var cachedTime = 0; // local current time (cached for resuming from pause)

  var onendtimer
  var audioData
  var element
  var source
  var gainTween

  var shouldPlay = false;

  var analysis = { test: true };

  // on(), off(), etc
  var events = new Events();

  // popcorn-style events (triggered at a certain time)
  var timelineEvents = [];

  debug.log(2, 'createTrack "' + name + '", mode: "' + options.sourceMode + '", autoplay: ' + options.autoplay);

  setup();


  // Public Properties
  track.name     = name;
  track.status   = status;
  track.options  = options;
  track.nodes    = nodes;
  track.analysis = analysis;

  if(options.sourceMode === 'element')
    track.element = element;

  // Events
  track.on      = events.on.bind(track);
  track.one     = events.one.bind(track);
  track.off     = events.off.bind(track);
  track.trigger = events.trigger.bind(track);

  // Controls
  track.play  = play;
  track.pause = pause;
  track.stop  = stop;

  track.getAnalysis  = getAnalysis;

  track.pan  = pan;
  track.gain = gain;
  track.tweenGain = tweenGain;

  track.currentTime   = currentTime;
  track.formattedTime = formattedTime;
  track.duration      = duration;

  track.addEvent    = addTimelineEvent;
  track.removeEvent = removeTimelineEvent;
  track.updateTimelineEvents = updateTimelineEvents;

  track.mute   = mute;
  track.unmute = unmute;

  // ********************************************************

  /*

     ####  ###### ###### ##   ## ######
    ##     ##       ##   ##   ## ##   ##
     ####  #####    ##   ##   ## ######
        ## ##       ##   ##   ## ##
    #####  ######   ##    #####  ##

  */

  function setup(){
    // append extension only if it’s a file path
    if(typeof options.source === 'string' && options.source.indexOf('blob:') !== 0){
      options.source  += mix.options.fileTypes[0];
    }

    // Web Audio
    if(options.sourceMode === 'buffer') {

      loadBufferSource();

    } else if(options.sourceMode === 'element') {

      element = document.createElement('audio');
      useHTML5elementSource();

    } else if(options.sourceMode === 'mediaStream'){

      loadMediaStream();

    } else {
      throw new Error('"'+options.sourceMode+'" is an invalid source mode.')
    }

  }

  // Use existing html5 <audio> or <video> element as source
  function useHTML5elementSource() {
    debug.log(2, 'Track "' + name + '" using HTML5 element source: "' + options.source + '"');

    // Add options
    if (options.loop)  element.loop  = true;
    if (options.muted) element.muted = true;
    element.volume = options.gain;
    element.crossOrigin = '';

    source = mix.context.createMediaElementSource(element);

    element.addEventListener('canplaythrough', ready);
    element.addEventListener('error',          loadError);

    element.src = options.source;

    return track;
  }

  function ready() {
    status.loaded = true;

    if( options.autoplay || shouldPlay ){
      play();
    }
    // else {
    //   element.pause();
    // }

    events.trigger('load', track);
  }

  function loadError(){
    events.trigger('loadError', track)
  }

  function loadBufferSource(forcePlay) {
    debug.log(2, 'Track "' + name + '" webAudio source: "' + options.source + '"');

    var request = new XMLHttpRequest();
    request.open('GET', options.source, true);
    request.responseType = 'arraybuffer';

    request.onreadystatechange = function(e){
      if(request.readyState === 4){
        if(request.status === 200 || request.status === 206 || request.status === 304){
          // 200 -> success
          debug.log(2, '"' + name + '" loaded "' + options.source + '"');
          audioData = request.response; // cache the audio data
          status.loaded = true;
          events.trigger('load', track);
          if( forcePlay ){
            play(true);
          } else if( shouldPlay ){
            play();
          } else {
            if(options.autoplay) play();
          }
        } else {
          // other -> failure
          debug.log(1, 'couldn’t load track "' + name + '" with source "' + options.source + '"');
          events.trigger('loadError', track, { status: request.status });
        }
      }
    }

    request.onerror = loadError

    request.send();
  }


  /*

    ######  ##     ##### ##    ##
    ##   ## ##    ##   ## ##  ##
    ######  ##    #######  ####
    ##      ##    ##   ##   ##
    ##      ##### ##   ##   ##

  */
  function play(bufferSourceLoaded) {

    if(!status.loaded){
      shouldPlay = true;
      return track;
    }

    if(status.playing){
      return track;
    }

    shouldPlay = false;

    if(options.sourceMode === 'buffer'){
      // need to re-xhr the audio file so we loop back to load
      if(bufferSourceLoaded)
        playBufferSource();
      else {
        status.playing = false;
        loadBufferSource(true); // loop back to load
      }
    } else if(options.sourceMode === 'element'){
      playElementSource();
    } else if( options.sourceMode === 'mediaStream'){
      playMediaStreamSource();
    }

    return track;
  }

  function playElementSource() {

    // unlike buffer mode, we only need to construct the nodes once
    // we’ll also take this opportunity to do event listeners
    if( !nodes.gain ){
      createNodes();

      element.addEventListener('ended', function() {
        events.trigger('ended', track);
      }, false);

      element.addEventListener('loop', function() {
        events.trigger('loop', track);
      }, false);
    }

    // Apply Options
    // ~~~~~~~~~~~~~~

    status.ready = true;
    events.trigger('ready', track);

    if(options.loop) element.loop = true;

    gain(options.gain);
    pan(options.pan);

    // Start Time

    startTime = element.currentTime - cachedTime;
    var startFrom = cachedTime || 0;

    element.currentTime = startFrom;
    element.play();

    status.playing = true;
    events.trigger('play', track);

  }

  function setEndTimer(){
    var startFrom = cachedTime || 0;
    var timerDuration = (source.buffer.duration - startFrom);

    onendtimer = setTimeout(function() {

      if(options.looping){
        if(bowser && bowser.chrome && Math.floor(bowser.version) >= 42){
          // HACK chrome 42+ looping fix
          stop(); play();
        } else {
          setEndTimer();
        }
      } else {
        events.trigger('ended', track);
      }

    }, timerDuration * 1000);
  }

  function playBufferSource() {
    status.ready = false;

    // Construct Audio Buffer
    // (we have to re-construct the buffer every time we begin play)

    source = null;

    // Create source
    // ~~~~~~~~~~~~~

    // W3C standard implementation (Firefox, recent Chrome)
    if(typeof mix.context.createGain === 'function') {

      mix.context.decodeAudioData(audioData, function(decodedBuffer){
        if(status.ready) return;

        source           = mix.context.createBufferSource();
        var sourceBuffer = decodedBuffer;
        source.buffer    = sourceBuffer;

        finish();
      });
    }

    // Non-standard Webkit implementation (Safari, old Chrome)
    else if(typeof mix.context.createGainNode === 'function') {

      source = mix.context.createBufferSource();
      var sourceBuffer  = mix.context.createBuffer(audioData, true);
      source.buffer = sourceBuffer;

      finish();
    }
  }

  function finish() {

    createNodes();

    status.ready = true;
    events.trigger('ready', track);

    // Apply Options
    source.loop = (options.loop) ? true : false;
    gain(options.gain);
    pan(options.pan);

    // Play
    // ~~~~

    startTime = source.context.currentTime - cachedTime;
    var startFrom = cachedTime || 0;

    // console.log('Playing "'+name+'" %o', {
    //   cachedTime:  cachedTime,
    //   startFrom:   startFrom,
    //   currentTime: source.context.currentTime,
    //   startTime:   startTime,
    // });

    debug.log(2, 'Playing track (buffer) "' + name + '" from ' + startFrom + ' (' + startTime + ') gain ' + gain());

    // prefer start() but fall back to deprecated noteOn()
    if(typeof source.start === 'function') source.start(0, startFrom);
    else                                   source.noteOn(startFrom);

    // fake ended event
    if(onendtimer) clearTimeout(onendtimer);
    setEndTimer.call();

    status.playing = true;
    events.trigger('play', track);
  }




  /*

    Media Stream

  */

  function loadMediaStream(shouldPlay){
    source = mix.context.createMediaStreamSource(options.source);
    status.loaded = true
    if( options.autoplay || shouldPlay ) play();
  }

  function playMediaStreamSource(){

    createNodes();

    status.ready = true;
    events.trigger('ready', track);

    // Apply Options
    gain(options.gain);
    pan(options.pan);

    status.playing = true;
    events.trigger('play', track);
  }




  /*

    ######   #####  ##   ##  ####  ######
    ##   ## ##   ## ##   ## ##     ##
    ######  ####### ##   ##  ####  #####
    ##      ##   ## ##   ##     ## ##
    ##      ##   ##  #####  #####  ######

  */
  function pause(at) {
    if(!status.ready || !status.playing) return track;

    // cache time to resume from later
    cachedTime = (typeof at === 'number' ? at : currentTime());

    status.playing = false;

    if(onendtimer) clearTimeout(onendtimer);

    if(options.sourceMode === 'buffer') {
      // prefer stop(), fallback to deprecated noteOff()
      if(typeof source.stop === 'function')         source.stop(0);
      else if(typeof source.noteOff === 'function') source.noteOff(0);
    } else if(options.sourceMode === 'element') {
      element.pause();
    }

    debug.log(2, 'Pausing track "' + name + '" at ' + cachedTime);
    events.trigger('pause', track);

    return track;
  }

  /*

     #### ###### ######  ######
    ##      ##  ##    ## ##   ##
     ####   ##  ##    ## ######
        ##  ##  ##    ## ##
    #####   ##   ######  ##

  */
  function stop() {
    if(!status.ready || !status.playing) return track;

    if(onendtimer) clearTimeout(onendtimer);

    cachedTime = 0;
    startTime  = 0;

    if(options.sourceMode === 'buffer') {
      // prefer stop(), fallback to deprecated noteOff()
      if(typeof source.stop === 'function')         source.stop(0);
      else if(typeof source.noteOff === 'function') source.noteOff(0);
    } else {

      options.autoplay = false;
      element.pause();
      element.currentTime = 0;
    }

    status.playing = false;
    events.trigger('stop', track);

    options.gain = options.gainCache;

    return track;
  }


  /*

    ###  ##  ######  ######  ######  ####
    #### ## ##    ## ##   ## ##     ##
    ## #### ##    ## ##   ## #####   ####
    ##  ### ##    ## ##   ## ##         ##
    ##   ##  ######  ######  ###### #####

  */

  function createNodes() {
    var nodeArray = ['panner', 'gain'].concat( (options.nodes || []) );

    var lastNode = source;

    nodeArray.forEach(function(node){

      if(typeof node === 'string'){
        if( nodeCreators[node] ){
          var newNode = nodeCreators[node]( mix.context, lastNode );
          nodes[node] = newNode;
          lastNode    = newNode;
        }
      } else if( typeof node === 'object' ){
        // todo
      } else if( typeof node === 'function' ){
        // todo
      }
    });

    lastNode.connect(mix.context.destination);
  }


  function createGain(context, lastNode){
    var gainNode = context.createGainNode ? context.createGainNode() : context.createGain();
    lastNode.connect(gainNode);
    return gainNode;
  }

  function createPanner(context, lastNode){
    var pannerNode = context.createPanner();
    lastNode.connect(pannerNode);
    return pannerNode;
  }

  function createConvolver(context, lastNode){
    if(!context.createConvolver) return lastNode;
    var convolverNode = context.createConvolver();
    lastNode.connect(convolverNode);
    return convolverNode;
  }

  function createCompressor(context, lastNode){
    if(!context.createDynamicsCompressor) return lastNode;
    var compressorNode = context.createDynamicsCompressor();
    lastNode.connect(compressorNode);
    return compressorNode;
  }


  /*

    Audio Analysis Node

  */
  function createAnalyse(context, lastNode){

    // create a script processor with bufferSize of 2048
    var processorNode = context.createScriptProcessor(2048, 1, 1);

    // create an analyser
    var analyserNode = context.createAnalyser();
    analyserNode.smoothingTimeConstant = 0.2;

    analyserNode.fftSize = 32;

    processorNode.connect(context.destination); // processor -> destination
    analyserNode.connect(processorNode);  // analyser  -> processor

    options.bufferLength = analyserNode.frequencyBinCount;

    // define a Uint8Array to receive the analyser’s data
    track.analysis = {
      raw: new Uint8Array(options.bufferLength),
      average: 0,
      low:     0,
      mid:     0,
      high:    0,
    };

    lastNode.connect(analyserNode);

    // return the last node: the audio processor doesn’t modify the audio
    // stream, so it doesn’t need to be connected to any other nodes
    return analyserNode;
  }

  function getAnalysis(){
    if(!nodes.analyse) return

    var third = Math.round(options.bufferLength / 3);
    var scratch = 0;
    var i=0;

    nodes.analyse.getByteFrequencyData(track.analysis.raw);

    // calculate average, mid, high
    scratch = 0;
    for (i = 0; i < options.bufferLength; i++)
      scratch += track.analysis.raw[i];

    track.analysis.average = (scratch / options.bufferLength) / 256;

    // lows
    scratch = 0;
    for (i=0; i < third; i++)
      scratch += track.analysis.raw[i];

    track.analysis.low = scratch / third / 256;

    // mids
    scratch = 0;
    for (i = third; i < third*2; i++)
      scratch += track.analysis.raw[i];

    track.analysis.mid = scratch / third / 256;

    // highs
    scratch = 0;
    for (i= third*2; i < options.bufferLength; i++)
      scratch += track.analysis.raw[i];

    track.analysis.high = scratch / third / 256;

    events.trigger('analyse', track);

    return track.analysis
  }


  // ######   #####  ###  ##
  // ##   ## ##   ## #### ##
  // ######  ####### ## ####
  // ##      ##   ## ##  ###
  // ##      ##   ## ##   ##

  // "3d" stereo panning
  function pan(angleDeg) {

    if( !detect.webAudio || !status.ready || !nodes.panner ) return track;

    if(typeof angleDeg === 'string') {
      if(     angleDeg === 'front') angleDeg =   0;
      else if(angleDeg === 'back' ) angleDeg = 180;
      else if(angleDeg === 'left' ) angleDeg = 270;
      else if(angleDeg === 'right') angleDeg =  90;
    }

    if(typeof angleDeg === 'number') {

      options.pan = angleDeg % 360;

      var angleRad = (-angleDeg + 90) * 0.017453292519943295; // * PI/180

      var x = options.panX = Math.cos(angleRad);
      var y = options.panY = Math.sin(angleRad);
      var z = options.panZ = -0.5;

      nodes.panner.setPosition(x, y, z);

      events.trigger('pan', track);

      return track; // all setters should be chainable
    }

    return options.pan;
  }

  /*

     #####   #####  #### ###  ##
    ##      ##   ##  ##  #### ##
    ##  ### #######  ##  ## ####
    ##   ## ##   ##  ##  ##  ###
     #####  ##   ## #### ##   ##

  */

  function gainCache(setTo) {
    if(typeof setTo === 'number') {
      options.gainCache = setTo;
      return track;
    } else {
      return options.gainCache;
    }
  }

  function gain(setTo) {
    if(typeof setTo === 'number') {

      setTo = u.constrain(setTo, 0, 1); // normalize value

      if(options.muted) {
        gainCache(setTo); // cache the value
        options.gain = 0;
      } else {
        options.gain = setTo;
      }

      if(status.playing)
        if(nodes.gain)
          nodes.gain.gain.value = options.gain * mix.options.gain;

      // if element source, also adjust the media element,
      // because the gain node is meaningless in this context
      if(options.sourceMode === 'element')
        element.volume = options.gain * mix.options.gain

      // setters should be chainable
      events.trigger('gain', track);
      return track;
    }

    // accurately report gain while we’re tweening it
    if(options.sourceMode === 'buffer'){
      if(status.playing)
        if(nodes.gain)
          options.gain = nodes.gain.gain.value
    }

    return options.gain;
  }

  function tweenGain(setTo, duration){
    if(typeof setTo !== 'number' || typeof duration !== 'number')
      throw new Error('Invalid arguments to tweenGain()');

    setTo = u.constrain(setTo, 0.01, 1); // can’t ramp to 0, will error

    if(options.sourceMode === 'buffer'){
      if(status.playing)
        if(nodes.gain)
          nodes.gain.gain.linearRampToValueAtTime(setTo, source.context.currentTime + duration);

    } else if( options.sourceMode === 'element'){

      if(gainTween) gainTween.stop()

      gainTween = new TWEEN.Tween({ gain: options.gain })
        .to( { gain: setTo }, 1000 * duration )
        .start();

      gainTween.onUpdate(function(){ gain(this.gain) })

    }


  }

  /*

    Mute

  */

  function mute() {
    gainCache(options.gain);
    gain(0);
    options.muted = true;
    status.muted  = true;
    if(options.sourceMode === 'element')
      element.muted = true;
    return track
  }

  function unmute() {
    options.muted = false;
    status.muted  = false;
    if(options.sourceMode === 'element')
      element.muted = false;
    gain(options.gainCache);
    return track;
  }


  /*

    Current Time

  */

  function currentTime(setTo) {
    if(!status.ready) return 0;

    if(typeof setTo === 'number') {
      if(options.sourceMode === 'buffer') {
        if(status.playing) {
          pause(setTo);
          play();
        } else {
          cachedTime = setTo;
        }
      } else {
        element.currentTime = setTo;
      }
      return track
    }

    if(!status.playing) return cachedTime || 0;

    if(options.sourceMode === 'buffer'){
      return source.context.currentTime - startTime || 0;
    } else {
      return element.currentTime || 0;
    }

  }


  function formattedTime(includeDuration) {
    if(!status.ready) return 0;

    if(includeDuration)
      return u.timeFormat(currentTime()) + '/' + u.timeFormat(duration());
    else
      return u.timeFormat(currentTime());
  }

  function duration() {
    if(!status.ready) return 0;

    if(options.sourceMode === 'buffer')
      return source.buffer.duration || 0;
    else
      return element.duration || 0;
  }



  /*

    Timeline Events (Popcorn-style)

      Timeline events can trigger functions at their start and end.
      Each function will only be triggered once.

      Start and end times are both optional.

      event: {
        start: time
        end:   time
        onstart: function()
        onend:   function()
      }

  */

  function addTimelineEvent(e){
    timelineEvents.push({
      id:      (new Date).getTime(),
      start:   e.start,
      end:     e.end,
      onstart: e.onstart,
      onend:   e.onend,
      active:  e.start ? false : true // start active if there’s no start time or start time is 0
    });
    return track;
  }

  function updateTimelineEvents(){
    if(timelineEvents.length && status.playing){

      // check where we are at
      var now = currentTime();
      if(!now) return;

      timelineEvents.forEach(function(e){

        if( e.start || e.start === 0 )
          if( now >= e.start && !e.active ){
            if(e.onstart) e.onstart.call(null, track);
            e.active = true;
          }


        if( e.end )
          if( now >= e.end && e.active ){
            if( e.onend ) e.onend.call(null, track);
            e.active = false;
          }
      })
    }
  }

  function removeTimelineEvent(id){
    // for (var i = timelineEvents.length - 1; i >= 0; i--) {
    //   timelineEvents[i]
    // };
  }






};

module.exports = Track;

},{"./debug":2,"./detect":3,"./events":4,"./utils":8}],8:[function(require,module,exports){
/*

  Utils

*/

module.exports = {
  extend:     extend,
  constrain:  constrain,
  timeFormat: timeFormat
};


function extend() {
  var output = {}
  var args = arguments
  var l = args.length

  for (var i = 0; i < l; i++)
    for (var key in args[i])
      if(args[i].hasOwnProperty(key))
        output[key] = args[i][key];
  return output;
}

function constrain(val, min, max) {
  if(val < min) return min;
  if(val > max) return max;
  return val;
}


function timeFormat(seconds) {
  var m = Math.floor(seconds / 60) < 10 ? '0' + Math.floor(seconds / 60) : Math.floor(seconds / 60);
  var s = Math.floor(seconds - (m * 60)) < 10 ? '0' + Math.floor(seconds - (m * 60)) : Math.floor(seconds - (m * 60));
  return m + ':' + s;
}


},{}]},{},[1])


//# sourceMappingURL=helios-audio-mixer.js.map