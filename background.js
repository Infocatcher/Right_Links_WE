const LOG_PREFIX = "[Right Links WE: background] ";

var prefs = {
	debug: true,
	enabled: true
};

preInit();

function preInit() {
	readPrefs(init);
}
function init() {
	if(!prefs.enabled)
		return updateState();
	browser.runtime.onMessage.addListener(onMessageFromContent);
	loadContentScript();
	browser.tabs.onActivated.addListener(onTabActivated);
	return updateState();
}
function destroy() {
	browser.runtime.onMessage.removeListener(onMessageFromContent);
	browser.tabs.onActivated.removeListener(onTabActivated);
	updateState();
}
function readPrefs(callback) {
	browser.storage.local.get().then(function(o) {
		browser.storage.onChanged.addListener(function(changes, area) {
			if(area == "local") for(var key in changes)
				onPrefChanged(key, changes[key].newValue);
		});
		Object.assign(prefs, o);
		callback();
	}, _err);
}
function onPrefChanged(key, newVal) {
	prefs[key] = newVal;
	if(key == "enabled") {
		if(newVal)
			init();
		else
			destroy();
	}
}
function updateState() {
	setTimeout(setState, 0, prefs.enabled);
}
function setState(enabled) {
	_log("setState(" + enabled + ")");
	var key = enabled ? "" : "-off";
	browser.browserAction.setIcon({
		path: {
			16: "icon16" + key + ".png",
			24: "icon24" + key + ".png"
		}
	});
}

browser.browserAction.onClicked.addListener(function() {
	_log("browserAction.onClicked");
	browser.storage.local.set({
		enabled: !prefs.enabled
	});
});
browser.contextMenus.create({
	id: "options",
	title: browser.i18n.getMessage("rlOptions"),
	contexts: ["browser_action"]
});
browser.contextMenus.onClicked.addListener(function(info, tab) {
	var miId = info.menuItemId;
	_log("contextMenus.onClicked: " + miId);
	if(miId == "options")
		browser.runtime.openOptionsPage();
});

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
			"iconUrl": browser.extension.getURL("icon24-off.png"),
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
		_log("browser.tabs.executeScript(): successfully loaded into tab #" + tabId);
	}, function onError(e) {
		if(_stopTime && Date.now() > _stopTime) {
			_log("browser.tabs.executeScript(): stop wait for tab #" + tabId);
			return;
		}
		var noPermission = e == "Error: Missing host permission for the tab";
		var noHandler    = e == "Error: No matching message handler";
		browser.tabs.get(tabId).then(function(tab) {
			if(noPermission && tab.url == "about:blank") { // Looks like pending tab
				setTimeout(loadContentScript, 20, tabId, _stopTime || Date.now() + 5e3);
				return;
			}
			if(_stopTime)
				return; // Log only once
			var err = "browser.tabs.executeScript() failed for tab #" + tabId + ":\n" + tab.url + "\n" + e;
			if(noPermission || noHandler)
				_log(err);
			else
				_err(err);
		});
		if(noHandler)
			setTimeout(loadContentScript, 20, tabId, _stopTime || Date.now() + 2e3);
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