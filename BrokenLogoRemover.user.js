// ==UserScript==
// @name      Broken Logo Remover
// @version   1
// @grant     none
// @include   https://hunger.openfoodfacts.org/logos/deep-search*
// @include   https://hunger.openfoodfacts.org/logos/deep-search?*
//
// @updateURL https://github.com/Naruyoko/power-user-script/raw/refs/heads/Naruyoko-custom/BrokenLogoRemover.user.js
// ==/UserScript==

//Note: Only use this button if you don't have any images selected

var add=function (){
  var e=document.querySelector("button.css-pyvh5k");
  if (!e){
    setTimeout(add,100);
    return;
  }
  var c=e.cloneNode();
  c.textContent="Remove broken logos";
  c.onclick=function (){
    for (var e of document.querySelectorAll("div.css-fwt890")[1].querySelectorAll("button.css-6nutgp")){
      var img=e.querySelector("img");
      if (img.complete&&img.naturalWidth===0) e.click();
    }
    document.querySelector("button.css-1onndao").click();
  }
  e.parentNode.appendChild(c);
}
add();