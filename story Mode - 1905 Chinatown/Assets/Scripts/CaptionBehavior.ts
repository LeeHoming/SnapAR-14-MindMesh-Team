import animate, { CancelSet } from "SpectaclesInteractionKit.lspkg/Utils/animate";

@component
export class CaptionBehavior extends BaseScriptComponent {
  @input captionText: Text;
  @input scaleObj: SceneObject;
  @input captionOffset: vec3 = vec3.zero();
  @input addRandom: boolean = false;

  private trans: Transform;
  private scaleTrans: Transform;
  private startPos: vec3;
  private randomPosX: number = 0;
  private randomRotZ: number = 0;

  private scaleCancel: CancelSet = new CancelSet();

  onAwake() {
    this.trans = this.getSceneObject().getTransform();
    this.scaleTrans = this.scaleObj.getTransform();
    this.scaleTrans.setLocalScale(vec3.zero());
  }

  openCaption(text: string, pos: vec3, rot: quat) {
    pos = pos.add(this.captionOffset);

    if (this.addRandom) {
      //add random offset to x position
      this.randomPosX = (Math.random() - 0.5) * 10;
      //add random rotation around z-axis, range from -0.1 to 0.1 radians
      this.randomRotZ = (Math.random() - 0.5) * 0.5; // range from -0.1 to 0.1 radians
      
      pos = pos.add(vec3.right().uniformScale(this.randomPosX));
      // Apply random rotation to the existing rotation
      var randomRotation = quat.angleAxis(this.randomRotZ, vec3.forward());
      rot = rot.multiply(randomRotation);
    }    
    
    this.startPos = pos;
    this.captionText.text = text;
    this.trans.setWorldPosition(pos);
    this.trans.setWorldRotation(rot);
    this.trans.setWorldScale(vec3.one().uniformScale(0.5));
    //animate in caption
    if (this.scaleCancel) this.scaleCancel.cancel();
    animate({
      easing: "ease-out-elastic",
      duration: 1,
      update: (t: number) => {
        this.scaleTrans.setLocalScale(
          vec3.lerp(vec3.zero(), vec3.one().uniformScale(1.33), t)
        );
      },
      ended: null,
      cancelSet: this.scaleCancel,
    });
  }
}
