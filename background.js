const LOG_PREFIX = "[Right Links WE: background] ";

init();

function init() {
	browser.runtime.onMessage.addListener(onMessageFromContent);
	loadContentScript();
	browser.tabs.onActivated.addListener(onTabActivated);
	//browser.tabs.query({}).then(loadContentScripts, _err);
}
function destroy() {
	browser.runtime.onMessage.removeListener(onMessageFromContent);
	browser.tabs.onActivated.removeListener(onTabActivated);
	browser.tabs.query({}).then(unloadContentScripts, _err);
}

function onMessageFromContent(msg, sender, sendResponse) {
	//~ todo
	browser.tabs.create({
		url: msg.uri,
		//~ todo: add options
		active: true,
		index: sender.tab.index + 1
	});
}
function onTabActivated(activeInfo) {
	loadContentScript(activeInfo.tabId);
}

var loaded = {};
function loadContentScripts(tabs) {
	for(var tab of tabs)
		loadContentScript(tab.id);
}
function unloadContentScripts(tabs) {
	for(var tab of tabs)
		unloadContentScript(tab.id);
}
function loadContentScript(tabId) {
	if(!tabId) {
		browser.tabs.query({ currentWindow: true, active: true }).then(function(tabsInfo) {
			loadContentScript(tabsInfo[0].id);
		}, _err);
		return;
	}
	if(tabId in loaded)
		return;
	browser.tabs.executeScript(tabId, {
		file: "/content.js",
		runAt: "document_start"
	}).then(function onLoaded() {
		loaded[tabId] = true;
		_log("executeScript done: " + tabId);
	}, function onError(e) {
		browser.tabs.get(tabId).then(function(tab) {
			var err = "browser.tabs.executeScript failed:\n" + tab.url + "\n" + e;
			if(
				e == "Error: Missing host permission for the tab" // Some privileged page?
				|| e == "Error: No matching message handler" // Will wait...
			)
				_log(err);
			else
				_err(err);
		});
		if(e == "Error: No matching message handler")
			setTimeout(loadContentScript, 20, tabId);
	});
}
function unloadContentScript(tabId) {
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