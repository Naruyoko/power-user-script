// ==UserScript==
// @name      Open Food Facts Zoom Autocheck
// @version   2026-08-31
// @author    Naruyoko
// @include   https://*.openfoodfacts.org/cgi/product.pl*
// @icon      data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant     none
// @updateURL https://github.com/Naruyoko/power-user-script/raw/refs/heads/Naruyoko-custom/ZoomAutocheck.user.js
// ==/UserScript==

window.addEventListener("load",function (){
  var s=new WeakSet();
  new MutationObserver(function (ms){ms.forEach(function (m){m.addedNodes.forEach(function (n){
    if (n.nodeType!=Node.ELEMENT_NODE) return;
    var c=n.closest(".cropbox");
    if (!c) return;
    var i=c.querySelector("input[type=checkbox]");
    if (!i){
      s.delete(c);
      return;
    }
    if (s.has(c)) return;
    requestAnimationFrame(function (){
      i.checked=true;
      i.dispatchEvent(new Event("change"));
    });
    s.add(c);
  });});}).observe(document.body,{childList:true,subtree:true});
});