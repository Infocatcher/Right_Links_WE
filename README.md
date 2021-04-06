WebExtensions port of <a href="https://github.com/Infocatcher/Right_Links">Right Links</a> extension for Firefox/SeaMonkey (see <a href="https://github.com/Infocatcher/Right_Links/issues/31">Right_Links#31</a>).

## Issues
<table>
<thead>
	<tr>
		<th>Description</th>
		<th>Part</th>
		<th>Status</th>
		<th>Severity</th>
		<th>Firefox bug</th>
	</tr>
</thead>
<tbody>
	<tr>
		<td><del>Browser behavior for “open link in new tab” (<em>browser.tabs.insertRelatedAfterCurrent</em> & Co)</del></td>
		<td><del>UX</del></td>
		<td><del>No API</del><br><em><a href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/create">browser.tabs.create({ openerTabId: … })</a> in Firefox 57+</td>
		<td><del>Major</del></td>
		<td></td>
	</tr>
	<tr>
		<td>Ability to handle clicks on bookmarks and history items</td>
		<td>Core functionality</td>
		<td>No API</td>
		<td>Major</td>
		<td></td>
	</tr>
	<tr>
		<td>Ability to handle clicks on internal restricted pages (about:…, chrome://…, especially on about:newtab)</td>
		<td>Core functionality</td>
		<td>No API</td>
		<td>Major</td>
		<td></td>
	</tr>
	<tr>
		<td>Ability to handle clicks on restricted webpages (like <a href="https://addons.mozilla.org/">addons.mozilla.org</a>)</td>
		<td>Core functionality</td>
		<td>
			May be configured (at your own risk) in about:config:
			<br><strong>privacy.resistFingerprinting.block_mozAddonManager</strong> = true
			<br><strong>extensions.webextensions.restrictedDomains</strong> = "" (empty string, or remove some domains as you like)
		</td>
		<td>Major</td>
		<td></td>
	</tr>
	<tr>
		<td>Ability to simulate click on JavaScript-links (e.g. with `window.open()` inside)</td>
		<td>Core functionality</td>
		<td>No API, new tabs/windows will be blocked</td>
		<td>Major</td>
		<td></td>
	</tr>
	<tr>
		<td>Ability to programmatically open context menu</td>
		<td>UX</td>
		<td>No API</td>
		<td>Major</td>
		<td></td>
	</tr>
	<tr>
		<td>Ability to send <a href="https://en.wikipedia.org/wiki/HTTP_referer">HTTP referer</a></td>
		<td>Core functionality</td>
		<td>No API</td>
		<td>Major</td>
		<td></td>
	</tr>
	<tr>
		<td><del>Support for canvas images (ability to open data:… and blob:… URIs)</del></td>
		<td><del>Core functionality</del></td>
		<td><del>Forbidden</del><br><em>Works from background script: <a href="https://github.com/Infocatcher/Right_Links_WE/commit/0a0d5bb1fa52dfea9c8cb78827eeed2348647e81">URL.createObjectURL(Blob)</a></em></td>
		<td><del>Minor</del></td>
		<td></td>
	</tr>
	<tr>
		<td><del>Configurable <a href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json/commands">keyboard shortcuts</a> (note: also not possible to assign Ctrl+Alt+<em>X</em>)</del></td>
		<td><del>UX</del></td>
		<td><del>No API</del><br><em><a href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/commands/update">browser.commands.update()</a> in Firefox 60+</em></td>
		<td><del>Minor</del></td>
		<td><del><a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1421811">Bug 1421811</a></del>, <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1303384">bug 1303384</a></td>
	</tr>
</tbody>
</table>