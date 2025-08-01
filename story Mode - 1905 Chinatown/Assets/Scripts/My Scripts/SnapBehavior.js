/**
 * @file SnapBehavior.js
 * @desc Listens to isHeld from ObjectGrabBehavior, calculates distance to targetObject,
 * and renders targetObject if held and within threshold.
 */

// @input SceneObject targetObject
// @input float distanceThreshold = 50.0
// @input Component.ScriptComponent grabBehaviorScript
// @input string SnapTriggerMessage
// @input string TargetShowMessage
// @input string TargetHideMessage


// var grabBehavior = script.grabBehaviorScript ? script.grabBehaviorScript.api : null;
var targetObj = script.targetObject;
var threshold = script.distanceThreshold;
var targetObjRenderer = targetObj ? targetObj.getComponent("Component.RenderMeshVisual") : null;
var canPlaced = false;

var isShowing = false;

var isPlaceholderOn = false;


if (!targetObj) {
    print("SnapBehavior: targetObject is not set.");
    return;
}


function update() {
    var isHeld = script.grabBehaviorScript.isHolding;
    
    var targetTransform = targetObj.getTransform();
    var targetScale = targetTransform.getWorldScale();

    if (targetScale.x < 0.01 || targetScale.y < 0.01 || targetScale.z < 0.01) {
        return;
    }
    
    if(!(isHeld == isShowing)){
        if(isShowing){
            // hide object
            global.behaviorSystem.sendCustomTrigger(script.TargetHideMessage);

        }else{
            // show object
            global.behaviorSystem.sendCustomTrigger(script.TargetShowMessage);
        }

        isShowing = isHeld;
    }

    if (isHeld){
        targetObjRenderer.enabled = true;

        var thisPos = script.getSceneObject().getTransform().getWorldPosition();
        var targetPos = targetObj.getTransform().getWorldPosition();
        var distance = thisPos.distance(targetPos);

        canPlaced = distance < threshold? true : false;
    }else{

        if (canPlaced){
            placeObject();
            script.getSceneObject().destroy();
        } 

        return;
    }
}

function placeObject() {
    global.behaviorSystem.sendCustomTrigger(script.SnapTriggerMessage);
    
    isPlaced = true;
}

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.bind(update);