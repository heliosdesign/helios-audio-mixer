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

