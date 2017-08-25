function init() {
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

function onMessageFromBackgroundScript(msg) {
}

function onMouseDown(e) {}
function onMouseUp(e) {}
function onClick(e) {}
function onContextMenu(e) {}

function getLink(it) {
	if(!it || !it.localName)
		return null;

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
function getHref(a) {
	return getLinkURI(a);
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