// ==UserScript==
// @name      Open Food Facts Nutrition Form Injector
// @version   2026-08-31
// @author    Naruyoko
// @include   https://*.openfoodfacts.org/cgi/product.pl*
// @icon      data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant     none
// @updateURL https://github.com/Naruyoko/power-user-script/raw/refs/heads/Naruyoko-custom/NutritionFormInjector.user.js
// ==/UserScript==

window.addEventListener("load",function (){
  var insertionPoint=document.querySelector("label[for=serving_size]");
  var inputElement=document.createElement("textarea");
  inputElement.className="monospace";
  var applyButton=document.createElement("button");
  applyButton.textContent="\u2193";
  applyButton.className="small button";
  applyButton.type="button";
  applyButton.onclick=writeValues;
  var wrapper=document.createElement("div");
  wrapper.appendChild(inputElement);
  wrapper.appendChild(applyButton);
  insertionPoint.parentNode.insertBefore(wrapper,insertionPoint);
  function writeValues(){
    for (var lines=inputElement.value.split("\n"),i=0;i<lines.length;i++){
      var l=lines[i].trim();
      if (!l||l[0]=="#") continue;
      var m=l.split("=",2);
      if (m.length!=2) continue;
      var k=m[0].trim(),v=m[1].trim(),v2="";
      if (v.length>=2&&v[0]=="\""&&v[v.length-1]=="\"") v2=v.substring(1,v.length-1);
      var t=document.querySelector("#"+k);
      if (!t) continue;
      var c=false,r=null;
      if (k=="serving_size") t.value=v2,c=true;
      if (r=/^nutrition_input_sets_(as_sold|prepared)_(100g|100ml|1l|serving)_shown$/.exec(k))
        t.checked=!!+v2,c=true;
      if (r=/^nutrition_input_sets_(as_sold|prepared)_(100g|100ml|1l|serving)_nutrients_([- 0-9A-Za-z]+)_value_string$/.exec(k))
        t.value=v2,document.getElementById("nutrient_"+r[3]+"_tr").style.display="",c=true;
      if (r=/^global_nutrient_[- 0-9A-Za-z]+_unit$/.exec(k))
        t.value=v2,c=true;
      if (c) t.dispatchEvent(new Event("change"));
      else console.warn(l);
    }
  }
});