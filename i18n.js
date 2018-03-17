// Based on code from https://github.com/piroor/webextensions-lib-l10n
(function i18n() {
	function localize(s) {
		return s.replace(/__MSG_(.+?)__/g, function(s, key) {
			return browser.i18n.getMessage(key) || s;
		});
	}
	function xPath(expr) {
		return document.evaluate(expr, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	}
	var texts = xPath('descendant::text()[contains(self::text(), "__MSG_")]');
	for(var i = 0, l = texts.snapshotLength; i < l; ++i) {
		var text = texts.snapshotItem(i);
		text.nodeValue = localize(text.nodeValue);
	}
	var attrs = xPath('descendant::*/attribute::*[contains(., "__MSG_")]');
	for(var i = 0, l = attrs.snapshotLength; i < l; ++i) {
		var attr = attrs.snapshotItem(i);
		attr.value = localize(attr.value);
	}
})();