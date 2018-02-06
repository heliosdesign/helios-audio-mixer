
function normalize(value){
  if(value > 1) return 1
  if(value < 0) return 0
  return value
}

function timeFormat(seconds) {
  var m = Math.floor(seconds / 60) < 10 ? '0' + Math.floor(seconds / 60) : Math.floor(seconds / 60);
  var s = Math.floor(seconds - (m * 60)) < 10 ? '0' + Math.floor(seconds - (m * 60)) : Math.floor(seconds - (m * 60));
  return m + ':' + s;
}

function lerp(start, end, now) {
  return (1 - now) * start + now * end;
}

function timeoutPromise(duration){
  return new Promise(resolve => {
    setTimeout(() => resolve(), duration)
  })
}

module.exports = { normalize, timeFormat, lerp }
