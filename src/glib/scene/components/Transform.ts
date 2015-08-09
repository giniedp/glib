module Glib.Components {

  import Vec3 = Vlib.Vec3;
  import Quat = Vlib.Quat;
  import Mat4 = Vlib.Mat4;

  export interface TransformProperties {
    position?:Vlib.Vec3;
    rotation?:Vlib.Quat;
    scale?:Vlib.Vec3;
  }

  export class Transform implements Component {
    name:string = 'Transform';
    service:boolean = true;
    enabled:boolean = true;

    scale = Vec3.one();
    position:Vlib.Vec3 = Vec3.zero();
    rotation:Vlib.Quat = Quat.identity();
    worldMat:Vlib.Mat4 = Mat4.identity();
    inverseMat:Vlib.Mat4 = Mat4.identity();

    _tempQuat = Quat.identity();
    _tempMat = Mat4.identity();
    _tempVec = Vec3.zero();
    _dirty = false;

    constructor(params?:TransformProperties) {
      if (params) {
        Glib.utils.extend(this, params);
      }
      this.scale = Vec3.convert(this.scale || Vec3.one());
      this.position = Vec3.convert(this.position || Vec3.zero());
      this.rotation = Quat.convert(this.rotation || Quat.identity());
    }

    update() {
      if (this._dirty) {
        this.worldMat
          .initIdentity()
          .setScale(this.scale)
          .selfMultiply(this._tempMat.initFromQuaternion(this.rotation))
          .setTranslation(this.position);
        this.inverseMat
          .initFrom(this.worldMat)
          .selfInvert();
        this._dirty = false;
      }
    }

    setRotation(quaternion:Quat):Transform {
      this.rotation.initFrom(quaternion);
      this._dirty = true;
      return this;
    }

    setRotationAxisAngle(axis:Vlib.IVec3, angle:number):Transform {
      this.rotation.initAxisAngle(axis, angle);
      this._dirty = true;
      return this;
    }

    setRotationXYZAngle(x:number, y:number, z:number, angle:number):Transform {
      this.rotation.initAxisAngle(this._tempVec.init(x, y, z).selfNormalize(), angle);
      this._dirty = true;
      return this;
    }

    rotateAxisAngle(axis:Vlib.IVec3, angle:number):Transform {
      this.rotation.selfConcat(this._tempQuat.initAxisAngle(axis, angle));
      this._dirty = true;
      return this;
    }

    rotateXYZAngle(x:number, y:number, z:number, angle:number):Transform {
      this.rotation.selfMultiply(this._tempQuat.initAxisAngle(this._tempVec.init(x, y, z), angle));
      this._dirty = true;
      return this;
    }

    rotateYawPitchRoll(yaw:number, pitch:number, roll:number):Transform {
      this.rotation.selfConcat(this._tempQuat.initYawPitchRoll(yaw, pitch, roll));
      this._dirty = true;
      return this;
    }

    setScale(scale:Vlib.IVec3):Transform {
      this.scale.x = scale.x;
      this.scale.y = scale.y;
      this.scale.z = scale.z;
      this._dirty = true;
      return this;
    }

    setScaleXYZ(scaleX:number, scaleY:number, scaleZ:number):Transform {
      this.scale.x = scaleX;
      this.scale.y = scaleY;
      this.scale.z = scaleZ;
      this._dirty = true;
      return this;
    }

    scaleBy(scale:Vlib.IVec3):Transform {
      this.scale.x *= scale.x;
      this.scale.y *= scale.y;
      this.scale.z *= scale.z;
      this._dirty = true;
      return this;
    }

    scaleXYZ(scaleX:number, scaleY:number, scaleZ:number):Transform {
      this.scale.x *= scaleX;
      this.scale.y *= scaleY;
      this.scale.z *= scaleZ;
      this._dirty = true;
      return this;
    }

    scaleUniform(scale: number): Transform {
        this.scale.x = scale;
        this.scale.y = scale;
        this.scale.z = scale;
        this._dirty = true;
        return this;
    }

    setScaleUniform(value:number):Transform {
      this.scale.x = value;
      this.scale.y = value;
      this.scale.z = value;
      this._dirty = true;
      return this;
    }

    setPosition(position):Transform {
      this.position.x = position.x;
      this.position.y = position.y;
      this.position.z = position.z;
      this._dirty = true;
      return this;
    }

    setPositionXYZ(x:number, y:number, z:number):Transform {
      this.position.x = x;
      this.position.y = y;
      this.position.z = z;
      this._dirty = true;
      return this;
    }

    translate(vec:Vlib.IVec3):Transform {
      this.position.x += vec.x;
      this.position.y += vec.y;
      this.position.z += vec.z;
      this._dirty = true;
      return this;
    }

    translateXYZ(x:number, y:number, z:number):Transform {
      this.position.x += x;
      this.position.y += y;
      this.position.z += z;
      this._dirty = true;
      return this;
    }

    debug():string {
      return [
        `- component: ${this.name}`,
        `  enabled  : ${this.enabled}`,
        `  world    :`,
        Vlib.Mat4.prettyString(this.worldMat)
      ].join("\n")
    }
  }
}
