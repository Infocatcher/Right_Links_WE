var prefs = { // Defaults
	debug: true,
	enabled: true,
	enabledLeft: true,
	enabledRight: true,
	loadInBackgroundLeft: false,
	loadInBackgroundRight: true,
	loadInLeft: 0,
	loadInRight: 0,
	enabledOnImages: true,
	enabledOnCanvasImages: true,
	canvasImagesSizeLimit: 0,
	canvasImagesUseBlob: true,
	showContextMenuTimeout: 500,
	longLeftClickTimeout: 500,
	disallowMousemoveDist: 14
};
function init() {
	localize();
	loadOptions();
}
function localize() {
	var its = document.getElementsByTagName("data");
	for(var i = its.length - 1; i >= 0; --i) {
		var it = its[i];
		var s = browser.i18n.getMessage(it.textContent);
		s && it.parentNode.replaceChild(document.createTextNode(s), it);
	}
}
function loadOptions() {
	browser.storage.local.get().then(function(o) {
		browser.storage.onChanged.addListener(function(changes, area) {
			if(area == "local") for(var key in changes)
				loadOption(key, changes[key].newValue);
		});
		Object.assign(prefs, o);
		for(var id in prefs)
			loadOption(id, prefs[id]);
	});
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
document.addEventListener("DOMContentLoaded", init, true);
document.addEventListener("input", saveOption, false);