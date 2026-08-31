// ==UserScript==
// @name      Open Food Facts Zoom Autocheck
// @version   2026-09-01
// @author    Naruyoko
// @include   https://*.openfoodfacts.org/cgi/product.pl*
// @icon      data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant     none
// @updateURL https://github.com/Naruyoko/power-user-script/raw/refs/heads/Naruyoko-custom/ZoomAutocheck.user.js
// ==/UserScript==

window.addEventListener("load",()=>{
  let f=false;
  new MutationObserver(ms=>{
    f||=ms.some(m=>m.addedNodes.values().some(
      n=>n.nodeType==Node.ELEMENT_NODE&&n.querySelector("input[type=checkbox]")&&n.closest(".cropbox")
    ));
    f&&requestAnimationFrame(()=>{
      if (!f) return;
      f=false;
      let i=document.querySelector(".cropbox input[type=checkbox]");
      if (!i) return;
      i.checked=true;
      i.dispatchEvent(new Event("change"));
    });
  }).observe(document.body,{childList:true,subtree:true});
});