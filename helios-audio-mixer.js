/* global bowser, TWEEN */

'use strict';

var heliosAudioMixer = (function() {

  // ######  ###### ###### ######  ##### ######
  // ##   ## ##       ##   ##     ##       ##
  // ##   ## #####    ##   #####  ##       ##
  // ##   ## ##       ##   ##     ##       ##
  // ######  ######   ##   ######  #####   ##

  // Feature Detection

  var Detect = {

    // Web audio API support
    webAudio: !!(window.AudioContext || window.webkitAudioContext),

    // Which audio types can the browser actually play?
    audioTypes: (function() {
      var el = document.createElement('audio')

      return {
        '.m4a': !!(el.canPlayType && el.canPlayType('audio/mp4; codecs="mp4a.40.2"').replace(/no/, '')),
        '.mp3': !!(el.canPlayType && el.canPlayType('audio/mpeg;').replace(/no/, '')),
        '.ogg': !!(el.canPlayType && el.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''))
      }
    })(),

    videoTypes: (function() {

      var el = document.createElement('video')

      return {
        '.webm': !!(el.canPlayType && el.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/no/, '')),
        '.mp4':  !!(el.canPlayType && el.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, '')),
        '.ogv':  !!(el.canPlayType && el.canPlayType('video/ogg; codecs="theora"').replace(/no/, ''))
      }
    })(),

    // prefer bowser, but with fallback
    browser: (function() {

      if(typeof bowser !== 'undefined') return bowser;

      return {
        firefox: !!navigator.userAgent.match(/Firefox/g),
        android: !!navigator.userAgent.match(/Android/g),
        msie:    !!navigator.userAgent.match(/MSIE/g),
        ios:     !!navigator.userAgent.match(/(iPad|iPhone|iPod)/g),

        version: false
      };
    })(),

    // is tween.js present?
    tween: (function() {
      return (typeof TWEEN === 'undefined') ? false : true
    })()

  }

  // ######   #####   ####  ######
  // ##   ## ##   ## ##     ##
  // ######  #######  ####  #####
  // ##   ## ##   ##     ## ##
  // ######  ##   ## #####  ######

  // shared functionality: event system, extend

  var BaseClass = function() {};

  BaseClass.prototype.on = function(type, callback) {
    this.events[type] = this.events[type] || [];
    this.events[type].push(callback);

    return this
  };

  BaseClass.prototype.one = function(type, callback) {
    var _this = this
    this.events[type] = this.events[type] || [];
    this.events[type].push(function(){
      _this.off(type)
      callback()
    });

    return this
  };

  BaseClass.prototype.off = function(type) {
    if(type === '*')
      this.events = {};
    else
      this.events[type] = [];

    return this
  };

  BaseClass.prototype.trigger = function(type) {

    if(!this.events[type]) return;

    var args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0, l = this.events[type].length; i < l; i++)
        if(typeof this.events[type][i] === 'function')
          this.events[type][i].apply(this, args);

  };

  BaseClass.prototype.extend = function() {
    var output = {}
    var args = arguments
    var l = args.length

    for (var i = 0; i < l; i++)
      for (var key in args[i])
        if(args[i].hasOwnProperty(key))
          output[key] = args[i][key];
    return output;
  };

  var extend = function() {
    var output = {}
    var args = arguments
    var l = args.length

    for (var i = 0; i < l; i++)
      for (var key in args[i])
        if(args[i].hasOwnProperty(key))
          output[key] = args[i][key];
    return output;
  };












  var constrain = function(val, min, max) {
    if(val < min) return min;
    if(val > max) return max;
    return val;
  };








  // ###  ### #### ##   ##
  // ########  ##   ## ##
  // ## ## ##  ##    ###
  // ##    ##  ##   ## ##
  // ##    ## #### ##   ##

  var Mix = function(opts) {

    this.Track = Track

    this.debug = 1 // 0 no logging, 1 minimal, 2 all (spammy)

    this.log = function(lvl) {
      if(lvl <= this.debug) {
        var str = ''
        for (var i = 1; i < arguments.length; i++)
          str += arguments[i] + ' '
        console.log(str)
      }
    }

    this.setLogLvl = function(lvl) {
      this.debug = constrain(lvl, 0, 2);
      this.log(1, '[Mixer] Set log level:', lvl)
    }

    var defaults = {
      fileTypes: [ '.mp3', '.m4a', '.ogg' ],
      html5: false,
      gain: 1, // master gain for entire mix
    }
    this.options = extend(defaults, opts || {})


    this.tracks  = [];    // tracks as numbered array
    this.lookup  = {};    // tracks as lookup table: lookup['trackname']

    this.muted   = false; // master mute status

    this.context = null;  // AudioContext object (if webAudio is available)

    this.detect  = Detect; // external reference to Detect object


    // Web Audio support overrides
    // ********************************************************

    if(
      (Detect.browser.name === 'Firefox' && Detect.version && Detect.version < 25) || // Firefox < 25
      (Detect.browser.ios === true && Detect.browser.version === 7) ||                 // ios 7
      this.options.html5
   ) {
      Detect.webAudio = false;
    }


    // File Types
    // ********************************************************

    for (var i = this.options.fileTypes.length - 1; i >= 0; i--) {
      if(!Detect.audioTypes[ this.options.fileTypes[i] ])
        this.options.fileTypes.splice(i, 1);
    }

    if(this.options.fileTypes.length <= 0) {
      console.warn('[Mixer] Can’t initialize: none of the specified audio types can play in this browser.')
      return;
    }


    // Initialize
    // ********************************************************

    if(Detect.webAudio === true) {
      this.context = (typeof AudioContext === 'function' ? new window.AudioContext() : new window.webkitAudioContext() )
    }

    this.log(1, '[Mixer] initialized,', (Detect.webAudio ? 'Web Audio Mode,' : 'HTML5 Mode,'), 'can play:', this.options.fileTypes)

    return this

  };

  // inherit base class functionality
  Mix.prototype = new BaseClass()


  /**************************************************************************

    Track Management

  **************************************************************************/

  Mix.prototype.createTrack = function(name, opts) {

    var _this = this;
    var track;

    if(!name)
      _this.log(0, '[Mixer] Can’t create track with no name')

    if(Detect.webAudio === true) {

      if(this.lookup[name]) {
        _this.log(0, '[Mixer] a track named “' + _this.name + '” already exists')
        return
      }


      track = new Track(name, opts, _this);

      this.tracks.push(track);
      this.lookup[name] = track;

    } else {

      track = this.lookup[name];

      if(!track) { // create new track

        track = new Track(name, opts, _this);

        this.tracks.push(track);
        this.lookup[ name ] = track;

      } else { // change source

        track.pause();

        track.options = track.extend(track, track.defaults, opts || {});

        if(track.options.source) {
          track.options.source  += _this.mix.options.fileTypes[0];
          track.createHTML5elementSource();
        }
      }
    }

    return track;

  };


  Mix.prototype.removeTrack = function(_input) {

    var _this = this

    var track, name

    if(typeof _input === 'string')
      name = _input
    else if(typeof _input === 'object' && _input.name)
      name = _input.name

    var track = _this.lookup[name]

    if(!track) {
      _this.log(1, '[Mixer] can’t remove "' + name + '", it doesn’t exist');
      return;
    }

    if(Detect.webAudio === true) {

      track.pause();

      var rest
      var arr   = _this.tracks
      var total = arr.length

      for (var i = 0; i < total; i++) {
        if(arr[i] && arr[i].name === name) {
          rest = arr.slice(i + 1 || total);
          arr.length = (i < 0) ? (total + i) : (i);
          arr.push.apply(arr, rest);
        }
      }

      track.trigger('remove', _this);
      track.events = [];

      // stop memory leaks!
      if(track.options.sourceMode === 'element' && track.element)
        track.element.src = '';

      track = null;
      delete _this.lookup[name];
      _this.log(1, '[Mixer] Removed track "' + name + '"');

    } else {

      track.pause();

      track.element.src = '';
      track.source = '';

      track.ready = false;
      track.loaded = false;

    }

  };


  Mix.prototype.getTrack = function(name) {
    return this.lookup[name] || false;
  };





  /**************************************************************************

    Global Mix Control

  **************************************************************************/

  Mix.prototype.pause = function() {

    this.log(1, '[Mixer] Pausing ' + this.tracks.length + ' track(s) ||')

    for (var i = 0; i < this.tracks.length; i++)
      this.tracks[i].pause()
  };

  Mix.prototype.play = function() {

    this.log(1, '[Mixer] Playing ' + this.tracks.length + ' track(s) >')

    for (var i = 0; i < this.tracks.length; i++)
      this.tracks[i].play()
  };

  Mix.prototype.stop = function() {

    this.log(1, '[Mixer] Stopping ' + this.tracks.length + ' track(s) .')

    for (var i = 0; i < this.tracks.length; i++)
       this.tracks[i].stop()
  };




  Mix.prototype.mute = function() {
    if(this.muted) return
    this.muted = true
    this.log(1, '[Mixer] Muting ' + this.tracks.length + ' tracks')
    for (var i = 0; i < this.tracks.length; i++)
      this.tracks[i].mute();
  };


  Mix.prototype.unmute = function() {
    if(!this.muted) return
    this.muted = false
    this.log(1, '[Mixer] Unmuting ' + this.tracks.length + ' tracks')
    for (var i = 0; i < this.tracks.length; i++)
      this.tracks[i].unmute();
  };



  Mix.prototype.gain = function(masterGain) {
    if(typeof masterGain !== 'undefined') {
      this.options.gain = masterGain;

      // this seems silly, but tracks multiply their gain by the master's
      // so if we change the master gain and call track.gain() we will
      // get the intended result
      for (var i = 0; i < this.tracks.length; i++)
        this.tracks[i].gain(this.tracks[i].gain());
    }

    return this.options.gain;
  }




  /**************************************************************************

    Utilities

  **************************************************************************/


  // call this using requestanimationframe
  Mix.prototype.updateTween = function() {
    TWEEN.update();
  };




  Mix.prototype.report = function(){
    var log = ""
    for (var i = 0; i < this.tracks.length; i++) {
      log += this.tracks[i].gain() + '\t' + this.tracks[i].currentTime() + '\t' + this.tracks[i].name + '\n'
    }
    console.log(log)
  }

































  // ###### #####   #####   ##### ##  ##
  //   ##   ##  ## ##   ## ##     ## ##
  //   ##   #####  ####### ##     ####
  //   ##   ##  ## ##   ## ##     ## ##
  //   ##   ##  ## ##   ##  ##### ##  ##


  var Track = function(name, opts, mix) {

    this.defaults = {

      sourceMode: 'buffer', // buffer or (media) element

      source: false,   // either path to audio source (without file extension) or b) html5 <audio> or <video> element

      nodes:      [],  // array of strings: names of desired additional audio nodes

      gain:        1,  // initial/current gain (0-1)
      gainCache:   false,  // for resuming from mute

      pan:         0,  // circular horizontal pan

      panX:        0,  // real 3d pan
      panY:        0,  //
      panZ:        0,  //

      start:       0,  // start time in seconds
      cachedTime:  0,  // local current time (cached for resuming from pause)
      startTime:   0,  // time started (cached for accurately reporting currentTime)

      looping:  false, //
      autoplay: true,  // play immediately on load
      muted:    (mix.muted) ? true : false
    };

    // override option defaults
    this.options = this.extend.call(this, this.defaults, opts || {});

    if(this.options.gainCache === false)
      this.options.gainCache = this.options.gain

    this.name = name;

    // Status
    this.status = {
      loaded:  false,
      ready:   false,
      playing: false
    }

    this.mix     = mix;  // reference to parent

    this.events  = {};
    this.tweens  = {};
    this.nodes   = undefined;   // holds the web audio nodes (gain and pan are defaults, all other optional)

    this.onendtimer = undefined;  // web audio api in chrome doesn't support onend event yet :(

    this.element = undefined; // html5 <audio> or <video> element
    this.source  = undefined; //  web audio source:

    if(typeof this.options.source === 'string' && this.options.source.indexOf('blob:') !== 0) {
      // append extension only if it’s a file path
      this.options.source  += this.mix.options.fileTypes[0];
    } else if(typeof this.options.source === 'object') {
      // otherwise switch mode to element
      this.options.sourceMode = 'element'
    }

    this.mix.log(1, '[Mixer] createTrack "' + this.name + '", mode: "' + this.options.sourceMode + '", autoplay: ' + this.options.autoplay);



    // Load
    // ~~~~

    if(Detect.webAudio === true) {

      // Web Audio

      if(!this.options.source) {
        this.mix.log(1, '[Mixer] Creating track "' + name + '" without a source');
        return;
      }

      if(this.options.sourceMode === 'buffer') {

        this.loadBufferSource()

      } else if(this.options.sourceMode === 'element') {

        if(typeof this.options.source === 'object')
          this.useHTML5elementSource()
        else
          this.createHTML5elementSource()

      }

    } else {

      // HTML5

      this.mix.log(1, '[Mixer] creating html5 element for track ' + name);

      // Look for pre-created audio element and failing that create one
      this.element = document.querySelector('audio#' + name);

      if(!this.element) {
        var el = document.createElement('audio');
        el.id = name;
        document.body.appendChild(el);
        this.element = document.querySelector('audio#' + name);
      }

      var canplay = function() {
        if(this.status.loaded) return;

        this.status.loaded = true;
        this.status.ready = true;

        if(!this.options.autoplay)
          this.pause();

        this.trigger('load', this);
      }

      var _this = this

      // canplaythrough listener
      _this.element.addEventListener('canplaythrough', canplay, false);
      _this.element.addEventListener('load',           canplay, false);

      // Looping
      _this.element.addEventListener('ended', function() {

        if(_this.options.looping) {

          _this.mix.log(2, 'Track ' + _this.name + ' looping')

          _this.element.currentTime = 0;
          _this.element.play();

        } else {

          _this.trigger('ended', _this);
          _this.mix.removeTrack(_this.name);
        }

      }, false);

      this.createHTML5elementSource(this.options.source);
    }
  };



  Track.prototype = new BaseClass()




  // ##    ######   #####  ######
  // ##   ##    ## ##   ## ##   ##
  // ##   ##    ## ####### ##   ##
  // ##   ##    ## ##   ## ##   ##
  // ##### ######  ##   ## ######

  // Create out-of-DOM html5 <audio> element as source
  Track.prototype.createHTML5elementSource = function() {

    var _this = this;
    if(!_this.options.source) return;

    _this.mix.log(2, '[Mixer] Track "' + this.name + '" creating HTML5 element source: "' + _this.options.source + _this.mix.options.fileTypes[0]  + '"');
    _this.status.ready = false

    var src = _this.options.source

    _this.options.source = document.createElement('audio')
    _this.options.source.crossOrigin = ''
    _this.options.source.src = src

    _this.useHTML5elementSource()
  }

  // Use existing in-DOM html5 <audio> or <video> element as source
  Track.prototype.useHTML5elementSource = function() {

    var _this = this;
    if(!_this.options.source) return;

    _this.mix.log(2, '[Mixer] Track "' + this.name + '" use HTML5 element source: "' + _this.options.source + '"')

    _this.element = _this.options.source
    _this.options.source.crossOrigin = ''
    _this.options.source = _this.element.src

    /**
     * Add options if they're set.
     */
    if (_this.options.looping) { _this.element.loop  = true; }
    if (_this.options.muted)   { _this.element.muted = true; }

    if(_this.mix.context)
      _this.source = _this.mix.context.createMediaElementSource(_this.element);

    var ready = function() {
      _this.status.loaded = true
      if(_this.options.autoplay) _this.play();
      _this.trigger('load', _this);
    }

    _this.element.addEventListener('canplaythrough', ready)
    _this.element.addEventListener('error', function() { _this.trigger('loadError') })

    _this.element.load()

    return _this
  }

  Track.prototype.loadBufferSource = function(forcePlay) {

    var _this = this;
    if(!_this.options.source) return;

    this.mix.log(2, '[Mixer] Track "' + this.name + '" webAudio source: "' + _this.options.source + '"')

    var request = new XMLHttpRequest();
    request.open('GET', _this.options.source, true);
    request.responseType = 'arraybuffer';

    // asynchronous callback
    request.onload = function() {
      _this.mix.log(2, '[Mixer] "' + _this.name + '" loaded "' + _this.options.source + '"');
      _this.options.audioData = request.response; // cache the audio data
      _this.status.loaded = true;
      _this.trigger('load', _this);
      if(forcePlay){
        _this.play(true)
      } else {
        if(_this.options.autoplay) _this.play();
      }
    }

    request.onerror = function() {
      _this.mix.log(1, '[Mixer] couldn’t load track "' + _this.name + '" with source "' + _this.options.source + '"')
      _this.trigger('loadError', _this)
    }

    request.send();
  }









  // ###  ##  ######  ######  ######  ####
  // #### ## ##    ## ##   ## ##     ##
  // ## #### ##    ## ##   ## #####   ####
  // ##  ### ##    ## ##   ## ##         ##
  // ##   ##  ######  ######  ###### #####


  // AudioNode Creation
  // -> this function can be chained

  Track.prototype.addNode = function(nodeType) {

    var _this = this;

    // if this is the first time we’re calling addNode, connect directly to the source
    if(!_this.nodes.lastnode) _this.nodes.lastnode = _this.source;

    this.mix.log(2, ' +  addNode ' + nodeType);

    // Analyser and Processor ********************************************************

    if(nodeType === 'analyse') {

      // create a script processor with bufferSize of 2048
      _this.nodes.processor = _this.mix.context.createScriptProcessor(2048, 1, 1)

      // create an analyser
      _this.nodes.analyser = _this.mix.context.createAnalyser()
      _this.nodes.analyser.smoothingTimeConstant = 0.5
      _this.nodes.analyser.fftSize = 32

      _this.nodes.processor.connect(_this.mix.context.destination) // processor -> destination
      _this.nodes.analyser.connect(_this.nodes.processor)          // analyser -> processor

      // define a Uint8Array to receive the analyser’s data
      _this.options.bufferLength = new Uint8Array(_this.nodes.analyser.frequencyBinCount)
      var analyserData = new Uint8Array(_this.options.bufferLength)

      _this.nodes.lastnode.connect(_this.nodes.analyser)

      _this.nodes.processor.onaudioprocess = function(){
        _this.nodes.analyser.getByteTimeDomainData(analyserData)
        _this.trigger('analyse', analyserData)
      }
    }

    // Gain ********************************************************
    // http://www.w3.org/TR/webaudio/#GainNode

    else if(nodeType === 'gain') {

      if(_this.mix.context.createGainNode)
        _this.nodes.gain = _this.mix.context.createGainNode();
      else
        _this.nodes.gain = _this.mix.context.createGain();

      // connect last created node to newly created node
      _this.nodes.lastnode.connect(_this.nodes.gain);

      // set newly created node to last node in the chain
      _this.nodes.lastnode = _this.nodes.gain;

    }

    // Panner ********************************************************
    // http://www.w3.org/TR/webaudio/#PannerNode

    else if(nodeType === 'panner') {

      if(window.AudioContext) {

        _this.nodes.panner = _this.mix.context.createPanner();
        // _this.nodes.panner.panningModel = 'equalpower';
        // _this.nodes.panner.panningModel = 'HRTF';

      } else if(window.webkitAudioContext) {

        _this.nodes.panner = _this.mix.context.createPanner();
        // _this.nodes.panner.panningModel = webkitAudioPannerNode.EQUALPOWER;
        // _this.nodes.panner.panningModel = _this.nodes.panner.EQUALPOWER;

      } else {
        return _this;
      }

      _this.nodes.lastnode.connect(_this.nodes.panner);
      _this.nodes.lastnode = _this.nodes.panner;

    }

    // Convolver (Reverb etc) **********************************************
    // http://www.w3.org/TR/webaudio/#ConvolverNode

    else if(nodeType === 'convolver') {

      if(!_this.mix.context.createConvolver) return _this;

      _this.nodes.convolver = _this.mix.context.createConvolver();

      // TODO: implement loading impulse response for the convolver node
      // http://chromium.googlecode.com/svn/trunk/samples/audio/impulse-responses/

      // _this.nodes.convolver.buffer = convolverBuffer;


    }

    // Compressor ********************************************************
    // http://www.w3.org/TR/webaudio/#DynamicsCompressorNode

    else if(nodeType === 'compressor') {

      _this.nodes.compressor = _this.mix.context.createDynamicsCompressor();

      // no settings required really…

      _this.nodes.lastnode.connect(_this.nodes.compressor);
      _this.nodes.lastnode = _this.nodes.compressor;

    }

    // Delay ********************************************************
    // http://www.w3.org/TR/webaudio/#DelayNode

    else if(nodeType === 'delay') {

      if(Detect.nodes.delayNode)
        _this.nodes.delay = _this.mix.context.createDelayNode();
      else
        _this.nodes.delay = _this.mix.context.createDelay();

      _this.nodes.delay.delayTime = 0;

      _this.nodes.lastnode.connect(_this.nodes.delay);
      _this.nodes.lastnode = _this.nodes.delay;

    }

    // it’s chainable
    return _this;
  }


  // ######  ##     ##### ##    ##
  // ##   ## ##    ##   ## ##  ##
  // ######  ##    #######  ####
  // ##      ##    ##   ##   ##
  // ##      ##### ##   ##   ##

  Track.prototype.play = function(bufferSourceLoaded) {

    var _this = this;

    if(!_this.status.loaded) {
      this.mix.log(1, 'Can’t play track "' + _this.name + '", not loaded')
      return;
    }

    if(_this.status.playing === true) return;
    _this.status.playing = true;

    if(!Detect.webAudio)
      playSingleElement(_this)

    else if(Detect.webAudio && _this.options.sourceMode === 'buffer'){
      // need to re-xhr the audio file so we loop back to load
      if(bufferSourceLoaded)
        playBufferSource(_this)
      else {
        _this.status.playing = false;
        _this.loadBufferSource(true) // loop back to load
      }
    }

    else if(Detect.webAudio && _this.options.sourceMode === 'element')
      playElementSource(_this)


    return _this
  }


  function playCreateNodes(_this) {

    _this.mix.log(2, 'Creating nodes for track "' + _this.name + '"')

    // Create Nodes
    // ~~~~~~~~~~~~

    _this.nodes = {}

    // 1. Create standard nodes (gain and pan)
    _this.addNode('panner').addNode('gain')

    // 2. Create additional nodes
    if(_this.options.nodes.length){
      for (var i = 0; i < _this.options.nodes.length; i++) {
        _this.addNode( _this.options.nodes[i] );
      }
    }

    // 3. Connect the last node in the chain to the destination
    _this.nodes.lastnode.connect(_this.mix.context.destination);

  }

  // ********************************************************

  function playElementSource(_this) {

    // unlike buffer mode, we only need to construct the nodes once
    if( !_this.nodes ) {

      playCreateNodes(_this)

      // we also only want one event listener
      _this.element.addEventListener('ended', function() {
        _this.trigger('ended', _this)
      }, false)
    }


    // Apply Options
    // ~~~~~~~~~~~~~~

    _this.status.ready = true;
    _this.trigger('ready', _this);

    if(_this.options.looping) _this.element.loop = true;
    else                      _this.element.loop = false;

    _this.gain(_this.options.gain)
    _this.pan(_this.options.pan)

    // Start Time

    _this.options.startTime = _this.element.currentTime - _this.options.cachedTime;
    var startFrom = _this.options.cachedTime || 0;

    _this.mix.log(1, '[Mixer] Playing track "' + _this.name + '" from ' + startFrom + ' (' + _this.options.startTime + ') gain ' + _this.gain());

    // Play!

    _this.element.currentTime = startFrom;
    _this.element.play()

    _this.trigger('play', _this)

  }


  // ********************************************************

  function setEndTimer(){
    var _this = this
    var startFrom = _this.options.cachedTime || 0
    var timerDuration = (_this.source.buffer.duration - startFrom)

    _this.onendtimer = setTimeout(function() {
      _this.trigger('ended', _this)

      if(_this.options.looping){

        if(bowser && bowser.chrome && Math.floor(bowser.version) >= 42){
          // HACK chrome 42+ looping fix
          _this.stop()
          _this.play()
        } else {
          setEndTimer.call(_this)
        }

      }

    }, timerDuration * 1000)
  }

  function playBufferSource(_this) {

    _this.status.ready = false

    // Construct Audio Buffer
    // ~~~~~~~~~~~~~~~~~~~~~~

    // (we have to re-construct the buffer every time we begin play)

    _this.source = null

    // *sigh* async makes for such messy code
    var finish = function() {

      playCreateNodes(_this)

      _this.status.ready = true;
      _this.trigger('ready', _this);

      // Apply Options
      _this.source.loop = (_this.options.looping) ? true : false
      _this.gain(_this.options.gain)
      _this.pan(_this.options.pan)


      // Play
      // ~~~~

      _this.options.startTime = _this.source.context.currentTime - _this.options.cachedTime;
      var startFrom = _this.options.cachedTime || 0;

      _this.mix.log(2, '[Mixer] Playing track "' + _this.name + '" from ' + startFrom + ' (' + _this.options.startTime + ') gain ' + _this.gain());

      // prefer start() but fall back to deprecated noteOn()
      if(typeof _this.source.start === 'function') _this.source.start(0, startFrom);
      else                                         _this.source.noteOn(startFrom);

      // fake ended event
      _this.onendtimer = false
      setEndTimer.call(_this)


      _this.trigger('play', _this)

    }


    // Create source
    // ~~~~~~~~~~~~~

    // W3C standard implementation (Firefox, recent Chrome)
    if(typeof _this.mix.context.createGain === 'function') {

      _this.mix.context.decodeAudioData(_this.options.audioData, function(decodedBuffer){
        if(_this.status.ready) return

        _this.source        = _this.mix.context.createBufferSource();
        var sourceBuffer    = decodedBuffer;
        _this.source.buffer = sourceBuffer;

        finish()
      })
    }

    // Non-standard Webkit implementation (Safari, old Chrome)
    else if(typeof _this.mix.context.createGainNode === 'function') {

      _this.source = _this.mix.context.createBufferSource();
      var sourceBuffer  = _this.mix.context.createBuffer(_this.options.audioData, true);
      _this.source.buffer = sourceBuffer;

      finish()
    }
  }

  // ********************************************************

  function playSingleElement(_this) {

    _this.mix.log(1, '[Mixer] Playing track "' + _this.name + '" >')

    _this.gain(_this.options.gain)

    _this.status.ready  = true;
    _this.element.play();
    _this.trigger('play', _this);
  }


  // ######   #####  ##   ##  ####  ######
  // ##   ## ##   ## ##   ## ##     ##
  // ######  ####### ##   ##  ####  #####
  // ##      ##   ## ##   ##     ## ##
  // ##      ##   ##  #####  #####  ######


  Track.prototype.pause = function(at) {

    if(!this.status.ready || !this.status.playing) return;

    var _this = this;

    // cache time to resume from later
    if(typeof at === 'number') _this.options.cachedTime = at;
    else                         _this.options.cachedTime = _this.currentTime();

    _this.status.playing = false;

    if(_this.onendtimer) clearTimeout(_this.onendtimer);

    if(Detect.webAudio === true) {

      if(_this.options.sourceMode === 'buffer') {

        // prefer stop(), fallback to deprecated noteOff()
        if(typeof _this.source.stop === 'function')
          _this.source.stop(0);
        else if(typeof _this.source.noteOff === 'function')
          _this.source.noteOff(0);

      } else if(_this.options.sourceMode === 'element') {

        _this.element.pause()
      }

    } else {

      _this.element.pause();
    }

    _this.mix.log(2, '[Mixer] Pausing track "' + _this.name + '" at ' + _this.options.cachedTime)
    _this.trigger('pause', _this);

    return _this
  }


  //  #### ###### ######  ######
  // ##      ##  ##    ## ##   ##
  //  ####   ##  ##    ## ######
  //     ##  ##  ##    ## ##
  // #####   ##   ######  ##

  Track.prototype.stop = function() {

    if(!this.status.ready || !this.status.playing) return;

    var _this = this;

    if(!_this.status.playing) return

    if(_this.onendtimer) clearTimeout(_this.onendtimer)

    _this.options.cachedTime = _this.options.startTime = 0

    if(Detect.webAudio === true && _this.options.sourceMode === 'buffer') {

      // prefer stop(), fallback to deprecated noteOff()
      if(typeof _this.source.stop === 'function')
        _this.source.stop(0);
      else if(typeof _this.source.noteOff === 'function')
        _this.source.noteOff(0);

    } else {

      _this.options.autoplay = false;

      _this.element.pause();
      _this.element.currentTime = 0;
    }

    _this.mix.log(2, '[Mixer] Stopping track "' + _this.name)
    _this.status.playing = false
    _this.trigger('stop', _this);

    _this.options.gain = _this.options.gainCache;

    return _this

  }


  // ######   #####  ###  ##
  // ##   ## ##   ## #### ##
  // ######  ####### ## ####
  // ##      ##   ## ##  ###
  // ##      ##   ## ##   ##

  // proper 3d stereo panning
  Track.prototype.pan = function(angleDeg) {

    if( !Detect.webAudio || !this.status.ready || !this.nodes.panner ) return

    if(typeof angleDeg === 'string') {
      if(     angleDeg === 'front') angleDeg =   0;
      else if(angleDeg === 'back' ) angleDeg = 180;
      else if(angleDeg === 'left' ) angleDeg = 270;
      else if(angleDeg === 'right') angleDeg =  90;
    }

    if(typeof angleDeg === 'number') {

      this.options.pan = angleDeg % 360;

      var angleRad = (-angleDeg + 90) * 0.017453292519943295; // * PI/180

      var x = this.options.panX = Math.cos(angleRad);
      var y = this.options.panY = Math.sin(angleRad);
      var z = this.options.panZ = -0.5;

      this.nodes.panner.setPosition(x, y, z);

      this.trigger('pan', this.options.pan, this)

      return this // all setters should be chainable
    }

    return this.options.pan
  }

  Track.prototype.tweenPan = function(angleDeg, tweenDuration) {
    var _this = this;

    return new Promise(function(resolve, reject){
      if( !Detect.tween || !Detect.webAudio || !_this.status.ready || !_this.nodes.panner ) reject(Error('nope nope nope'))
      if( typeof angleDeg !== 'number' || typeof tweenDuration !== 'number' ) reject(Error('Not a valid tween duration.'))

      _this.mix.log(2, '[Mixer] "' + _this.name + '" tweening pan2d')

      if(_this.tweens.pan) _this.tweens.pan.stop()

      _this.tweens.pan = new TWEEN.Tween({ currentAngle: _this.options.pan })
        .to({ currentAngle: angleDeg }, tweenDuration)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onUpdate(function() {
          _this.pan(this.currentAngle)
        })
        .onComplete(function() {
          resolve(_this)
        })
        .start()

      return _this

    })
  }


  //  #####   #####  #### ###  ##
  // ##      ##   ##  ##  #### ##
  // ##  ### #######  ##  ## ####
  // ##   ## ##   ##  ##  ##  ###
  //  #####  ##   ## #### ##   ##

  // cache current gain for restoring later
  Track.prototype.gainCache = function(setTo) {
    if(typeof setTo === 'number') {
      this.options.gainCache = setTo;
      return this
    } else {
      return this.options.gainCache
    }
  }

  // gain range 0-1
  Track.prototype.gain = function(val) {
    if(typeof val === 'number') {

      val = constrain(val, 0, 1) // normalize value

      if(this.options.muted) {
        this.gainCache(val) // cache the value
        this.options.gain = 0
      } else {
        this.options.gain = val
      }

      if(this.status.playing) {

        if(!Detect.webAudio)
          this.element.volume = this.options.gain * this.mix.options.gain
        else if( this.nodes && this.nodes.gain )
          this.nodes.gain.gain.value = this.options.gain * this.mix.options.gain

      }

      this.mix.log(2, '[Mixer] "' + this.name + '" setting gain to ' + this.options.gain)

      this.trigger('gain', this.options.gain, this)

      // setters should be chainable
      return this

    }

    return this.options.gain

  }

  Track.prototype.tweenGain = function(_val, _tweenDuration) {
    var _this = this;
    return new Promise(function(resolve, reject){
      if(typeof _val !== 'number' || typeof _tweenDuration !== 'number') reject(Error('Invalid value for duration.'))
      _this.mix.log(2, '[Mixer] "' + _this.name + '" tweening gain ' + _this.options.gain + ' -> ' + _val + ' ('+_tweenDuration+'ms)')

      // replace existing gain tween
      if(_this.tweens.gain) _this.tweens.gain.stop()

      _this.tweens.gain = new TWEEN.Tween({ currentGain: _this.options.gain })
        .to({ currentGain: _val }, _tweenDuration)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onUpdate(function() {
          _this.gain(this.currentGain)
        })
        .onComplete(function() {
          resolve(_this)
        })
        .start()

    })
  }

  Track.prototype.mute = function() {
    this.gainCache(this.options.gain)
    this.gain(0)
    this.options.muted = true
    if(this.options.sourceMode === 'element')
      this.element.muted = true
    return this
  }

  Track.prototype.unmute = function() {
    this.options.muted = false;
    if(this.options.sourceMode === 'element')
      this.element.muted = false
    this.gain(this.options.gainCache)
    return this
  }


  //  ##### ##   ## #####  ###### ###  ## ###### ###### #### ###  ### ######
  // ##     ##   ## ##  ## ##     #### ##   ##     ##    ##  ######## ##
  // ##     ##   ## #####  #####  ## ####   ##     ##    ##  ## ## ## #####
  // ##     ##   ## ##  ## ##     ##  ###   ##     ##    ##  ##    ## ##
  //  #####  #####  ##  ## ###### ##   ##   ##     ##   #### ##    ## ######

  Track.prototype.currentTime = function(setTo) {
    if(!this.status.ready) return;

    if(typeof setTo === 'number') {

      this.mix.log(2, '[Mixer] setting track "' + this.name + '" to time', setTo)

      if(Detect.webAudio && this.options.sourceMode === 'buffer') {

        if(this.status.playing) {
          this.pause(setTo);
          this.play();
        } else {
          this.options.cachedTime = setTo;
        }

      } else {

        this.element.currentTime = setTo;
      }

      return this
    }

    if(!this.status.playing) return this.options.cachedTime || 0;

    if(Detect.webAudio && this.options.sourceMode === 'buffer')
      return this.source.context.currentTime - this.options.startTime || 0;
    else
      return this.element.currentTime || 0;
  }

  /**************************************************************************

    Getters Only

  **************************************************************************/

  function timeFormat(seconds) {
    var m = Math.floor(seconds / 60) < 10 ? '0' + Math.floor(seconds / 60) : Math.floor(seconds / 60);
    var s = Math.floor(seconds - (m * 60)) < 10 ? '0' + Math.floor(seconds - (m * 60)) : Math.floor(seconds - (m * 60));
    return m + ':' + s;
  }

  Track.prototype.formattedTime = function(includeDuration) {
    if(!this.status.ready) return;

    if(includeDuration)
      return timeFormat(this.currentTime()) + '/' + timeFormat(this.duration());
    else
      return timeFormat(this.currentTime());
  }

  Track.prototype.duration = function() {
    if(!this.status.ready) return;

    if(Detect.webAudio && this.options.sourceMode === 'buffer')
      return this.source.buffer.duration || 0;
    else
      return this.element.duration || 0;
  }

  return Mix

}());
