// -----JS CODE-----

// @input Component.Text textComponent
// @input int startTime = 60 {"label":"Start Time (Seconds)"}
// @input bool isCountdown = true {"label":"Countdown Mode"}
// @input bool startTimer = false {"label":"Start Timer Manually"}

var timer = script.startTime;
var running = false;

// API for other scripts to trigger timer
script.api.triggerTimer = function() {
    if (!running) {
        timer = script.startTime;
        running = true;
    }
};

// Update text component
function updateText() {
    var minutes = Math.floor(Math.abs(timer) / 60);
    var seconds = Math.abs(timer) % 60;
    var timeStr = (minutes < 10 ? "0" : "") + minutes + ":" +
                  (seconds < 10 ? "0" : "") + seconds;
    if (script.textComponent) {
        script.textComponent.text = timeStr;
    }
}

// Timer tick function
function tick() {
    if (!running) return;

    if (script.isCountdown) {
        timer--;
        if (timer < 0) {
            timer = 0;
            running = false;
        }
    } else {
        timer++;
    }

    updateText();
}

// First update display
updateText();

// Update event
var timerEvent = script.createEvent("UpdateEvent");
timerEvent.bind(function (eventData) {
    if (!running && script.startTimer) {
        // startTimer toggle in Inspector
        running = true;
        script.startTimer = false; // auto-reset to avoid looping
    }

    if (!eventData.getDeltaTime()) return;
    if (script._timePassed === undefined) script._timePassed = 0;
    script._timePassed += eventData.getDeltaTime();

    if (script._timePassed >= 1.0) {
        tick();
        script._timePassed = 0;
    }
});
