var prefs = { // Defaults
	debug: true,
	enabled: true,
	enabledLeft: true,
	enabledRight: true,
	loadInBackgroundLeft: false,
	loadInBackgroundRight: true,
	enabledOnImages: true,
	enabledOnCanvasImages: true,
	canvasImagesSizeLimit: 0,
	canvasImagesUseBlob: true,
	showContextMenuTimeout: 500,
	longLeftClickTimeout: 500,
	disallowMousemoveDist: 14
};
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
	if(!node)
		return;
	if(node.type == "checkbox")
		node.checked = val;
	else
		node.value = val;
}
function saveOption(e) {
	var node = e.target;
	if(!(node.id in prefs))
		return;
	var o = {};
	o[node.id] = node.type == "checkbox"
		? node.checked
		: node.type == "number"
			? +node.value
			: node.value;
	browser.storage.local.set(o);
}
document.addEventListener("DOMContentLoaded", loadOptions, true);
document.addEventListener("input", saveOption, false);