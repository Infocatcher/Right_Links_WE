var flags = {
	stopContextMenu: false
};
var detect = {
	origItem: null,
	item: null,
	itemType: ""
};
var prefs = {
	enabledLeft: true,
	enabledRight: true,
	enabledOnImages: true,
	enabledOnCanvasImages: true,
	canvasImagesSizeLimit: 0,
	canvasImagesUseBlob: true
};

function init() {
	readPrefs(); // Note: will use defaults right after startup
	browser.runtime.onMessage.addListener(onMessageFromBackgroundScript);
	window.addEventListener("mousedown", onMouseDown, true);
	window.addEventListener("mouseup", onMouseUp, true);
	window.addEventListener("click", onClick, true);
	window.addEventListener("contextmenu", onContextMenu, true);
}
function destroy() {
	browser.runtime.onMessage.removeListener(onMessageFromBackgroundScript);
	window.removeEventListener("mousedown", onMouseDown, true);
	window.removeEventListener("mouseup", onMouseUp, true);
	window.removeEventListener("click", onClick, true);
	window.removeEventListener("contextmenu", onContextMenu, true);
}
function readPrefs() {
	browser.storage.local.get({}).then(function(o) {
		prefs = o;
	}, _err);
}

function onMessageFromBackgroundScript(msg) {
}

function onMouseDown(e) {}
function onMouseUp(e) {}
function onClick(e) {}
function onContextMenu(e) {
	if(flags.stopContextMenu)
		stopEvent(e);
}

function enabledFor(e) {
	if("_rightLinksIgnore" in e || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey)
		return false;
	var btn = e.button;
	return btn == 0 && prefs.enabledLeft
		|| btn == 2 && prefs.enabledRight;
}
function stopEvent(e) {
	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation();
}

function getItem(e) {
	var trg = e.originalTarget;
	if(!trg.localName) // trg === document
		return null;

	function detected(item, type) {
		detect.origItem = trg;
		detect.itemType = type;
		return detect.item = item;
	}

	var it = getLink(trg);
	if(it)
		return detected(it, "link");

	var it = prefs.enabledOnImages && getImg(it);
	if(it)
		return detected(it, "img");

	return null;
}
function getLink(it) {
	const docNode = Node.DOCUMENT_NODE; // 9
	const eltNode = Node.ELEMENT_NODE; // 1
	for(it = it; it && it.nodeType != docNode; it = it.parentNode) {
		// https://bugzilla.mozilla.org/show_bug.cgi?id=266932
		// https://bug266932.bugzilla.mozilla.org/attachment.cgi?id=206815
		// It's strange to see another link in Status Bar
		// and other browsers (Opera, Safari, Google Chrome) will open "top level" link.
		// And IE... IE won't open XML (it's important!) testcase. :D
		// Also this seems like bug of left-click handler.
		// So, let's open link, which user see in Status Bar.
		if(
			(
				it instanceof HTMLAnchorElement
				|| it instanceof HTMLAreaElement
				|| it instanceof HTMLLinkElement
			) && it.hasAttribute("href")
			|| it.nodeType == eltNode && it.hasAttributeNS("http://www.w3.org/1999/xlink", "href")
		)
			return it;
	}
	return null;
}
function getImg(it) {
	var itln = it.localName.toLowerCase();
	if(itln == "_moz_generated_content_before") { // Alt-text
		it = it.parentNode;
		itln = it.localName.toLowerCase();
	}
	if(
		(itln == "img" || itln == "image")
			&& it.hasAttribute("src")
			&& it.src != it.ownerDocument.documentURI // Ignore image documents
		|| (
			it instanceof HTMLCanvasElement
			&& prefs.enabledOnCanvasImages
			&& Math.max(it.width, it.height) < (prefs.canvasImagesSizeLimit || Infinity)
		)
	)
		return it;
	return null;
}
function getItemURI(it) {
	return getLinkURI(it)
		|| it.src || it.getAttribute("src")
		|| it instanceof HTMLCanvasElement
			&& (prefs.canvasImagesUseBlob ? "data:," : it.toDataURL());
}
function getLinkURI(it) {
	const ns = "http://www.w3.org/1999/xlink";
	if(it.hasAttributeNS(ns, "href")) {
		var url = it.getAttributeNS(ns, "href");
		if(it.baseURI)
			return new URL(url, it.baseURI).href;
		return url;
	}
	return it.href || it.getAttribute("href");
}