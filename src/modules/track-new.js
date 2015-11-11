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

  if(!opts.source)
    throw new Error('Can’t create a track without a source.');

  var track = this;

  var defaults = {

    sourceMode: 'buffer', // buffer or (media) element

    source: false,   // either path to audio source (without file extension) or b) html5 <audio> or <video> element

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
  var nodes = [];

  var startTime  = 0; // global (unix) time started (cached for accurately reporting currentTime)
  var cachedTime = 0; // local current time (cached for resuming from pause)

  var onendtimer;
  var element, source;

  // Events
  var events = new Events(track);

  debug.log(2, 'createTrack "' + name + '", mode: "' + options.sourceMode + '", autoplay: ' + options.autoplay);

  setup();

  return {

    // Public Properties
    options: options,
    name: name,

    // Events
    on:      events.on,
    one:     events.one,
    off:     events.off,
    trigger: events.trigger,

    // Controls
    play: play,
    pause: pause
  };

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
    if(typeof options.source === 'string' && options.source.indexOf('blob:') !== 0)
      options.source  += mix.options.fileTypes[0];

    // if it’s a media element, switch source mode to element
    if(typeof options.source === 'object' && 'readyState' in options.source)
      options.sourceMode = 'element';


    // Web Audio
    if(options.sourceMode === 'buffer') {
      loadBufferSource();
    } else if(options.sourceMode === 'element') {
      if(typeof options.source === 'object') useHTML5elementSource();
      else                                   createHTML5elementSource();
    }

  }




  // Create out-of-DOM html5 <audio> element as source
  function createHTML5elementSource() {
    // debug.log(2, 'Track "' + name + '" creating HTML5 element source: "' + options.source + mix.options.fileTypes[0]  + '"');
    status.ready = false;

    var src = options.source;

    options.source = document.createElement('audio');
    options.source.crossOrigin = '';
    options.source.src = src;

    useHTML5elementSource();
  }

  // Use existing in-DOM html5 <audio> or <video> element as source
  function useHTML5elementSource() {
    debug.log(2, 'Track "' + name + '" using HTML5 element source: "' + options.source + '"');

    element = options.source;
    options.source.crossOrigin = '';
    options.source = element.src;

    // Add options if they're set.
    if (options.loop)  element.loop  = true;
    if (options.muted) element.muted = true;

    source = mix.context.createMediaElementSource(element);

    var ready = function() {
      status.loaded = true;
      if(options.autoplay) play();
      events.trigger('load', track);
    };

    element.addEventListener('canplaythrough', ready);
    element.addEventListener('error', function() { events.trigger('loadError', track) });

    element.load();

    return track;
  }

  function loadBufferSource(forcePlay) {
    debug.log(2, 'Track "' + name + '" webAudio source: "' + options.source + '"');

    var request = new XMLHttpRequest();
    request.open('GET', options.source, true);
    request.responseType = 'arraybuffer';

    // asynchronous callback
    request.onload = function() {
      debug.log(2, '"' + name + '" loaded "' + options.source + '"');
      options.audioData = request.response; // cache the audio data
      status.loaded = true;
      events.trigger('load', track);
      if(forcePlay){
        play(true);
      } else {
        if(options.autoplay) play();
      }
    };

    request.onerror = function() {
      debug.log(1, 'couldn’t load track "' + name + '" with source "' + options.source + '"');
      events.trigger('loadError', track);
    };

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

    if(!status.loaded || status.playing) return track;

    if(options.sourceMode === 'buffer'){
      // need to re-xhr the audio file so we loop back to load
      if(bufferSourceLoaded)
        playBufferSource();
      else {
        status.playing = false;
        loadBufferSource(true); // loop back to load
      }
    }

    else if(options.sourceMode === 'element')
      playElementSource(_this);

    return track;
  }

  function playElementSource() {

    // unlike buffer mode, we only need to construct the nodes once
    // we’ll also take this opportunity to do event listeners
    if( !nodes.length ) {
      createNodes();

      element.addEventListener('ended', function() {
        events.trigger('ended', track);
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

    options.startTime = element.currentTime - options.cachedTime;
    var startFrom = options.cachedTime || 0;

    element.currentTime = startFrom;
    element.play();

    events.trigger('play', track);
    status.playing = true;

  }

  function setEndTimer(){
    var startFrom = options.cachedTime || 0;
    var timerDuration = (source.buffer.duration - startFrom);

    onendtimer = setTimeout(function() {
      trigger('ended', track);

      if(options.looping){

        if(bowser && bowser.chrome && Math.floor(bowser.version) >= 42){
          // HACK chrome 42+ looping fix
          stop();
          play();
        } else {
          setEndTimer.call();
        }

      }

    }, timerDuration * 1000);
  }

  function playBufferSource() {

    status.ready = false;

    // Construct Audio Buffer
    // (we have to re-construct the buffer every time we begin play)

    source = null;

    // *sigh* async makes for such messy code
    var finish = function() {

      createNodes();

      status.ready = true;
      trigger('ready', track);

      // Apply Options
      source.loop = (options.loop) ? true : false;
      gain(options.gain);
      pan(options.pan);

      // Play
      // ~~~~

      options.startTime = source.context.currentTime - options.cachedTime;
      var startFrom = options.cachedTime || 0;

      debug.log(2, 'Playing track (buffer) "' + name + '" from ' + startFrom + ' (' + options.startTime + ') gain ' + gain());

      // prefer start() but fall back to deprecated noteOn()
      if(typeof source.start === 'function') source.start(0, startFrom);
      else                                   source.noteOn(startFrom);

      // fake ended event
      onendtimer = false;
      setEndTimer.call();

      trigger('play', track);
      status.playing = true;
    };

    // Create source
    // ~~~~~~~~~~~~~

    // W3C standard implementation (Firefox, recent Chrome)
    if(typeof mix.context.createGain === 'function') {

      mix.context.decodeAudioData(options.audioData, function(decodedBuffer){
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
      var sourceBuffer  = mix.context.createBuffer(options.audioData, true);
      source.buffer = sourceBuffer;

      finish();
    }
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
    options.cachedTime = (typeof at === 'number' ? at : currentTime());

    status.playing = false;

    if(onendtimer) clearTimeout(onendtimer);

    if(options.sourceMode === 'buffer') {
      // prefer stop(), fallback to deprecated noteOff()
      if(typeof source.stop === 'function')         source.stop(0);
      else if(typeof source.noteOff === 'function') source.noteOff(0);
    } else if(options.sourceMode === 'element') {
      element.pause();
    }

    debug.log(2, 'Pausing track "' + name + '" at ' + options.cachedTime);
    trigger('pause', track);

    return track;
  }


  /*

    ###  ##  ######  ######  ######  ####
    #### ## ##    ## ##   ## ##     ##
    ## #### ##    ## ##   ## #####   ####
    ##  ### ##    ## ##   ## ##         ##
    ##   ##  ######  ######  ###### #####

    TODO: abstract addNode into its own module?

  */

  function createNodes() {
    nodes = {};

    // 1. Create standard nodes (gain and pan)
    addNode('panner').addNode('gain');

    // 2. Create additional nodes
    for (var i = 0; i < options.nodes.length; i++) {
      addNode( options.nodes[i] );
    }

    // 3. Connect the last node in the chain to the destination
    nodes.lastnode.connect(mix.context.destination);
  }


  function addNode(nodeType) {

    // if this is the first time we’re calling addNode, connect directly to the source
    if(!nodes.lastnode) nodes.lastnode = source;

    debug.log(2, ' +  addNode ' + nodeType);

    // Analyzer ********************************************************

    if(nodeType === 'analyze') {

      // create a script processor with bufferSize of 2048
      nodes.processor = mix.context.createScriptProcessor(2048, 1, 1);

      // create an analyser
      nodes.analyser = mix.context.createAnalyser();
      nodes.analyser.smoothingTimeConstant = 0.5;
      nodes.analyser.fftSize = 32;

      nodes.processor.connect(mix.context.destination); // processor -> destination
      nodes.analyser.connect(nodes.processor);          // analyser -> processor

      // define a Uint8Array to receive the analyser’s data
      options.bufferLength = nodes.analyser.frequencyBinCount;
      analysis = {
        raw: new Uint8Array(nodes.analyser.frequencyBinCount),
        average: 0,
        low:     0,
        mid:     0,
        high:    0,
      };

      var third = Math.round(options.bufferLength / 3);
      var scratch = 0;

      nodes.lastnode.connect(nodes.analyser);

      nodes.processor.onaudioprocess = function(){
        // nodes.analyser.getByteTimeDomainData(analysis.raw);
        nodes.analyser.getByteFrequencyData(analysis.raw);

        // calculate average, mid, high
        scratch = 0;
        for (var i = 0; i < options.bufferLength; i++)
          scratch += analysis.raw[i];

        analysis.average = (scratch / options.bufferLength) / 256;

        // lows
        scratch = 0;
        for (var i = 0; i < third; i++)
          scratch += analysis.raw[i];

        analysis.low = scratch / third / 256;

        // mids
        scratch = 0;
        for (var i = third; i < third*2; i++)
          scratch += analysis.raw[i];

        analysis.mid = scratch / third / 256;

        // highs
        scratch = 0;
        for (var i = third*2; i < options.bufferLength; i++)
          scratch += analysis.raw[i];

        analysis.high = scratch / third / 256;

        events.trigger('analyse', analysis);
      };
    }

    // Gain ********************************************************
    // http://www.w3.org/TR/webaudio/#GainNode

    else if(nodeType === 'gain') {

      if(mix.context.createGainNode)
        nodes.gain = mix.context.createGainNode();
      else
        nodes.gain = mix.context.createGain();

      // connect last created node to newly created node
      nodes.lastnode.connect(nodes.gain);

      // set newly created node to last node in the chain
      nodes.lastnode = nodes.gain;

    }

    // Panner ********************************************************
    // http://www.w3.org/TR/webaudio/#PannerNode

    else if(nodeType === 'panner') {

      if(window.AudioContext) {

        nodes.panner = mix.context.createPanner();
        // nodes.panner.panningModel = 'equalpower';
        // nodes.panner.panningModel = 'HRTF';

      } else if(window.webkitAudioContext) {

        nodes.panner = mix.context.createPanner();
        // nodes.panner.panningModel = webkitAudioPannerNode.EQUALPOWER;
        // nodes.panner.panningModel = nodes.panner.EQUALPOWER;

      } else {
        return
      }

      nodes.lastnode.connect(nodes.panner);
      nodes.lastnode = nodes.panner;

    }

    // Convolver (Reverb etc) **********************************************
    // http://www.w3.org/TR/webaudio/#ConvolverNode

    else if(nodeType === 'convolver') {

      if(!mix.context.createConvolver) return;

      nodes.convolver = mix.context.createConvolver();

      // TODO: implement loading impulse response for the convolver node
      // http://chromium.googlecode.com/svn/trunk/samples/audio/impulse-responses/

      // nodes.convolver.buffer = convolverBuffer;


    }

    // Compressor ********************************************************
    // http://www.w3.org/TR/webaudio/#DynamicsCompressorNode

    else if(nodeType === 'compressor') {

      nodes.compressor = mix.context.createDynamicsCompressor();

      // no settings required really…

      nodes.lastnode.connect(nodes.compressor);
      nodes.lastnode = nodes.compressor;

    }

    // Delay ********************************************************
    // http://www.w3.org/TR/webaudio/#DelayNode

    else if(nodeType === 'delay') {

      if(detect.nodes.delayNode)
        nodes.delay = mix.context.createDelayNode();
      else
        nodes.delay = mix.context.createDelay();

      nodes.delay.delayTime = 0;

      nodes.lastnode.connect(nodes.delay);
      nodes.lastnode = nodes.delay;

    }
  }


  // ######   #####  ###  ##
  // ##   ## ##   ## #### ##
  // ######  ####### ## ####
  // ##      ##   ## ##  ###
  // ##      ##   ## ##   ##

  // "3d" stereo panning
  function pan(angleDeg) {

    if( !detect.webAudio || !status.ready || !nodes.panner ) return track

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

      trigger('pan', options.pan, track);

      return track; // all setters should be chainable
    }

    return options.pan;
  }



};

module.exports = Track;