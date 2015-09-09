var Mixer = new heliosAudioMixer();

if(window.location.hash === '#html5' || ! Mixer.detect.webAudio) {
  console.log('HTML5 mode')
  Mixer.detect.webAudio = false;

  Mixer.createTrack('track1', {});
  Mixer.createTrack('track2', {});
  Mixer.createTrack('track3', {});
}

// mute()

Mixer.setLogLvl(2)

frameRunner.start();
frameRunner.add('updateMixerTween','everyFrame',Mixer.updateTween);

console.log('Feature detection: %O', Mixer.detect)

if(Mixer.detect.webAudio) document.getElementById('webaudio').innerHTML = "YES";
else            document.getElementById('webaudio').innerHTML = "NO";

// document.getElementById('audioType').innerHTML = Mixer.detect.audioType;


function mute(){
  console.log('mute')
  if(Mixer.muted){
    Mixer.unmute()
    document.getElementById('mix-mute').classList.remove('active')
  } else{
    Mixer.mute()
    document.getElementById('mix-mute').classList.add('active')
  }
}

/**************************************************************************

  Demo Track

**************************************************************************/

var demoTrack = function(name){
  var track
  var panCanvas = document.getElementById(name+'panCanvas');

  function create(){
    var opts = {
      source: 'audio/' + document.getElementById(name+'-source').value,
      sourceMode: document.getElementById(name+'-source-mode').value,
      gain: 1.0,
      looping: document.getElementById(name+'-looping').checked,
      muted: document.getElementById(name+'-muted').checked,
      autoplay: document.getElementById(name+'-autoplay').checked,
    }
    track = Mixer.createTrack(name, opts)

    track.on('ended', function(){
      console.log(name+'ended event')
    })

    track.on('pan',function(){
      updatePanDisplay(name, panCanvas)
      document.getElementById(name+'pan').value = track.options.pan
    })

    track.on('gain',function(){
      document.getElementById(name+'gain').value = track.options.gain*100
    })

    var timeEl = document.getElementById(name+'time')
    var playheadEl = document.getElementById(name+'playhead')

    track.on('play',function(){
      frameRunner.add('drone_timeUpdate','everyFrame', function(){
        updateTime( track, timeEl, playheadEl )
      })
    })

    track.on('pause',function(){
      frameRunner.remove('drone_timeUpdate','everyFrame')
    })

    var updateTime = function( track, timeEl, playheadEl ){
      if( !track ) return
      timeEl.innerHTML = track.formattedTime();
      playheadEl.style.left = ( track.currentTime() / track.duration() ) * 100 + 'px';
    }
  }

  document.getElementById(name+'gain').addEventListener('change',function(e){
    if(Mixer.getTrack(name)) Mixer.getTrack(name).gain(e.target.value/100)
  }, false)

  document.getElementById(name+'pan').addEventListener('change',function(e){
    if(Mixer.getTrack(name)) Mixer.getTrack(name).pan( e.target.valueAsNumber );
  },false)

  return {
    create: create
  }
}


var track1 = new demoTrack('track1')
var track2 = new demoTrack('track2')
var track3 = new demoTrack('track3')



// ********************************************************
// Setup and Events

function updatePanDisplay(trackName, canvas){
  // Canvas
  var x = 50 + (Mixer.getTrack(trackName).options.panX * 20);
  var y = 50 + (-Mixer.getTrack(trackName).options.panY * 20);

  var ctx = canvas.getContext('2d');

  ctx.clearRect(0,0, 100,100);

  ctx.arc(50,50, 2, 0,2*Math.PI);
  ctx.fill()

  ctx.fillRect(x-5,y-5,10,10)
}


// Master Gain Slider
document.getElementById('mastergain').addEventListener('change',function(e){
  Mixer.gain(e.target.value/100)
},false)