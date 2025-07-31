// KeyboardInputTrigger.js
// @input string triggerPrefix = "find_keyword_"

var options = new TextInputSystem.KeyboardOptions();
options.enablePreview = true;
options.keyboardType = TextInputSystem.KeyboardType.Text;
options.returnKeyType = TextInputSystem.ReturnKeyType.Done;

options.onTextChanged = function(text, range) {
    if (!text || text.length === 0) {
        return;
    }

    var key = text.charAt(text.length - 1).toUpperCase(); // get last typed character
    var index = "12345".indexOf(key);

    if (index !== -1) {
        var triggerName = script.triggerPrefix + index;
        print("Triggering: " + triggerName);
        global.sendCustomTrigger(triggerName);
    }
};

options.onReturnKeyPressed = function() {
    global.textInputSystem.dismissKeyboard();
};

script.createEvent("TapEvent").bind(function () {
    global.textInputSystem.requestKeyboard(options);
});
