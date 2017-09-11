var prefs = { // Defaults
	debug: true,
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
		Object.assign(prefs, o);
		for(var id in prefs) {
			var node = document.getElementById(id);
			if(!node)
				continue;
			if(node.type == "checkbox")
				node.checked = prefs[id];
			else
				node.value = prefs[id];
		}
	});
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