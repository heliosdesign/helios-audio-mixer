
function normalize(value) {
  if (value > 1) return 1
  if (value < 0) return 0
  return value
}

function timeFormat(seconds) {
  const min = Math.floor(seconds / 60)
  const m = min < 10 ? `0${min}` : min

  const sec = Math.floor(seconds - (m * 60))
  const s = sec < 10 ? `0${sec}` : sec

  return `${m}:${s}`
}

function lerp(start, end, now) {
  return (1 - now) * start + now * end
}

function timeoutPromise(duration) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), duration)
  })
}

export default { normalize, timeFormat, lerp, timeoutPromise }
