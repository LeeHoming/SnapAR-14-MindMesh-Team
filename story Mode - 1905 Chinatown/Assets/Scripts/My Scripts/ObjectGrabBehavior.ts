import { SIK } from "SpectaclesInteractionKit.lspkg/SIK";
import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import { InteractorEvent } from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent";



@component
export class ObjectGrabBehavior extends BaseScriptComponent {

    interactable:Interactable;
    isHolding: boolean = false;


    onAwake() {
        this.interactable = this.sceneObject.getComponent(Interactable.getTypeName())
        this.interactable.onTriggerStart(this.onTriggerStart.bind(this))
        this.interactable.onTriggerEnd(this.onTriggerEnd.bind(this))

        this.api.isHolding = () => this.isHolding;
    }

    onTriggerStart (e:InteractorEvent) {
        this.isHolding = true;
        //print("start grab");
    }

    onTriggerEnd (e:InteractorEvent) {
        this.isHolding = false;
        //print("end grab");
    }

}
