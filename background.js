const LOG_PREFIX = "[Right Links WE: background] ";

var prefs = {
	debug: true
};

preInit();

function preInit() {
	readPrefs(init);
}
function init() {
	browser.runtime.onMessage.addListener(onMessageFromContent);
	loadContentScript();
	browser.tabs.onActivated.addListener(onTabActivated);
}
function destroy() {
	browser.runtime.onMessage.removeListener(onMessageFromContent);
	browser.tabs.onActivated.removeListener(onTabActivated);
}
function readPrefs(callback) {
	browser.storage.local.get().then(function(o) {
		browser.storage.onChanged.addListener(function(changes, area) {
			if(area == "local") for(var key in changes)
				prefs[key] = changes[key].newValue;
		});
		Object.assign(prefs, o);
		callback();
	}, _err);
}

function onMessageFromContent(msg, sender, sendResponse) {
	_log("onMessageFromContent() -> browser.tabs.create(), inBG: " + msg.inBG + ", URI:\n" + msg.uri);
	var opts = {
		url: msg.uri,
		//~ todo: add options
		active: !msg.inBG,
		index: sender.tab.index + 1,
		openerTabId: sender.tab.id
	};
	function onError(e) {
		browser.notifications.create({
			"type": "basic",
			//"iconUrl": browser.extension.getURL("icon.png"),
			"title": browser.i18n.getMessage("extensionName"),
			"message": "" + e
		});
	}
	try {
		browser.tabs.create(opts).catch(onError);
	}
	catch(e) {
		// Type error for parameter createProperties (Property "openerTabId" is unsupported by Firefox) for tabs.create.
		if((e + "").indexOf('"openerTabId" is unsupported') == -1)
			throw e;
		delete opts.openerTabId;
		browser.tabs.create(opts).catch(onError);
	}
}
function onTabActivated(activeInfo) {
	loadContentScript(activeInfo.tabId);
}

var loaded = {};
function loadContentScript(tabId, _stopTime) {
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
		var noPermission = e == "Error: Missing host permission for the tab";
		var noHandler    = e == "Error: No matching message handler";
		browser.tabs.get(tabId).then(function(tab) {
			if(noPermission && tab.url == "about:blank") { // Looks like pending tab
				if(_stopTime && Date.now() > _stopTime)
					_log("executeScript: stop wait");
				else {
					setTimeout(loadContentScript, 20, tabId, _stopTime || Date.now() + 5e3);
					return;
				}
			}
			var err = "browser.tabs.executeScript failed:\n" + tab.url + "\n" + e;
			if(noPermission || noHandler)
				_log(err);
			else
				_err(err);
		});
		if(noHandler)
			setTimeout(loadContentScript, 20, tabId);
	});
}


function ts() {
	var d = new Date();
	var ms = d.getMilliseconds();
	return d.toTimeString().replace(/^.*\d+:(\d+:\d+).*$/, "$1") + ":" + "000".substr(("" + ms).length) + ms + " ";
}
function _log(s) {
	if(prefs.debug)
		console.log(LOG_PREFIX + ts() + s);
}
function _err(s) {
	console.error(LOG_PREFIX + ts() + s);
}