const LOG_PREFIX = "[Right Links WE: content] ";

var flags = {
	runned: false,
	canceled: false,
	stopClick: false,
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

init();

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
		Object.assign(prefs, o);
	}, _err);
}

function onMessageFromBackgroundScript(msg) {
}

var delayedTimer = 0;
function onMouseDown(e) {
	if(!enabledFor(e))
		return;

	flags.runned = false;
	flags.canceled = false;
	flags.stopClick = false;
	flags.stopContextMenu = false;

	var isLeft = e.button == 0;
	var delay = isLeft ? prefs.longLeftClickTimeout : prefs.showContextMenuTimeout;
	if(delay <= 0)
		return;

	var it = getItem(e);
	_log("onClick " + it);
	if(!it)
		return;

	moveHandlers(e);

	clearTimeout(delayedTimer);
	delayedTimer = setTimeout(function() {
		flags.runned = true;
		if(!it.ownerDocument || !it.ownerDocument.location) // Page already unloaded
			return;
		if(isLeft) {
			var uri = getItemURI(it);
			openURIInTab(uri, prefs.loadInBackgroundLeft);
			flags.stopClick = true;
		}
		else {
			showContextMenu(e.originalTarget || e.target, e);
		}

	}, prefs.showContextMenuTimeout);
}
function onMouseUp(e) {
	moveHandlers(false);
	setTimeout(function() {
		clearTimeout(delayedTimer);
		flags.stopContextMenu = false;
	}, 10);
}
function onClick(e) {
	if(!enabledFor(e))
		return;

	if(flags.stopClick) {
		flags.stopClick = false;
		stopEvent(e);
	}

	if(flags.runned || flags.canceled)
		return;

	var it = getItem(e);
	_log("onClick " + it);
	if(!it)
		return;
	var uri = getItemURI(it);
	//~ todo: prefs.canvasImagesUseBlob
	if(e.button == 2)
		flags.stopContextMenu = true;
	openURIInTab(uri, prefs.loadInBackgroundRight);
}
function onContextMenu(e) {
	if(flags.stopContextMenu)
		stopEvent(e);
}
function onMouseMove(e) {
	var mmd = moveHandlers.data;
	if(!mmd.enabled)
		return;
	var x = e.screenX;
	var y = e.screenY;
	mmd.dist += Math.sqrt(
		Math.pow(mmd.screenX - x, 2) +
		Math.pow(mmd.screenY - y, 2)
	);
	if(mmd.dist >= prefs.disallowMousemoveDist) {
		cancel();
		return;
	}
	mmd.screenX = x;
	mmd.screenY = y;
}

function enabledFor(e) {
	if("_rightLinksIgnore" in e || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey)
		return false;
	var btn = e.button;
	return btn == 0 && prefs.enabledLeft
		|| btn == 2 && prefs.enabledRight;
}
function openURIInTab(uri, inBG) {
	browser.runtime.sendMessage({
		uri: uri,
		inBG: inBG
	}).then(function onResponse() {}, _err);
}
function showContextMenu(trg, origEvt) {
	_log("showContextMenu()");
	var events = ["mouseup", "contextmenu"];
	//if(simulateMousedown)
	//	events.unshift("mousedown");
	flags.stopContextMenu = false;
	mouseEvents(trg, events, origEvt, {}); // Actually doesn't work...
	blinkNode(trg);
}
function moveHandlers(e) {
	if(!e == !moveHandlers.data)
		return;
	if(e) {
		var dist = prefs.disallowMousemoveDist;
		moveHandlers.data = {
			enabled: dist >= 0,
			dist: 0,
			screenX: e.screenX,
			screenY: e.screenY
		};
		window.addEventListener("mousemove", onMouseMove, true);
		window.addEventListener("wheel", cancel, true);
		window.addEventListener("dragstart", cancel, true);
	}
	else {
		moveHandlers.data = null;
		window.removeEventListener("mousemove", onMouseMove, true);
		window.removeEventListener("wheel", cancel, true);
		window.removeEventListener("dragstart", cancel, true);
	}
}
function cancel() {
	flags.canceled = true;
	flags.stopContextMenu = false;
	flags.stopClick = false;
	clearTimeout(delayedTimer);
	moveHandlers(false);
}
function mouseEvents(trg, evtTypes, origEvt, opts) {
	for(var evtType of evtTypes)
		mouseEvent(trg, evtType, origEvt, opts);
}
function mouseEvent(trg, evtType, origEvt, opts) {
	//~ note: doesn't work as expected
	var evt = new MouseEvent(evtType, {
		bubbles: true,
		cancelable: true,
		view: origEvt.view,
		detail: 1,
		screenX: origEvt.screenX,
		screenY: origEvt.screenY,
		clientX: origEvt.clientX,
		clientY: origEvt.clientY,
		ctrlKey:  opts.ctrlKey  || false,
		altKey:   opts.altKey   || false,
		shiftKey: opts.shiftKey || false,
		metaKey:  opts.metaKey  || false,
		button:   opts.button   || 0,
		relatedTarget: null
	});
	evt._rightLinksIgnore = true;
	return trg.dispatchEvent(evt);
}
function stopEvent(e) {
	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation();
}

function getItem(e) {
	var trg = e.originalTarget || e.target;
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

	var it = prefs.enabledOnImages && getImg(trg);
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
function blinkNode(node) {
	var stl = node.hasAttribute("style") && node.getAttribute("style");
	node.style.setProperty("opacity", "0.1", "important");
	node.style.setProperty("transition", "opacity 120ms ease-in-out", "important");
	setTimeout(function() {
		if(stl === false)
			node.removeAttribute("style");
		else
			node.setAttribute("style", stl);
	}, 270);
}

function ts() {
	var d = new Date();
	var ms = d.getMilliseconds();
	return d.toTimeString().replace(/^.*\d+:(\d+:\d+).*$/, "$1") + ":" + "000".substr(("" + ms).length) + ms + " ";
}
function _log(s) {
	//if(_dbg)
	console.log(LOG_PREFIX + ts() + s);
}
function _err(s) {
	console.error(LOG_PREFIX + ts() + s);
}