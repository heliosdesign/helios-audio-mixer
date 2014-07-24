# iOS HTML5 Audio Manager

Single audio/video element mixer for iOS’ *severely* limited HTML5 audio implementation. Standalone, no dependencies.

Why does this library exist? iOS 6 supports the Web Audio API and it works reasonably well. iOS 7 “supports” the Web Audio API, but it’s very unstable. Web apps that worked perfectly on iOS 6 will crash in under a minute on iOS 7. So if you want to use sound in your iOS web app, it’s HTML5 or nothing.

## iOS Quirks

### Volume Control

iOS does *not* support volume control for HTML5 audio elements. The reasoning is, perhaps, that the user should be able to control the volume with the OS-level volume control. Apparently in Apple-land nobody could ever possibly want to layer two tracks, or fade anything in or out, ever.

### Autoplay/Tap to Begin

Each media element you want to use needs to be user-activated, directly triggered from a tap event, once. After that, you can change the source and play/pause/seek automatically as much as you’d like. Remember you can’t `play` an element before it has a source.

## How to use

```
var Mix = new heliosiOSAudioMixer({
	audioElement: document.querySelector('#audio'),
	videoElement: document.querySelector('#video')
});
```

If you want the `audio` or `video` element to exist outside the DOM, don’t supply one. You can access both later through `Mix.options.audioElement` and `Mix.options.videoElement`.

```
Mix.createTrack('track1', { source: 'path/to/audio-file' })
	
Mix.createTrack('track2', { 
	source: 'path/to/file',
	type:   'video',
	loop:    true
})
```

Note that creating tracks only saves this metadata to an object, `Mix.tracks`. To play a track, you need to load it track into one of the two media elements:

```
Mix.load( 'track1' )
```

The mixer knows this track is an audio track (default), so it sets the audio element to the active element. The audio element is reset and updated with the attributes and events for this track.

You can also reset the mixer using `Mix.unload()`. This clears all events as well as the active media element’s source.

### Playback

Control playback through `Mix.element`, a direct reference to the active media element (`audio` or `video`).

### Chaining

All top-level Mix methods (that don’t explicitly return something) are chainable:

```
Mix.createTrack('asdf', {source: 'source'}).load('asdf')
```

### Events

In addition to source and parameters, tracks can have sets of events. These events are cleanly added and removed from the two media elements.

All [HTML5 media events](http://www.w3.org/2010/05/video/mediaevents.html) are available for use: `loadstart`, `progress`, `suspend`, `abort`, `error`, `emptied`, `stalled`, `loadedmetadata`, `loadeddata`, `canplay`, `canplaythrough`, `playing`, `waiting`, `play`, `pause`, `timeupdate`, `seeking`, `seeked`, `ended`, `ratechange`, `durationchange`, `resize`, `volumechange`.

```
Mix.createTrack('eventful',{
	source: 'path/to/source',
	events: {
		play: function(){ // do }
	}
})
```


### timeFormat()

`Mix.timeFormat( seconds )` 

Converts a float to the format `MM:SS`.
