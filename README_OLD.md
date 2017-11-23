**Bower** `helios-audio-mixer`

# Web Audio Mixer

Javascript audio multi-track mixer library.

The Web Audio API (full feature set) is supported in Chrome 10+, Firefox 25+, Safari 6+, and Edge 12+.

#### Contents

- [Development](#development)
- [Dependencies](#dependencies)
- [How To Use](#how-to-use)
- [API Reference](#api-reference)
	- Mixer Methods
	- Track/Group Methods
	- Track Options
	- Nodes
	- Track Events
- [HTML5 Mode](#html5-mode)

## Development

`gulp` to live compile modules, `gulp build` for minification.

Unit tests use [Mocha](https://mochajs.org/) and [Chai](http://chaijs.com/api/bdd/).

## Dependencies

- [heliosFrameRunner](https://github.com/heliosdesign/helios-frame-runner) (not _really_ a dependency, but recommended for managing `requestAnimationFrame` calls)
- [tween.js](https://github.com/sole/tween.js/) for tweening
- [Bowser](https://github.com/ded/bowser) for detecting browser versions, because Chrome and Firefox had some non-standard implementations.

### Props

…to Kevin Ennis for his excellent [Mix.js](https://github.com/kevincennis/Mix.js). We based this library on Mix.js when we started working with the web audio API a couple years ago.

## How to use

### Basic Example

```js
var Mixer = new HeliosAudioMixer();

// call update() using requestAnimationFrame (in this case using HeliosFrameRunner)
frameRunner.add({ id: 'mixer', f: Mixer.update });

Mixer.createTrack('track1', { source: 'path/to/audio/file' });

Mixer.getTrack('track1').gain(0.5).pan(180);

Mixer.getTrack('track1').tweenGain(0, 1)
  .then(function(track){
    Mixer.removeTrack(track);
  })

```

Remember to call `TWEEN.update()` using `requestAnimationFrame`, or tweens won’t work.

### Source Types

Tracks use buffer source by default. Use HTML5 element source for a track by setting the `sourceMode` option (an out-of-DOM `<audio>` element will be created), or setting the `source` option to an existing HTML5 media element instead of a string. The main advantage of HTML5 element source is that audio files can be streamed. The main disadvantage is that

```js
Mixer.createTrack('elementSourceTrack', {
  source: 'path/to/audio/file',
  sourceMode: 'element'
})

Mixer.createTrack('inDOMelementSourceTrack', {
  source: document.queryselector('audio#elementSourceTrack')
})
```


# API Reference

## Feature Detection

Access/override/whatever through `Mixer.detect`.

```js
Detect = {
	webAudio:    true | false,
	audioTypes: {
	  'mp3': true/false,
	  'm4a': true/false,
	  'ogg': true/false
	}, // in order of preference
	videoType:  {
	  '.webm': true/false,
	  '.mp4':  true/false,
	  '.ogv':  true/false
	},
	bowser:     bowser.js,
	tween:      <Boolean>,

}
```

## Mixer

`new HeliosAudioMixer( options )`

name | default | notes
:--|:--|:--
audioTypes | `[ 'mp3', 'm4a', 'ogg' ]` | List audio file types in order of preference. The first type available in the current browser will be used.
html5 | `false` | Force HTML5 mode.


### Mixer Methods

##### Track Management

- `createTrack( 'name', opts )` _see track options below_
- `removeTrack( 'name' || track object )`
- `getTrack( 'name' )` _returns track object_
- `getTrack( 'name' ).method()` access a single track, chainable

##### Global Mix Control

- `pause()`
- `play()`
- `mute()`
- `unmute()`
- `gain( <0-1> )`

##### Utilities

- `mix.setLogLvl( <Integer> )` `0` none, `1` minimal, `2` spammy

## Track

### Track Options

`mix.createTrack( 'name', options )`

name | default | notes
:--|:--|:--
source       | `""`     | Path to audio source (without file extension),<br>OR media element to use as source,<br>OR audio blob
gain         | `1`        | Initial gain (0-1)
panMode      | `"360"`     | Choose between stereo L/R pan (`stereo`), 360° pan (`360`), and full 3D pan (`3d`)
pan          | `0`        | Initial pan
nodes        | `[]`       | array of strings: names of desired audio nodes. See [Nodes](#nodes). Gain and pan nodes are always used.
start        | `0`        | start time in seconds
currentTime  | `0`        | current time (cached for resuming from pause)
looping      | `false`    |
autoplay     | `true`     | play immediately on load
muted        | `false`    |

### Track Methods

#### Events

`track.on('event', callback )`

See the [event list](#event-list) below. The callback receives the `track` object as an argument.

`track.off('event')`

`track.one('event', function)`

#### Control

`track.play()`

`track.pause()`

`track.stop()`

#### Gain

##### `track.gain(setTo)`

Getter/setter for gain, range 0-1.

If you call `gain()` while a track is muted, the value will be cached and applied upon unmuting.

##### `track.tweenGain(setTo, duration)`

##### `track.mute()`

##### `track.unmute()`



#### Pan

There are three panning modes available.

1. **Stereo** uses a `StereoPannerNode`, one axis, left to right. <br>`track.pan()` accepts `-1` to `1`.
2. **360** uses a simplified `PannerNode`. <br>`track.pan()` accepts an angle in degrees, or a string: `'front'`, `'back'`, `'left'`, `'right'`
3. **3d** uses a full `PannerNode`.

##### tweenPan

`track.tweenPan(angle, duration)`

Works for Stereo and 360 panning.

#### Time

##### `currentTime( setTo )`

Getter/setter for current time, in seconds.

##### `duration()`

Get track duration in seconds.

##### `formattedTime( includeDuration )`

Transforms:
`23` &rarr; `"00:23"` or `"00:23/00:45"`
`90` &rarr; `"01:30"` or `"01:30/2:00"`




### Track Events

name | when
:-- | :--
`load` | audio track is ready to play
`loadError` | source file couldn’t be loaded
`remove` | removeTrack()
`play` |
`pause` |
`stop` |
`ended` | track reaches the end
`pan` | pan is changed
`gain` | gain is changed
`analyse` | audio analysis data is updated

```
mix.getTrack('name').on('eventType',function(){});
mix.getTrack('name').off('eventType');
```

#### Nodes

Web Audio Mixer nodes

#### Analysis

FFT using the [AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode). Access analysis data at `track.analysis`. The raw data is available, as well as averages for lows, mids, highs, and the entire spectrum:

`track.getAnalysis()` returns:

```
{
  raw:    [128, 128, ...],
  average: 128,
  low:     128,
  mid:     128,
  high:    128
}
```

```
var track = Mixer.createTrack('analysisTrack', {
  source: 'file',
  nodes: 'analyse'
})

track.on('play', function(){
  frameRunner.add('fft', 'everyFrame', fft)
})

function fft(){
  var data = track.getAnalysis();
  console.log(data.average)
}
```

## HTML5 Mode

Fallback mode for older browsers, and iOS 7. Trying to use Web Audio features like pan will fail gracefully, without errors (`return false`).

#### Tracks

In HTML5 mode, creating a track that already exists will change its source, unlike Web Audio mode where this will return an error. This allows you to circumvent the iOS requirement that media elements can only be played after a user taps 'play'—simply play all your tracks on that first tap. **NOTE** that you can only play one audio element at a time.

```
// Create all tracks at the start
Mixer.createTrack('track1', {
	source: 'a_file.mp3'
});
Mixer.createTrack('track2', {});

// on iOS play button tap
for(var i=0; i < Mixer.tracks.length; i++ ){
	Mixer.tracks[i].play();
}

// If the track’s already been created, the mixer will swap its source
Mixer.createTrack('track1', {
	source:   'file.mp3',
	autoplay:  true
});
```

#### iOS 7

iOS 6 supports the Web Audio API and it works pretty well. iOS 7 "supports" the Web Audio API, but it’s very unstable. Web apps that worked perfectly on iOS 6 will crash in under a minute on iOS 7. Unfortunately Apple won’t allow alternative web rendering engines, so this library falls back to HTML5 on iOS 7.

#### iOS 8

iOS 8 actually

#### iOS Volume Control

iOS does *not* support volume control for HTML5 audio elements. The reasoning is that the user should be able to control the volume with the OS-level volume control. Apparently in Apple-land nobody could ever possibly want to layer two tracks, or fade anything in or out, ever.
