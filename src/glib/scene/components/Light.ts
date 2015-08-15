module Glib.Components {

  import Vec4 = Vlib.Vec4;
  import Vec3 = Vlib.Vec3;

  export interface LightProperties {
    range?:number;
    intensity?:number;
    specularIntensity?:number;
    spotOuterAngle?:number;
    spotInnerAngle?:number;
    castShadow?:boolean;
    position?: Vec3;
    direction?: Vec3;
    color?: Vec4;
    type?: number;
  }

  export interface LightData {
    position: Vec3;
    direction: Vec3;
    color: Vec4;
    misc: Vec4;
    type: number;
  }

  export var LightType = {
    None: 0,
    Directional: 1,
    Point: 2,
    Spot: 3
  };

  export var LightTypeName = {
    0: 'None',
    1: 'Directional',
    2: 'Point',
    3: 'Spot'
  };

  export class Light implements Component, LightProperties {
    node: Entity;
    name:string = 'Light';
    enabled:boolean = true;
    service:boolean = true;

    range:number = 0;
    intensity:number = 1;
    specularIntensity:number = 1;
    spotOuterAngle:number = 0;
    spotInnerAngle:number = 0;
    castShadow:boolean = false;
    position: Vec3;
    direction: Vec3;
    color: Vec4;
    type: number;
    packedData: LightData;

    constructor(params?:LightProperties){
      if (params) {
        Glib.utils.extend(this, params);
      }

      this.position = Vec3.convert(this.position || Vec3.create(0, 0, 0));
      this.direction = Vec3.convert(this.direction || Vec3.create(0, 0, -1));
      this.color = Vec4.convert(this.color || Vec4.create(1, 1, 1, 1));
      this.type = this.type || LightType.Directional;
      this.packedData = {
        position: Vec3.zero(),
        direction: Vec3.zero(),
        color: Vec4.zero(),
        misc: Vec4.zero(),
        type: 0
      };
    }

    update(){
      var t = this.node.s.Transform;
      if (t){
        t.worldMat.getForward(this.direction);
        t.worldMat.getTranslation(this.position);
      }
      this.updatePackedData();
    }

    updatePackedData(){
      var data = this.packedData;

      data.position.initFrom(this.position);
      data.direction.initFrom(this.direction);

      data.color.x = this.color.x * this.intensity;
      data.color.y = this.color.y * this.intensity;
      data.color.z = this.color.z * this.intensity;
      data.color.w = this.color.w * this.specularIntensity;

      data.misc.x = this.range;
      data.misc.y = Math.cos(this.spotOuterAngle);
      data.misc.z = Math.cos(this.spotInnerAngle);
      data.type = this.type;
    }

  }
}
