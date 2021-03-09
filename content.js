var flags = {
	executed: false,
	canceled: false,
	stopClick: false,
	stopMouseUp: false,
	stopContextMenu: false
};

readPrefs(init);

function init() {
	prefs.enabled && listenClicks(true);
}
function destroy() {
	listenClicks(false);
	moveData && cancel();
}
function onUnload(e) {
	var doc = e.target;
	var win = doc && doc.defaultView;
	if(win != window)
		return;
	_log("onUnload(): " + (doc && doc.location));
	destroy();
}
function toggle(enable) {
	if(enable)
		init();
	else
		destroy();
}
function onPrefChanged(key, newVal) {
	prefs[key] = newVal;
	if(key == "enabled")
		toggle(newVal);
	else if(key == "blacklistLeft")
		blacklist.left = null;
	else if(key == "blacklistRight")
		blacklist.right = null;
}

var auxClickHandler;
function listenClicks(on) {
	auxClickHandler = on;
	listen(on, {
		mousedown:   onMouseDown,
		mouseup:     onMouseUp,
		click:       onClick,
		auxclick:    onAuxClick,
		contextmenu: onContextMenu,
		unload:      onUnload
	});
}
var delayedTimer = 0;
var cleanupTimer = 0;
function onMouseDown(e) {
	if(!enabledFor(e))
		return;

	flags.executed = false;
	flags.canceled = false;
	resetFlags();

	var trg = e.originalTarget || e.target;
	var it = getItem(trg);
	_log("onMouseDown() -> getItem(): " + it);
	if(!it)
		return;
	if(blacklist.check(e)) {
		_log("onMouseDown() -> blacklisted site");
		return;
	}

	if(isRight(e)) // For Linux with "contextmenu" event right after "mousedown"
		flags.stopContextMenu = true;

	var delay = isLeft(e) ? prefs.longLeftClickTimeout : prefs.showContextMenuTimeout;
	if(delay <= 0)
		return;

	moveHandlers(e);

	clearTimeout(delayedTimer);
	clearTimeout(cleanupTimer);
	delayedTimer = setTimeout(function() {
		flags.executed = true;
		if(!it.ownerDocument || !it.ownerDocument.location) // Page already unloaded
			return;
		if(isLeft(e)) {
			_log("onMouseDown() -> delayedTimer -> openURIItem()");
			openURIItem(e, trg, it, prefs.loadInBackgroundLeft, prefs.loadInLeft, prefs.loadInDiscardedLeft);
			flags.stopMouseUp = flags.stopClick = true;
		}
		else {
			_log("onMouseDown() -> delayedTimer -> showContextMenu():");
			showContextMenu(trg, e);
		}
	}, delay);
}
function onMouseUp(e) {
	if("_rightLinksIgnore" in e)
		return;

	if(flags.stopMouseUp) {
		flags.stopMouseUp = false;
		stopEvent(e);
	}

	moveHandlers(false);
	clearTimeout(delayedTimer);
	clearTimeout(cleanupTimer);
	cleanupTimer = setTimeout(function() {
		flags.stopContextMenu = false;
	}, 100);
}
function onClick(e) {
	if(!enabledFor(e))
		return;

	if(flags.stopClick) {
		flags.stopClick = false;
		stopEvent(e);
	}

	if(flags.executed || flags.canceled)
		return;

	if(isLeft(e)) {
		clearTimeout(delayedTimer);
		return;
	}

	var isClick = e.type == "click";
	if(isClick && auxClickHandler) { // Firefox 67 and older
		_log("Remove auxclick listener");
		listen(false, { auxclick: onAuxClick });
		auxClickHandler = false;
	}

	var trg = e.originalTarget || e.target;
	var it = getItem(trg);
	var fn = isClick ? "onClick()" : "onAuxClick()";
	_log(fn + " -> getItem(): " + it);
	if(!it) {
		flags.stopContextMenu = false;
		return;
	}
	if(blacklist.check(e)) {
		_log(fn + " -> blacklisted site");
		return;
	}
	flags.executed = true;
	openURIItem(e, trg, it, prefs.loadInBackgroundRight, prefs.loadInRight, prefs.loadInDiscardedRight);
}
function onAuxClick(e) { // Will called after onClick()
	if(!enabledFor(e))
		return;
	onClick(e);
}
function onContextMenu(e) {
	if(flags.stopContextMenu)
		stopEvent(e);
}
function onMouseMove(e) {
	var md = moveData;
	if(!md.enabled)
		return;
	var x = e.screenX;
	var y = e.screenY;
	md.dist += Math.sqrt(
		Math.pow(md.x - x, 2) +
		Math.pow(md.y - y, 2)
	);
	if(md.dist >= prefs.disallowMousemoveDist) {
		cancel(e);
		return;
	}
	md.x = x;
	md.y = y;
}

function isLeft(e) {
	return e.button == 0;
}
function isRight(e) {
	return e.button == 2;
}
function enabledFor(e) {
	if("_rightLinksIgnore" in e || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey)
		return false;
	return prefs.enabledLeft && isLeft(e)
		|| prefs.enabledRight && isRight(e);
}

var blacklist = {
	left: null,
	right: null,
	patterns: function(e) {
		var [key, pref] = isLeft(e) ? ["left", "blacklistLeft"] : ["right", "blacklistRight"];
		return this[key] || (this[key] = this.parsePatterns(prefs[pref]));
	},
	check: function(e) {
		var curURI = e.view.location.href;
		_log("blacklist.check(): " + curURI);
		for(var pattern of this.patterns(e))
			if(pattern.test(curURI))
				return true;
		return false;
	},
	parsePatterns: function(data) {
		var patterns = [];
		for(var str of data.split(/[\r\n]+/)) {
			str = str.trim();
			if(/^\/(.+)\/(i?)$/.test(str)) {
				var pattern = RegExp.$1;
				var flags = RegExp.$2;
			}
			else {
				var pattern = "^" + str
					.replace(/[\\\/.^$+?|()\[\]{}]/g, "\\$&") // Escape special symbols
					.replace(/\*/g, ".*")
					+ "$";
				var flags = "i";
			}
			try {
				patterns.push(new RegExp(pattern, flags));
			}
			catch(e) {
				_err(
					"blacklist.parsePatterns(): Invalid regular expression:\n"
					+ str + "\n-> " + pattern + "\n" + e
				);
			}
		}
		prefs.debug && _log(
			"parsePatterns():" + (data
				? "\n" + data + "\nPatterns:\n" + patterns.join("\n")
				: " (no patterns)"
			)
		);
		return patterns;
	}
};

var trim = String.prototype.trim.call.bind(String.prototype.trim);
function openURIItem(e, trg, it, inBG, loadIn, discarded) {
	var uri = getItemURI(it);
	if(
		uri == "data:,"
		&& it instanceof HTMLCanvasElement
		&& "toBlob" in it
		&& "URL" in window
		&& "createObjectURL" in URL
	) {
		it.toBlob(function(blob) {
			openURIIn(blob, inBG, loadIn, discarded);
		});
		return;
	}
	if(isVoidURI(uri) || isDummyURI(it, uri)) {
		_log("openURIItem() -> void or dummy URI");
		mouseEvents(trg, ["mousedown", "mouseup", "click"], e, {
			ctrlKey: true
		});
		return;
	}
	if(isJSURI(uri)) {
		_log("openURIItem() -> javascript:... URI");
		loadJSURI(trg, uri);
		return;
	}
	if(loadIn == 2) {
		_log("openURIItem() -> load in current tab");
		loadURI(trg, uri);
		return;
	}
	var title = trim(it.textContent) || trim(it.title) || trim(it.alt) || "";
	if(!title && it.children.length == 1) {
		var img = it.children[0];
		if(img.localName.toLowerCase() == "img")
			title = trim(img.title) || trim(img.alt) || "";
	}
	openURIIn(uri, inBG, loadIn, discarded, title);
}
function openURIIn(uri, inBG, loadIn, discarded, title) {
	browser.runtime.sendMessage({
		action: "openURI",
		uri: uri,
		inBG: inBG,
		discarded: discarded,
		title: title,
		loadIn: loadIn
	}).then(function onResponse() {}, _err);
}
function loadJSURI(trg, uri) {
	var win = trg.ownerDocument.defaultView;
	new win.Function("location = " + JSON.stringify(uri))();
}
function loadURI(trg, uri) {
	blinkNode(trg, true);
	trg.ownerDocument.location = uri;
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

function listenMove(on) {
	listen(on, {
		mousemove: onMouseMove,
		wheel:     cancel,
		dragstart: cancel
	});
}
var moveData = null;
function moveHandlers(e) {
	if(!e == !moveData)
		return;
	if(!e) {
		moveData = null;
		listenMove(false);
		return;
	}
	var dist = prefs.disallowMousemoveDist;
	moveData = {
		enabled: dist >= 0,
		dist: 0,
		x: e.screenX,
		y: e.screenY
	};
	listenMove(true);
}
function resetFlags() {
	flags.stopMouseUp = false;
	flags.stopClick = false;
	flags.stopContextMenu = false;
}
function cancel(e) {
	_log("cancel()" + (e ? " " + e.type : ""));
	flags.canceled = true;
	resetFlags();
	clearTimeout(delayedTimer);
	moveHandlers(false);
}
function listen(add, o) {
	var fn = add ? addEventListener : removeEventListener;
	for(var type in o)
		fn(type, o[type], true);
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

function getItem(trg) {
	if(!trg.localName) // trg === document
		return null;
	return getLink(trg)
		|| prefs.enabledOnImages && getImg(trg);
}
function getLink(it) {
	const docNode = Node.DOCUMENT_NODE; // 9
	const eltNode = Node.ELEMENT_NODE; // 1
	for(; it && it.nodeType != docNode; it = it.parentNode) {
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
			//&& (prefs.canvasImagesUseBlob ? "data:," : it.toDataURL());
			&& "data:,";
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
function isJSURI(uri) {
	return /^javascript:/i.test(uri);
}
function isVoidURI(uri) {
	return isJSURI(uri) && /^javascript: *(?:|\/\/|void *(?: +0|\( *0 *\))) *;? *$/i.test(
		uri.replace(/(?:\s|%20)+/g, " ")
	);
}
function isDummyURI(it, uri) {
	var doc = it.ownerDocument;
	var loc = doc.documentURI.replace(/#.*$/, "");
	if(!uri.startsWith(loc))
		return false;
	var hash = uri.substr(loc.length);
	if(!hash && it.hasAttribute && it.hasAttribute("href") && !it.getAttribute("href")) // <a href="">
		return true;
	if(hash.charAt(0) != "#")
		return false;
	var anchor = hash.substr(1);
	if(!anchor) // <a href="#">
		return true;
	if(anchor.charAt(0) == "!") // site.com/#!... links on JavaScript-based sites like http://twitter.com/
		return false;
	return !doc.getElementById(anchor) && !doc.getElementsByName(anchor).length;
}
function blinkNode(node, hl) {
	var stl = node.hasAttribute("style") && node.getAttribute("style");
	function s(p, v) {
		node.style.setProperty(p, v, "important");
	}
	if(hl) {
		s("outline", "1px solid");
		s("transition", "outline 100ms ease-in-out");
	}
	else {
		s("opacity", "0.1");
		s("transition", "opacity 120ms ease-in-out");
	}
	setTimeout(function() {
		if(stl === false)
			node.removeAttribute("style");
		else
			node.setAttribute("style", stl);
	}, 270);
}