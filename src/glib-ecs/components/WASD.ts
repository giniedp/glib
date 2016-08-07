module Glib.Components {


  import Vec3 = Glib.Vec3;
  import Vec4 = Glib.Vec4;
  import Quat = Glib.Quat;
  import Mat4 = Glib.Mat4;

  import Keys = Glib.Input.KeyCode;
  import MouseButtons = Glib.Input.MouseButton;

  export class WASD implements Component {
    node: Entity;
    enabled:boolean = true;

    yaw:number = 0;
    pitch:number = 0;
    targetYaw:number = 0;
    targetPitch:number = 0;
    turnSpeed:number = 0.5;
    moveSpeed:number = 10;
    runSpeed:number = 50;
    turnDamping:number = 0.25;
    moveDamping:number = 0.25;

    _currentMoveSpeed:number = 0;
    _currentTurnSpeed:number = 0;
    _temp:Vec3 = Vec3.zero();
    _direction:Vec3 = Vec3.zero();
    _translation:Vec3 = Vec3.zero();
    _rotation:Quat = Quat.identity();

    mouse: Mouse;
    keyboard: Keyboard;
    transform: Transform;

    setup() {
      this.mouse = this.node.root.getService('Mouse');
      this.keyboard = this.node.root.getService('Keyboard');
      this.transform = this.node.getService('Transform');
    }

    update(timeMs) {
      var timeSec = timeMs / 1000.0;
      var keyboard = this.keyboard;
      var mouse = this.mouse;
      var trans = this.transform;
      var speed = this.moveSpeed;
      var targetSpeed = 0;
      this._translation.init(0, 0, 0);

      if (keyboard.isPressed(Keys.W)) {
        trans.worldMat.getForward(this._direction);
        this._translation.selfAdd(this._direction);
        targetSpeed = speed;
      }
      if (keyboard.isPressed(Keys.S)) {
        trans.worldMat.getBackward(this._direction);
        this._translation.selfAdd(this._direction);
        targetSpeed = speed;
      }
      if (keyboard.isPressed(Keys.A)) {
        trans.worldMat.getLeft(this._direction);
        this._translation.selfAdd(this._direction);
        targetSpeed = speed;
      }
      if (keyboard.isPressed(Keys.D)) {
        trans.worldMat.getRight(this._direction);
        this._translation.selfAdd(this._direction);
        targetSpeed = speed;
      }
      if (keyboard.isPressed(Keys.Q)) {
        trans.worldMat.getDown(this._direction);
        this._translation.selfAdd(this._direction);
        targetSpeed = speed;
      }
      if (keyboard.isPressed(Keys.E)) {
        trans.worldMat.getUp(this._direction);
        this._translation.selfAdd(this._direction);
        targetSpeed = speed;
      }
      if (keyboard.isPressed(Keys.Shift)) {
        targetSpeed = this.runSpeed;
      }
      if (this._translation.lengthSquared() > 0) {
        this._translation.selfNormalize();
      }
      if (targetSpeed !== 0) {
        this._temp.initFrom(this._translation);
      }

      this._currentMoveSpeed += (targetSpeed - this._currentMoveSpeed) * this.moveDamping;
      this._currentMoveSpeed = ((this._currentMoveSpeed * 1000)|0) / 1000;
      if (this._currentMoveSpeed !== 0) {
        Vec3.multiplyScalar(this._temp, this._currentMoveSpeed * timeSec, this._translation);
        trans.translate(this._translation);
      }

      if (mouse.leftButtonIsPressed) {
        var mouseX = mouse.xDelta;
        var mouseY = mouse.yDelta;

        if (mouseX !== 0 || mouseY !== 0) {
          speed = this.turnSpeed * timeSec;
          this.targetYaw += mouseX * -speed;
          this.targetPitch += mouseY * -speed;
        }
      }

      this.yaw += (this.targetYaw - this.yaw) * this.turnDamping;
      this.pitch += (this.targetPitch - this.pitch) * this.turnDamping;
      this._rotation.initYawPitchRoll(this.yaw, this.pitch, 0);
      trans.rotation.initFrom(this._rotation);
      trans._dirty = true;
    }
  }
}

