#### Right Links WE: Changelog

`+` – added<br>
`-` – deleted<br>
`x` – fixed<br>
`*` – improved<br>

##### master/HEAD
##### 0.5b12 (2021-03-14)
`x` Correctly open links without `.textContent`, e.g. with image instead of link text (bug in discarded tab implementation, see <a href="https://github.com/Infocatcher/Right_Links_WE/issues/22">#22</a>).<br>

##### 0.5b11 (2021-03-14)
`x` Fixed default options (changed by mistake in discarded tab implementation, see <a href="https://github.com/Infocatcher/Right_Links_WE/issues/22">#22</a>).<br>
`+` Added separator between long left- and right-click options (only if exists built-in “Manage Extension” menu item).<br>

##### 0.5b10 (2021-03-13)
`+` Added ability to open link in discarded (unloaded) tab in Firefox 63+ (<a href="https://github.com/Infocatcher/Right_Links_WE/issues/22">#22</a>).<br>
`x` Correctly open tabs from non-focused window in MacOS (<a href="https://github.com/Infocatcher/Right_Links_WE/issues/23">#23</a>, <a href="https://github.com/Infocatcher/Right_Links_WE/pull/24">thanks to asleepysamurai</a>).<br>

##### 0.5b9 (2019-05-26)
`+` Added separate blacklists for left-click and right-click to disable click handling on user-defined sites.<br>
`x` Fixed right-click support in Firefox 68+: now used “auxclick” event.<br>
`*` Disable sub-option for canvas, if not checked “Canvas images”.<br>
`x` Fixed ability to open tabs from popup window (without tab bar): tab will be opened in another window.<br>

##### 0.5b8 (2019-01-27)
`x` Fixed “Handle clicks on images” option.<br>
`*` Disable sub-options in case of disabled parent option.<br>

##### 0.5b7 (2019-01-20)
`*` Internal tweaks: used separate global.js script for shared code, simplified localization.<br>
`*` Improved options menu (on toolbar button).<br>
`*` Logically re-grouped options.<br>
`+` Implemented support for canvas images (<a href="https://forum.mozilla-russia.org/viewtopic.php?pid=756712#p756712">thanks to Dumby</a>).<br>
`+` Added (configurable) F2 hotkey to toggle Right Links WE.<br>

##### 0.5b6 (2017-12-15)
`+` Added checkboxes in toolbar button context menu: left/right-click + load in background.<br>
`x` Correctly set default value for “Enabled” preference in content script (failed to load on new installs without unchecking/checking of that checkbox).<br>

##### 0.5b5 (2017-11-26)
`x` Fixed long left-click timeout.<br>
`x` Fixed handling of frames and restored “on demand” tabs (now content script will be automatically loaded into all tabs and frames).<br>

##### 0.5b4 (2017-11-19)
`x` Fixed detection of mouse moving.<br>
`x` Correctly prevent context menu on Linux (<a href="https://github.com/Infocatcher/Right_Links_WE/issues/2">#2</a>).<br>

##### 0.5b3 (2017-11-17)
`-` Removed obsolete extended replacement for browsers without openerTabId support.<br>
`*` Internal tweaks.<br>
`*` More robust way to prevent context menu.<br>

##### 0.5b2 (2017-11-15)
`*` Tweak options page + update localizations.<br>

##### 0.5b1 (2017-11-13)
`*` WebExtensions port.<br>

##### 0.1a1 (2017-10-10)
`*` First WebExtensions draft.<br>