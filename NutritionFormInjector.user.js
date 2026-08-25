// ==UserScript==
// @name      Open Food Facts Nutrition Form Injector
// @version   2026-08-26
// @author    Naruyoko
// @include   https://*.openfoodfacts.org/cgi/product.pl*
// @icon      data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant     none
// @require   http://code.jquery.com/jquery-2.1.4.min.js
// @updateURL https://github.com/Naruyoko/power-user-script/raw/refs/heads/Naruyoko-custom/NutritionFormInjector.user.js
// ==/UserScript==

window.addEventListener("load",function (){
  var insertionPoint=$("label[for=serving_size]");
  var inputElement=$("<textarea>",{class:"monospace"});
  var applyButton=$("<button>",{text:"\u2193",class:"small button",type:"button"}).on("click",writeValues);
  insertionPoint.before($("<div>").append(inputElement,applyButton));
  function writeValues(){
    for (var lines=inputElement.val().split("\n"),i=0;i<lines.length;i++){
      var l=lines[i].trim();
      if (!l||l[0]=="#") continue;
      var m=l.split("=",2);
      if (m.length!=2) continue;
      var k=m[0].trim(),v=m[1].trim(),v2="";
      if (v.length>=2&&v[0]=="\""&&v[v.length-1]=="\"") v2=v.substring(1,v.length-1);
      var t=$("#"+k);
      if (!t) continue;
      var c=false,r=null;
      if (k=="serving_size") t.val(v2),c=true;
      if (r=/^nutrition_input_sets_(as_sold|prepared)_(100g|100ml|1l|serving)_shown$/.exec(k))
        t.prop("checked",!!+v2),c=true;
      if (r=/^nutrition_input_sets_(as_sold|prepared)_(100g|100ml|1l|serving)_nutrients_([- 0-9A-Za-z]+)_value_string$/.exec(k))
        t.val(v2),$("#nutrient_"+r[3]+"_tr").css("display",""),c=true;
      if (r=/^global_nutrient_[- 0-9A-Za-z]+_unit$/.exec(k))
        t.val(v2),c=true;
      if (c) t[0].dispatchEvent(new Event("change"));
      else console.warn(l);
    }
  }
});