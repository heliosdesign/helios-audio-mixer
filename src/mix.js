/*

  ###  ### #### ##   ##
  ########  ##   ## ##
  ## ## ##  ##    ###
  ##    ##  ##   ## ##
  ##    ## #### ##   ##

*/

var u = require('./utils')
var Track = require('./track')
var detect = require('./detect')
var debug = require('./debug')


var Mix = function(opts) {

  this.Track = Track

  this.setLogLvl = debug.setLogLvl

  var defaults = {
    fileTypes: [ '.mp3', '.m4a', '.ogg' ],
    html5: false,
    gain: 1, // master gain for entire mix
  }
  this.options = u.extend(defaults, opts || {})

  this.tracks  = [];    // tracks as numbered array
  this.lookup  = {};    // tracks as lookup table: lookup['trackname']

  this.muted   = false; // master mute status

  this.context = null;  // AudioContext object (if webAudio is available)

  this.detect  = detect; // external reference to detect object


  // Web Audio support overrides
  // ********************************************************

  if(
    (detect.browser.name === 'Firefox' && detect.version && detect.version < 25) || // Firefox < 25
    (detect.browser.ios === true && detect.browser.version === 7) ||                 // ios 7
    this.options.html5
 ) {
    detect.webAudio = false;
  }


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

  if(detect.webAudio === true) {
    this.context = (typeof AudioContext === 'function' ? new window.AudioContext() : new window.webkitAudioContext() )
  }

  debug.log(1, 'initialized,', (detect.webAudio ? 'Web Audio Mode,' : 'HTML5 Mode,'), 'can play:', this.options.fileTypes)

  return this

};

/*

  Event Functionality

*/
Mix.prototype.on = u.events.on;
Mix.prototype.one = u.events.one;
Mix.prototype.off = u.events.off;
Mix.prototype.trigger = u.events.trigger;


/**************************************************************************

  Track Management

**************************************************************************/

Mix.prototype.createTrack = function(name, opts) {

  var _this = this;
  var track;

  if(!name)
    debug.log(0, 'Can’t create track with no name')

  if(detect.webAudio === true) {

    if(this.lookup[name]) {
      debug.log(0, 'a track named “' + _this.name + '” already exists')
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

      track.options = u.extend(track, track.defaults, opts || {});

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
    debug.log(1, 'can’t remove "' + name + '", it doesn’t exist');
    return;
  }

  if(detect.webAudio === true) {

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
    debug.log(1, 'Removed track "' + name + '"');

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

  debug.log(1, 'Pausing ' + this.tracks.length + ' track(s) ||')

  for (var i = 0; i < this.tracks.length; i++)
    this.tracks[i].pause()
};

Mix.prototype.play = function() {

  debug.log(1, 'Playing ' + this.tracks.length + ' track(s) >')

  for (var i = 0; i < this.tracks.length; i++)
    this.tracks[i].play()
};

Mix.prototype.stop = function() {

  debug.log(1, 'Stopping ' + this.tracks.length + ' track(s) .')

  for (var i = 0; i < this.tracks.length; i++)
     this.tracks[i].stop()
};




Mix.prototype.mute = function() {
  if(this.muted) return
  this.muted = true
  debug.log(1, 'Muting ' + this.tracks.length + ' tracks')
  for (var i = 0; i < this.tracks.length; i++)
    this.tracks[i].mute();
};


Mix.prototype.unmute = function() {
  if(!this.muted) return
  this.muted = false
  debug.log(1, 'Unmuting ' + this.tracks.length + ' tracks')
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
  var report = ""
  for (var i = 0; i < this.tracks.length; i++) {
    report += this.tracks[i].gain() + '\t' + this.tracks[i].currentTime() + '\t' + this.tracks[i].name + '\n'
  }
  console.log(report)
}





module.exports = Mix;