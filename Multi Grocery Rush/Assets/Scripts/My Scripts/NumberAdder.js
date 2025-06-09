// -----JS CODE-----

// @input Component.Text textComponent
// @input int count = 0 {"label":"Initial Count"}

var keywordTriggers = [
    "find_keyword_0",
    "find_keyword_1",
    "find_keyword_2",
    "find_keyword_3",
    "find_keyword_4"
];

// update text display
function updateText() {
    if (script.textComponent) {
        script.textComponent.text = script.count.toString();
    }
}

// initial text
updateText();

// expose api
script.api.increment = function () {
    script.count += 1;
    updateText();
};