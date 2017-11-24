const LOG_PREFIX = "[Right Links WE: background] ";

var prefs = {
	debug: false,
	enabled: true,
	updateNotice: true
};

readPrefs(init);

function init() {
	if(!prefs.enabled)
		return updateState();
	browser.runtime.onMessage.addListener(onMessageFromContent);
	loadInCurrentTab();
	browser.tabs.onActivated.addListener(onTabActivated);
	browser.tabs.onUpdated.addListener(onTabUpdated);
	if(prefs.updateNotice) setTimeout(function() {
		browser.storage.local.set({
			updateNotice: false
		});
		browser.runtime.openOptionsPage();
	}, 500);
	return updateState();
}
function destroy() {
	browser.runtime.onMessage.removeListener(onMessageFromContent);
	browser.tabs.onActivated.removeListener(onTabActivated);
	browser.tabs.onUpdated.removeListener(onTabUpdated);
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
	if(msg.action == "openURI") {
		if(msg.loadIn == 1)
			openURIInWindow(sender.tab, msg);
		else
			openURIInTab(sender.tab, msg);
	}
	else if(msg.action == "contentScriptUnloaded") {
		if(!sender.tab) // Tab was closed
			return;
		_log("onMessageFromContent(): reset loaded flag for tab #" + sender.tab.id);
		delete loaded[sender.tab.id];
	}
}
function openURIInTab(sourceTab, data) {
	_log("openURIInTab(), inBG: " + data.inBG + ", URI: " + data.uri);
	var opts = {
		url: data.uri,
		active: !data.inBG,
		openerTabId: sourceTab.id
	};
	try {
		browser.tabs.create(opts).catch(notifyError);
	}
	catch(e) {
		// Type error for parameter createProperties (Property "openerTabId" is unsupported by Firefox) for tabs.create.
		if((e + "").indexOf('"openerTabId" is unsupported') == -1)
			throw e;
		_log("openURIInTab(): openerTabId property not supported, will use workaround");
		delete opts.openerTabId;
		opts.index = sourceTab.index + 1;
		browser.tabs.create(opts).catch(notifyError);
	}
}
function openURIInWindow(sourceTab, data) {
	_log("openURIInWindow(), inBG: " + data.inBG + ", URI: " + data.uri);
	var opts = {
		url: data.uri,
		focused: !data.inBG
	};
	try {
		browser.windows.create(opts).catch(notifyError);
	}
	catch(e) {
		// Type error for parameter createData (Property "focused" is unsupported by Firefox) for windows.create.
		if((e + "").indexOf('"focused" is unsupported') == -1)
			throw e;
		_log("openURIInWindow(): focused property not supported");
		delete opts.focused;
		browser.windows.create(opts).catch(notifyError);
	}
}
function notifyError(err) {
	browser.notifications.create({
		type: "basic",
		iconUrl: browser.extension.getURL("icon24-off.png"),
		title: browser.i18n.getMessage("extensionName"),
		message: "" + err
	});
}
var loading = {};
function onTabActivated(activeInfo) {
	var tabId = activeInfo.tabId;
	loading[tabId] = setTimeout(function() {
		delete loading[tabId];
		loadContentScript(tabId);
	}, 40);
}
function onTabUpdated(tabId, changeInfo, tab) {
	if(changeInfo.url && tab.active) {
		if(tabId in loading) {
			_log("URL was updated again (restored unloaded tab?), cancel scheduled loading");
			clearTimeout(loading[tabId]);
			delete loading[tabId];
		}
		var msg = "Changed URL in active tab #" + tabId + ": " + changeInfo.url;
		if(changeInfo.url == "about:blank") {
			delete loaded[tabId];
			_log(msg + ", will wait for next onUpdated event");
			return;
		}
		if(/^(?:about|chrome|resource|data):/i.test(changeInfo.url)) {
			_log("Loaded restricted URL -> reset loaded flag for tab #" + tabId);
			delete loaded[tabId];
		}
		_log(msg + ", will try to load content script");
		loading[tabId] = setTimeout(function() {
			delete loading[tabId];
			loadContentScript(tabId);
		}, 40);
	}
}

var loaded = {};
function loadContentScript(tabId, _stopTime) {
	if(tabId in loaded)
		return;
	browser.tabs.executeScript(tabId, {
		file: "/content.js",
		allFrames: true,
		matchAboutBlank: true,
		runAt: "document_start"
	}).then(function onLoaded() {
		loaded[tabId] = true;
		// Note: we may receive "Error: WebExtension context not found!" right after this
		_log("browser.tabs.executeScript(): successfully loaded into tab #" + tabId);
	}, function onError(e) {
		if(_stopTime && Date.now() > _stopTime) {
			_log("browser.tabs.executeScript(): stop wait for tab #" + tabId);
			return;
		}
		browser.tabs.get(tabId).then(function(tab) {
			var noPermission = e == "Error: Missing host permission for the tab";
			var noHandler    = e == "Error: No matching message handler";
			if(!tab.url || tab.url == "about:blank") {
				_log("browser.tabs.executeScript(): tab is blank, will wait for onUpdated event");
				return;
			}
			if(noHandler)
				setTimeout(loadContentScript, 20, tabId, _stopTime || Date.now() + 2e3);

			if(_stopTime)
				return; // Log only once
			var err = "browser.tabs.executeScript() failed for tab #" + tabId + ":\n" + tab.url + "\n" + e;
			if(noPermission || noHandler)
				_log(err);
			else
				_err(err);
		});
	});
}
function loadInCurrentTab() {
	browser.tabs.query({ currentWindow: true, active: true }).then(function(tabsInfo) {
		loadContentScript(tabsInfo[0].id);
	}, _err);
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