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
function saveOptions() {
	var nodes = document.querySelectorAll("[id]");
	for(var node of nodes)
		prefs[node.id] = node.type == "checkbox"
			? node.checked
			: node.type == "number"
				? +node.value
				: node.value;
	browser.storage.local.set(prefs);
}
document.addEventListener("DOMContentLoaded", loadOptions, true);
document.addEventListener("change", saveOptions, false);
document.addEventListener("input", saveOptions, false);