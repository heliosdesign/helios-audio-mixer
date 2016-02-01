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
  var httpRequest

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

  track.destroy = destroy;

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

      loadBufferSource()
        .then(function(){

        })

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



  function loadBufferSource() {
    return new Promise(function(resolve, reject){
      debug.log(2, 'Track "' + name + '" webAudio source: "' + options.source + '"');

      httpRequest = new XMLHttpRequest();
      httpRequest.open('GET', options.source, true);
      httpRequest.responseType = 'arraybuffer';

      httpRequest.addEventListener('readystatechange', onreadystatechange, false)
      httpRequest.addEventListener('error', loadError, false)

      httpRequest.send();
    })
  }



  function loadError(){
    events.trigger('loadError', track)
  }

  function onreadystatechange(e){
    if(this.readyState === 4){
      if(this.status === 200 || this.status === 206 || this.status === 304){
        // 200 -> success
        debug.log(2, '"' + name + '" loaded "' + options.source + '"');
        audioData = this.response; // cache the audio data
        status.loaded = true;
        events.trigger('load', track);
        if( shouldPlay ){
          play();
        } else {
          if(options.autoplay) play();
        }
      } else {
        // other -> failure
        debug.log(1, 'couldn’t load track "' + name + '" with source "' + options.source + '"');
        events.trigger('loadError', track, { status: this.status });
      }

      httpRequest = null
    }
  }


  /*

    ######  ##     ##### ##    ##
    ##   ## ##    ##   ## ##  ##
    ######  ##    #######  ####
    ##      ##    ##   ##   ##
    ##      ##### ##   ##   ##

  */
  function play() {

    // if track isn’t loaded yet, tell it to play when it loads
    if(!status.loaded){
      shouldPlay = true;
      return track;
    }

    if(status.playing){
      return track;
    }

    shouldPlay = false;

    if(options.sourceMode === 'buffer'){
        createBufferSource()
          .then(playBufferSource)
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

  function createBufferSource() {
    return new Promise(function(resolve, reject){
      status.ready = false;

      // Construct Audio Buffer
      // (we have to re-construct the buffer every time we begin play)

      source = null;

      // W3C standard implementation (Firefox, recent Chrome)
      if(typeof mix.context.createGain === 'function') {

        mix.context.decodeAudioData(audioData, function(decodedBuffer){
          if(status.ready) return;

          source           = mix.context.createBufferSource();
          var sourceBuffer = decodedBuffer;
          source.buffer    = sourceBuffer;

          resolve()
        });
      }

      // Non-standard Webkit implementation (Safari, old Chrome)
      else if(typeof mix.context.createGainNode === 'function') {

        source = mix.context.createBufferSource();
        var sourceBuffer  = mix.context.createBuffer(audioData, true);
        source.buffer = sourceBuffer;

        resolve()
      }
    })

  }

  function playBufferSource() {

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

    debug.log(2, 'Playing track (buffer) "' + name + '" from ' + startFrom + ' (' + startTime + ') gain ' + gain());

    // prefer start() but fall back to deprecated noteOn()
    if(typeof source.start === 'function'){
      source.start(0, startFrom);
    } else {
      source.noteOn(startFrom);
    }

    setEndTimer();

    status.playing = true;
    events.trigger('play', track);
  }






  // fake ended event
  function setEndTimer(){
    var startFrom = cachedTime || 0;
    var timerDuration = (source.buffer.duration - startFrom);

    if(onendtimer){
      clearTimeout(onendtimer);
    }

    onendtimer = setTimeout(ended, timerDuration * 1000);
  }

  function ended() {

    if(options.looping){
      events.trigger('loop', track);
      pause(0);
      play();
    } else {
      events.trigger('ended', track);
    }

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




  function destroy(){
    if(httpRequest){
      httpRequest.abort()
      // httpRequest.addEventListener('readystatechange', onreadystatechange, false)
      // httpRequest.addEventListener('error', loadError, false)
    }
  }


};

module.exports = Track;
