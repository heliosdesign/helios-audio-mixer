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