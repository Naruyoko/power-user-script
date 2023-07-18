// ==UserScript==
// @name     Nutrition Scalar
// @version  1
// @grant    none
// @include  https://*.openfoodfacts.org/cgi/product.pl?type=edit&code=*
// ==/UserScript==

function addScaleButton(hsel,sel){
  function scaleValues(){
    var multiplier=+eval(prompt("Enter the multiplier",1));
    if (multiplier) document.querySelectorAll(sel).forEach(e=>e.value&&(e.value=e.value.replace(/\d*\.\d*|\d+/,v=>+(v*multiplier).toPrecision(7))));
  }
  var e=document.createElement("button");
  e.textContent="×";
  e.onclick=e=>e.preventDefault()+scaleValues();
  e.style.padding="0 10px";
  var he=document.querySelector(hsel);
  he.appendChild(document.createElement("br"));
  he.appendChild(e);
}

addScaleButton("th.nutriment_col",".nutriment_value_as_sold");
addScaleButton("th.nutriment_col_prepared",".nutriment_value_prepared");
