const LOG_PREFIX = "[Right Links WE] ";

init();


function init() {
	browser.runtime.onMessage.addListener(onMessageFromContent);
	browser.tabs.onCreated.addListener(onTabCreated);
	browser.tabs.query({}).then(loadContentScripts, _err);
}
function destroy() {
	browser.runtime.onMessage.removeListener(onMessageFromContent);
	browser.tabs.onCreated.removeListener(onTabCreated);
	browser.tabs.query({}).then(unloadContentScripts, _err);
}

function onMessageFromContent(msg) {
	//~ todo
}
function onTabCreated(tab) {
	loadContentScript(tab);
}

function loadContentScripts(tabs) {
	for(var tab of tabs)
		loadContentScript(tab);
}
function unloadContentScripts(tabs) {
	for(var tab of tabs)
		unloadContentScript(tab);
}
function loadContentScript(tab) {
	browser.tabs.executeScript(tab.id, {
		file: "/content.js",
		runAt: "document_start"
	});
}
function unloadContentScript(tab) {
	//~ todo
}


function ts() {
	var d = new Date();
	var ms = d.getMilliseconds();
	return d.toTimeString().replace(/^.*\d+:(\d+:\d+).*$/, "$1") + ":" + "000".substr(("" + ms).length) + ms + " ";
}
function _log(s) {
	//if(_dbg)
	console.log(LOG_PREFIX + ts() + s);
}
function _err(s) {
	console.error(LOG_PREFIX + ts() + s);
}