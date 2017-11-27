# Audio Mixer

Manage multiple HTML5 audio elements easily.

Can be extended with Web Audio API functionality using the Web Audio addon (to do). Web Audio is mandatory on iOS, due to its extremely limited HTML5 media support.

All volume values are normalized, ie 0-1, and all time values are in seconds.

## Usage

```js
import { Mixer } from 'helios-audio-mixer'

let audioMixer = new Mixer()

audioMixer.track('track1', { src: 'path/to/audio.file' })

let track1 = audioMixer.track('track1')
track1.volume(0.5)

track1.tweenVolume(0, 1)
  .then(track => audioMixer.remove(track))
```










## API

### AudioMixer

---

#### `AudioMixer.track(id, params = {})`

Getter/setter for audio tracks. Calling `track` with a new ID will return a new Track object, with the specified params.

Call `track` with an existing ID will return the existing track. Specified parameters are ignored.

##### Track Params

All track params are optional—**except for `src`**.

```js
{
  src:  'path/to/audio.file',
  volume:   1,
  muted:    false,
  start:    0,
  loop:     false,
  autoplay: false,
  muted:    false,
  timeline: [],     // see Timeline section of this readme
}
```

##### Track Type

Several track types are available: `Html5Track` (default), `BufferSourceTrack`, `ElementSourceTrack`, `StreamSourceTrack`, `ToneTrack`. See [Track Types](#track-types) for more info.

Pass the custom Track class as a `type` param when creating a track. If omitted, you'll get an `Html5Track`.

```js
import { Mixer, BufferSourceTrack } from 'helios-audio-mixer'

let buffer = mix.track('custom', {
  src:  'audio.file',
  type:  BufferSourceTrack,
})
```

#### `AudioMixer.tracks()`

Returns the current array of tracks so you can operate on all tracks, ie

```
mix.tracks().forEach(track => track.pause())
```

#### `AudioMixer.remove(id or track)`

Immediately removes a specified track, by `'track id'` or Track object.

#### `AudioMixer.volume(0-1)`

The AudioMixer’s volume setting acts like a master volume slider, independent of individual tracks. Track volume exists within the master volume envelope. If a track has a volume of 0.5 and the master volume is set to 0.5, it will play back at 0.25.


### Track

---

All Track methods (except setters) return the Track object, so you can chain function calls, ie

```
mix.track('id').volume(1).currentTime(20)
```

#### Events

##### `Track.on('event type', callback)`

This is an alias for `addEventListener`, so all the HTML5 media events are available: `canplaythrough`, `ended`, `play`, `pause`, etc. Callbacks receive the Track object as their `this` context:

```js
track.on('play', callback)

function callback(e){
  let track = this
  track.tweenVolume(1, 5)
}
```

##### `Track.off('event type', callback)`

And this is an alias for `removeEventListener`. If you don’t pass in a callback function—`track.off('play')`—all events of that type will be removed.

##### `Track.one('event type', callback)`

Add an event that fires only once, ie on `canplaythrough`.

#### Playback Control

##### `Track.play()`
##### `Track.pause()`
##### `Track.stop()`

Stop also resets the track's current time to 0.

##### `Track.currentTime(time)`

Getter/setter for `currentTime`. Call without an argument to get the currentTime.

##### `track.formattedTime(includeDuration)`

Returns the current time in the format `"00:23"`, or `"00:23/00:45"` with duration.

##### `Track.duration()`

Returns the track duration in seconds. Will return 0 until `loadedmetadata` event has fired.

##### `Track.volume(volume)`

Set the volume for this individual track. Normalized value, 0–1.

##### `Track.tweenVolume(volume, time)`

Fade to a volume over time. Returns a promise, not the track object.

```js
track.tweenVolume(1, 10.5).then()
```


### Timeline Events

Timeline events can trigger callbacks when audio playback reaches a specific time. You can add timeline events when a track is created:

```js
let timelineTrack = audioMixer.track('timelineTrack', {
  ...
  timelineEvents: [
    { time:  1.0, callback: fn },
    { time: 10.3, callback: fn },
  ]
})
```

You can also add and remove timeline events after the track is created:

##### `Track.timelineEvent(time, callback)`

##### `Track.removeTimelineEvent(time, callback)`


Timeline event callbacks get the Track object as their `this` context.

```js
timelineTrack.timelineEvent(10, callback)

function callback(){
  let track = this
  track.volume(1)
  ...
}
```










## Track Types

Additional track types implement the standard Track API, with added functionality.

### `Html5Track`

_Requirements: HTML5 Media support_

Uses an HTML5 `<audio>` element.


#### `BufferSourceTrack`

Uses a Web Audio buffer source. Best for use with small audio files, as the entire file must be downloaded before playback can begin. If you want to use the Web Audio API for larger files, `MediaSourceTrack` can play media as it downloads.

If you want full audio mixer functionality (ie multiple tracks) on iOS, this track type makes things a lot easier. Media elements are subject to iOS rules about tap-to-play.


#### `MediaSourceTrack`

Uses an HTML5 `<audio>` element as input. Supports the full set of Web Audio nodes. Can stream files, so ideal for larger files.


#### `StreamSourceTrack`

Uses a MediaStream as input, ie a live mic input via `getUserMedia`.















## Web Audio API

Web Audio tracks add functionality by chaining a variety of audio nodes. By default, a web audio track has just one node which controls gain (volume).

### Nodes

#### Creating nodes

```
let WebAudioTrack = mix.track('id', {
  src: 'audio.file',
  nodes: [ 'pan2d', 'analysis' ],
})
```

```
let WebAudioTrack = mix.track('id', {
  src: 'audio.file',
  nodes: [
    'pan2d',
    { type: 'analysis', options: {} },
  ]
})
```

#### Accessing nodes

```
let pan = WebAudioTrack.node('pan2d')
pan.method()
```

#### Creating custom nodes


```
class CustomNode {
  // ... see src/modules/nodes/allNodes.js for reference implementation
}

mix.registerNode('custom', CustomNode)

let WebAudioTrack = mix.track('id', {
  src: 'audio.file',
  nodes: [
    'custom',
    { type: 'custom', options: {} }
  ],
})
```













## Features under Consideration

- volume tween easing (Penner equations)