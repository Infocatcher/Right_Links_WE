function init() {
	document.getElementById("updateNotice").innerHTML = browser.i18n.getMessage("updateNotice");
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
}
function onPrefChanged(key, newVal) {
	loadOption(key, newVal);
}
function loadOption(id, val) {
	var node = document.getElementById(id);
	node && setValue(node, val);
}
function saveOption(e) {
	var node = e.target;
	if(!(node.id in prefs))
		return;
	browser.storage.local.set({
		[node.id]: getValue(node)
	});
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
addEventListener("DOMContentLoaded", init, { once: true });