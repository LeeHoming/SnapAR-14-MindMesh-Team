// VFXManager.js
// @input Asset.VFXAsset vfxAsset
// @input float duration = 0.1

script.api.trigger = function () {
    if (!script.vfxAsset) return;
    script.vfxAsset.properties["burstDuration"] = getTime() + script.duration;
};

function burstVFX(){
    if (!script.vfxAsset) return;
    script.vfxAsset.properties["burstDuration"] = getTime() + script.duration;
}