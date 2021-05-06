readPrefs(init);

function init() {
	initOnce();
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
function initOnce() {
	initOnce = function() {};
	setTimeout(function() {
		if("getBrowserInfo" in browser.runtime)
			browser.runtime.getBrowserInfo().then(createMenus);
		else
			createMenus();
	}, 50);
	updateHotkey();
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
	updateMenus();
}
function onPrefChanged(key, newVal) {
	prefs[key] = newVal;
	if(key == "enabled")
		toggle(newVal);
	else if(
		key == "enabledLeft"
		|| key == "loadInBackgroundLeft"
		|| key == "enabledRight"
		|| key == "loadInBackgroundRight"
	)
		updateMenus();
	else if(key == "toggleKey")
		updateHotkey(250);
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
	browser.browserAction.setTitle({
		title: browser.i18n.getMessage("buttonTooltip")
			+ browser.i18n.getMessage(enabled ? "tooltipEnabled" : "tooltipDisabled")
	});
}

browser.browserAction.onClicked.addListener(function() {
	_log("browserAction.onClicked");
	browser.storage.local.set({
		enabled: !prefs.enabled
	});
});

function createMenus(brInfo) {
	var hasManageExt = brInfo && brInfo.name == "Firefox" && parseFloat(brInfo.version) >= 62;

	// Note: browser.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT == 6
	var item = browser.contextMenus.create.bind(browser.contextMenus);
	item({
		id: "enabledLeft",
		title: browser.i18n.getMessage("longLeftClick"),
		type: "checkbox",
		contexts: ["browser_action"]
	});
	item({
		id: "loadInBackgroundLeft",
		title: browser.i18n.getMessage("loadInBackground"),
		type: "checkbox",
		contexts: ["browser_action"]
	});

	hasManageExt && item({
		id: "enabledSeparator",
		type: "separator",
		contexts: ["browser_action"]
	});

	item({
		id: "enabledRight",
		title: browser.i18n.getMessage("rightClick"),
		type: "checkbox",
		contexts: ["browser_action"]
	});
	item({
		id: "loadInBackgroundRight",
		title: browser.i18n.getMessage("loadInBackground"),
		type: "checkbox",
		contexts: ["browser_action"]
	});

	!hasManageExt && item({
		id: "optionsSeparator",
		type: "separator",
		contexts: ["browser_action"]
	});
	!hasManageExt && item({
		id: "options",
		title: browser.i18n.getMessage("options"),
		icons: {
			"16": "icon16.png",
			"24": "icon24.png"
		},
		contexts: ["browser_action"]
	});

	browser.contextMenus.onClicked.addListener(function(info, tab) {
		var miId = info.menuItemId;
		if(miId == "options") {
			_log("contextMenus.onClicked(): " + miId);
			browser.runtime.openOptionsPage();
		}
		else if(
			miId == "enabledLeft"
			|| miId == "loadInBackgroundLeft"
			|| miId == "enabledRight"
			|| miId == "loadInBackgroundRight"
		) {
			_log("contextMenus.onClicked(): " + miId + " -> " + info.checked);
			browser.storage.local.set({
				[miId]: info.checked
			});
		}
	});

	setTimeout(updateMenus, 50);
}
function updateMenus() {
	var update = browser.contextMenus.update.bind(browser.contextMenus);
	update("enabledLeft", {
		checked: prefs.enabledLeft,
		enabled: prefs.enabled
	});
	update("loadInBackgroundLeft", {
		checked: prefs.loadInBackgroundLeft,
		enabled: prefs.enabled && prefs.enabledLeft
	});
	update("enabledRight", {
		checked: prefs.enabledRight,
		enabled: prefs.enabled
	});
	update("loadInBackgroundRight", {
		checked: prefs.loadInBackgroundRight,
		enabled: prefs.enabled && prefs.enabledRight
	});
}
function updateHotkey(delay = 0) {
	if(!("update" in browser.commands)) // Firefox 60+
		return;
	if(updateHotkey.timer || 0)
		return;
	updateHotkey.timer = setTimeout(function() {
		updateHotkey.timer = 0;
		function feedback(err) {
			browser.runtime.sendMessage({
				action: "shortcutValidation",
				error: err || ""
			});
		}
		if(!prefs.toggleKey) {
			browser.commands.reset("_execute_browser_action");
			feedback();
			return;
		}
		try {
			browser.commands.update({
				name: "_execute_browser_action",
				shortcut: prefs.toggleKey
			}).then(function() {
				feedback();
			});
		}
		catch(e) {
			feedback("" + e);
		}
	}, delay);
}

function onMessageFromContent(msg, sender, sendResponse) {
	if(msg.action == "openURI") {
		if(msg.uri instanceof Blob) // Should be converted here to prevent security errors
			var uri = msg.uri = URL.createObjectURL(msg.uri);
		if(msg.loadIn == 1)
			openURIInWindow(sender.tab, msg);
		else {
			platformInfo(function() {
				openURIInTab(sender.tab, msg);
			});
		}
		if(uri) setTimeout(function() {
			_log("Cleanup: URL.revokeObjectURL()");
			URL.revokeObjectURL(uri);
		}, 100);
	}
}
function platformInfo(callback) {
	platformInfo.os = "win";
	browser.runtime.getPlatformInfo().then(function(pi) {
		_log("platformInfo(): OS: " + pi.os);
		platformInfo = function(callback) {
			callback();
		};
		platformInfo.os = pi.os;
		callback();
	}, callback);
}
function openURIInTab(sourceTab, data) {
	_log("openURIInTab(), inBG: " + data.inBG + ", URI: " + data.uri);
	var opts = {
		url: data.uri,
		active: !data.inBG,
		openerTabId: sourceTab.id
	};
	if(platformInfo.os == "mac") // To not break popup windows in all OS
		opts.windowId = sourceTab.windowId;
	if(data.inBG && data.discarded) {
		opts.discarded = true;
		if(data.title)
			opts.title = data.title;
	}
	try {
		browser.tabs.create(opts).catch(function(e) {
			if((e + "").indexOf("Opener tab must be in the same window") == -1) {
				notifyError(e);
				return;
			}
			_log("openURIInTab(): will try without openerTabId");
			delete opts.openerTabId;
			browser.tabs.create(opts)
				.then(function(tab) {
					browser.windows.update(tab.windowId, {
						focused: true
					});
				})
				.catch(notifyError);
		});
	}
	catch(e) {
		// Type error for parameter createProperties (Property "openerTabId" is unsupported by Firefox) for tabs.create.
		if((e + "").indexOf('"openerTabId" is unsupported') == -1) {
			notifyError(e);
			throw e;
		}
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