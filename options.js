function init() {
	$("updateNotice").innerHTML = browser.i18n.getMessage("updateNotice");
	readPrefs(loadOptions);
	addEventListener("input", saveOption);
	addEventListener("unload", destroy, { once: true });
}
function destroy() {
	removeEventListener("input", saveOption);
}
function loadOptions() {
	for(var id in prefs)
		loadOption(id, prefs[id]);
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
	if(id == "toggleKey")
		validateKey();
}
function validateKey() {
	var inp = $("toggleKey");
	var key = inp.value;
	// Patterns from error message
	// Type error for parameter detail (Error processing shortcut: Value "..." must either: match the pattern ...
	var isValid = !key // We use dummy manifest.json entry + browser.commands.reset()
		|| /^\s*(Alt|Ctrl|Command|MacCtrl)\s*\+\s*(Shift\s*\+\s*)?([A-Z0-9]|Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|Up|Down|Left|Right)\s*$/.test(key)
		|| /^\s*((Alt|Ctrl|Command|MacCtrl)\s*\+\s*)?(Shift\s*\+\s*)?(F[1-9]|F1[0-2])\s*$/.test(key)
		|| /^(MediaNextTrack|MediaPlayPause|MediaPrevTrack|MediaStop)$/.test(key);
	inp.classList.toggle("error", !isValid);
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