function init() {
	browser.runtime.onMessage.addListener(onMessageFromBackgroundScript);
	window.addEventListener("mousedown", onMouseDown, true);
	window.addEventListener("mouseup", onMouseUp, true);
	window.addEventListener("click", onClick, true);
	window.addEventListener("contextmenu", onContextMenu, true);
}
function destroy() {
	browser.runtime.onMessage.removeListener(onMessageFromBackgroundScript);
	window.removeEventListener("mousedown", onMouseDown, true);
	window.removeEventListener("mouseup", onMouseUp, true);
	window.removeEventListener("click", onClick, true);
	window.removeEventListener("contextmenu", onContextMenu, true);
}

function onMessageFromBackgroundScript(msg) {
}

function onMouseDown(e) {}
function onMouseUp(e) {}
function onClick(e) {}
function onContextMenu(e) {}