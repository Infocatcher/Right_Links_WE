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
	updateState();
}
function toggle(enable) {
	if(enable)
		init();
	else
		destroy();
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
	if(key == "enabled")
		toggle(newVal);
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