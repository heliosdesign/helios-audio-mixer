# Audio Mixer

Manage multiple audio tracks easily.

Powered by HTML5 media or, optionally, the Web Audio API. Note that Web Audio is mandatory on iOS, due to extremely limited HTML5 media support.

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

## Demo

Run `npm install` then `npm run demo`.


## Development

The library is bundled using webpack, and tested using Ava.

`npm start` bundles the library for development using `webpack-dev-server`.

`npm dist` bundles the library for production.

`npm test` runs Ava in watch mode. Also try `test-verbose` and `test-single`.










## API

### AudioMixer

---

#### `AudioMixer.track(id, params = {})`

Getter/setter for audio tracks. Calling `track` with a new ID will return a new Track object, with the specified params.

Call `track` with an existing ID will return the existing track. Specified parameters are ignored.

##### Track Params

All track params are optional, **except for `src`**. These are the defaults:

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











### Standard Track API

---

All track types should support this functionality. Some track types may add additional functionality.

All Track methods (except setters) return the Track object, so you can chain function calls, ie

```js
mix.track('id')
  .volume(1)
  .currentTime(20)
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

##### `Track.muted(set)`

Getter/setter for track muted status.


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















## Web Audio Tracks

Web Audio tracks wrap the Web Audio API in the HTML5 media interface, making it easier to control. As with all abstractions, some flexibility is lost.

Web Audio tracks gain functionality by chaining a audio nodes. By default, a web audio track has just one node which controls gain (volume). Some commonly used nodes (pan2d, pan3d, analysis) are included in this library. You can add your own nodes as well.

### Creating Nodes

Web Audio tracks take a `nodes` parameter, which accepts an array of nodes. They'll be connected in the order you specify, with the default gain node coming first. The last node will be connected to the destination. This library only supports a single chain of nodes (for now!), although the Web Audio API allows more complex setups.

The `nodes` array can contain:

- the name of a pre-defined node

  ```js
  nodes: [ 'GainNode', 'PanNode2D', 'PanNode3D', 'AnalysisNode' ]
  ```
- an object with the name of a pre-defined node and params

  ```js
  nodes: [ { type: 'PanNode2D', options: {} } ]
  ```
- a node object

  ```js
  let node = mix.context.createNodeType()
  // ...
  nodes: [ node ]
  ```

All these types can be mixed, ie:

```js
let WebAudioTrack = mix.track('id', {
  src: 'audio.file',
  nodes: [
    'PanNode2D',
    { type: 'analysis', options: {} },
    customNode,
  ]
})
```

### Accessing nodes

```js
let nodes = WebAudioTrack.nodes() // returns node array
// nodes[0]

let pan = WebAudioTrack.node('PanNode2D')
pan.method()
```

If there are multiple nodes of the same type, accessing a node by name using `Track.node()` will return the last node of its type. Considering an alias system.

### Custom nodes

Creating a node using the vanilla JS Web Audio API:

```js
let customNode = mix.context.createNode()

let track = mix.track('id', {
  src: 'audio.file',
  nodes: [ customNode, 'Pan3DNode' ],
})
```

Creating a custom class:

```js
class CustomNode {
  // ... see src/modules/nodes/allNodes.js for reference implementation
}

mix.registerNode('custom', CustomNode)

let WebAudioTrack = mix.track('id', {
  src: 'audio.file',
  nodes: [
    'custom',                       // default, no options
    { type: 'custom', options: {} } // with options
  ],
})
```

### Node Types

#### `GainNode`

All Web Audio tracks have a gain node. You can access it through the `Track.volume()` method, as well as directly:

```js
let gainNode = track.node('GainNode')
gainNode.gain(0.5)
```

#### `PannerNode2D`

The Web Audio `PannerNode` interface is quite complicated. `PanNode2D` provides a simpler interface, which pans in a horizontal circle around the listener.

```js
let pan2d = track.node('PannerNode2D')
pan2d.pan('front')
pan2d.tweenPan(90, 1)
```

Pan can be expressed in degrees (0–360), or a direction (string):

```js
'front'    0
'right'   90
'back'   180
'left'   270
```

#### `PannerNode`

Thin wrapper for Web Audio API `PannerNode`.

```js

```

#### `AnalysisNode`

FFT audio analysis.

```js



```













## Features under Consideration

- volume tween easing (Penner equations for HTML5, ramps for Web Audio)