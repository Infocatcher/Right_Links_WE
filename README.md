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
		<td><del>No API</del><br><em>In Firefox 57 supported browser.tabs.create({ openerTabId: … })</td>
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
		<td>Support for canvas images (ability to open data:… and blob:… URIs)</td>
		<td>Core functionality</td>
		<td>Forbidden</td>
		<td>Minor</td>
		<td></td>
	</tr>
	<tr>
		<td>Configurable <a href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json/commands">keyboard shortcuts</a> (note: also not possible to assign Ctrl+Alt+<em>X</em>)</td>
		<td>UX</td>
		<td>No API</td>
		<td>Minor</td>
		<td><a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1303384">Bug 1303384</a></td>
	</tr>
</tbody>
</table>