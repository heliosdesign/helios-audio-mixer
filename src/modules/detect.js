var detect = {};

// Web audio API support
detect.webAudio = !!(window.AudioContext || window.webkitAudioContext),

// Which audio types can the browser actually play?
detect.audioTypes =(function() {
  var el = document.createElement('audio')

  return {
    '.m4a': !!(el.canPlayType && el.canPlayType('audio/mp4; codecs="mp4a.40.2"').replace(/no/, '')),
    '.mp3': !!(el.canPlayType && el.canPlayType('audio/mpeg;').replace(/no/, '')),
    '.ogg': !!(el.canPlayType && el.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''))
  }
})(),

detect.videoTypes = (function() {

  var el = document.createElement('video')

  return {
    '.webm': !!(el.canPlayType && el.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/no/, '')),
    '.mp4':  !!(el.canPlayType && el.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, '')),
    '.ogv':  !!(el.canPlayType && el.canPlayType('video/ogg; codecs="theora"').replace(/no/, ''))
  }
})(),

// prefer bowser, but with fallback
detect.browser = (function() {

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
detect.tween = (function() {
  return (typeof TWEEN === 'undefined') ? false : true
})()

module.exports = detect;