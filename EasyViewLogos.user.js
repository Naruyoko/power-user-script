// ==UserScript==
// @name      EasyView Logos
// @version   1
// @grant     none
// @include   https://hunger.openfoodfacts.org/logos
// @include   https://hunger.openfoodfacts.org/logos?*
// @include   https://hunger.openfoodfacts.org/logos/deep-search*
// @include   https://hunger.openfoodfacts.org/logos/deep-search?*
//
// @updateURL https://github.com/Naruyoko/power-user-script/raw/refs/heads/Naruyoko-custom/EasyViewLogos.user.js
// ==/UserScript==

var css =
    "div.css-1i1je6h {background-image:linear-gradient(rgba(255, 255, 255, 0.05), rgba(45, 206, 0, 0.6))}"+
    "div.css-8a258q {background-image:linear-gradient(rgba(255, 255, 255, 0.05), rgba(181, 187, 1, 0.38))}"+
    "div.css-1edw1j9 {opacity:0.3}",
    head = document.head || document.getElementsByTagName('head')[0],
    style = document.createElement('style');

head.appendChild(style);

style.type = 'text/css';
if (style.styleSheet){
  // This is required for IE8 and below.
  style.styleSheet.cssText = css;
} else {
  style.appendChild(document.createTextNode(css));
}
