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
		<td>Browser behavior for “open link in new tab” (<em>browser.tabs.insertRelatedAfterCurrent</em> & Co)</td>
		<td>UX</td>
		<td>No API</td>
		<td>Major</td>
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
		<td>Support for canvas images (ability to open data:… and blob:… URIs)</td>
		<td>Core functionality</td>
		<td>Forbidden</td>
		<td>Minor</td>
		<td></td>
	</tr>
</tbody>
</table>