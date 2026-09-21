// ==UserScript==
// @name      Open Food Facts Zoom Autocheck
// @version   2026-09-21
// @author    Naruyoko
// @include   https://*.openfoodfacts.org/cgi/product.pl*
// @icon      data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant     none
// @updateURL https://github.com/Naruyoko/power-user-script/raw/refs/heads/Naruyoko-custom/ZoomAutocheck.user.js
// ==/UserScript==

window.addEventListener("load",()=>[...document.getElementsByTagName("image-editor")].forEach(e=>e.zoomOnWheelCheckbox.checked=true));