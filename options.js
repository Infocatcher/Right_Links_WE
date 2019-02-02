function init() {
	$("updateNotice").innerHTML = browser.i18n.getMessage("updateNotice");
	$("blacklistLeft").placeholder = $("blacklistRight").placeholder = [
		"https://example.com/*",
		"/^https?://example(?:\.\w+){1,2}/something//i"
	].join("\n");
	readPrefs(loadOptions);
	addEventListener("input", saveOption);
	addEventListener("unload", destroy, { once: true });
	browser.runtime.onMessage.addListener(onMessageFromBG);
}
function destroy() {
	removeEventListener("input", saveOption);
	browser.runtime.onMessage.removeListener(onMessageFromBG);
}
function loadOptions() {
	for(var id in prefs)
		loadOption(id, prefs[id]);
	checkSubItems();
	validateKey();
}
function onPrefChanged(key, newVal) {
	loadOption(key, newVal);
}
function loadOption(id, val) {
	var node = $(id);
	node && setValue(node, val);
}
function saveOption(e) {
	var node = e.target;
	var id = node.id;
	if(!(id in prefs))
		return;
	(save.prefs || (save.prefs = {}))[id] = getValue(node);
	if(!save.timer)
		save.timer = setTimeout(save, Date.now() - (save.last || 0) < 1000 ? 400 : 20);
	if(id == "enabledLeft" || id == "enabledRight" || id == "enabledOnImages")
		disableSection(node);
	else if(id == "toggleKey")
		validateKey();
}
function checkSubItems() {
	disableSection($("enabledLeft"));
	disableSection($("enabledRight"));
	disableSection($("enabledOnImages"));
}
function disableSection(ch) {
	var dis = !ch.checked;
	for(var sub of ch.closest("section.group").querySelectorAll("section.sub")) {
		sub.classList.toggle("disabled", dis);
		for(var it of sub.querySelectorAll("input, textarea, select"))
			it.disabled = dis;
	}
}
function onMessageFromBG(msg, sender, sendResponse) {
	if(msg.action != "shortcutValidation")
		return;
	var inp = $("toggleKey");
	inp.title = msg.error;
	inp.classList.toggle("error", msg.error);
}
function validateKey() {
	var inp = $("toggleKey");
	var key = inp.value;
	browser.commands.getAll().then(function(cmds) {
		for(var cmd of cmds) {
			if(cmd.name == "_execute_browser_action") {
				var err = cmd.shortcut != key;
				inp.classList.toggle("error", err);
				inp.title = err ? cmd.shortcut : "";
			}
		}
	});
}
function save() {
	_log("Save: " + JSON.stringify(save.prefs));
	browser.storage.local.set(save.prefs);
	save.prefs = {};
	save.timer = 0;
	save.last = Date.now();
}
function getValue(node) {
	return node.localName == "select" || node.type == "number"
		? +node.value
		: node.type == "checkbox"
			? node.checked
			: node.value;
}
function setValue(node, val) {
	if(node.type == "checkbox")
		node.checked = val;
	else
		node.value = val;
}
function $(id) {
	return document.getElementById(id);
}

init();