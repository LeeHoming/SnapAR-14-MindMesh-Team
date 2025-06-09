

@component
export class CameraPositionLogger extends BaseScriptComponent {

    @input targetObject: SceneObject;

    onAwake(): void {
        print('CameraPositionLogger Awake');
        //this.createEvent("UpdateEvent").bind(this.update.bind(this));
    }

    update(){
        if (!this.targetObject) {
            print("No target object assigned.");
            return;
        }

        const pos = this.targetObject.getTransform().getWorldPosition();
        print(`Position: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)}`);
    }
}
