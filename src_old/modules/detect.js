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