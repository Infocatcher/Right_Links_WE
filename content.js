function init() {
	browser.runtime.onMessage.addListener(onMessageFromBackgroundScript);
}
function destroy() {
	browser.runtime.onMessage.removeListener(onMessageFromBackgroundScript);
}

function onMessageFromBackgroundScript(msg) {
}