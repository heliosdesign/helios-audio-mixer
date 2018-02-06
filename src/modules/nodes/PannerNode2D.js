/*

  Pan Node (2D - left/right)

*/

class PannerNode2D {
  constructor(params){
    let ctx = params.context

    // the name of this function is the same for
    // both prefixed and unprefixed audio contexts
    this.node = ctx.createPanner()

    this.values = {
      pan:  0,
      panX: 0,
      panY: 0,
      panZ: 0,
    }

    // additional setup here
  }

  pan(angle){

    if(typeof angle === 'string') {
      if(     angle === 'front') angle =   0;
      else if(angle === 'back' ) angle = 180;
      else if(angle === 'left' ) angle = 270;
      else if(angle === 'right') angle =  90;
    }

    if(typeof angle === 'number') {

      this.values.pan = angle % 360;

      var angleRad = (-angle + 90) * 0.017453292519943295; // * PI/180

      var x = this.values.panX = Math.cos(angleRad);
      var y = this.values.panY = Math.sin(angleRad);
      var z = this.values.panZ = -0.5;

      this.node.setPosition(x, y, z)
    }
  }

  tweenPan(angle, duration){

  }

}

export default PannerNode2D