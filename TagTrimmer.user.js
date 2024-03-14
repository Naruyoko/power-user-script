// ==UserScript==
// @name     Tag Trimmer
// @version  1
// @grant    none
// @include  https://*.openfoodfacts.org/cgi/product.pl?type=edit&code=*
// @include  http://*.openfoodfacts.localhost/cgi/product.pl?type=edit&code=*
// ==/UserScript==

function TrimmerContext(tagType){
  this.tagType=tagType;
  this.resetStorage();
}
TrimmerContext.prototype.taxonomyURL=function (){
  return window.location.origin+"/data/taxonomies/"+this.tagType+".json";
};
TrimmerContext.prototype.tagCanonizerURL=function (tag){
  return window.location.origin+"/api/v3/tag/"+this.tagType+"/"+tag;
};
/*TrimmerContext.prototype.tagInfoURL=function (tagids){
  return window.location.origin+"/api/v2/taxonomy?tagtype="+this.tagType+"&tags="+tagids.join(",");
};*/

var apiDelay=100;
TrimmerContext.prototype.fetchMissingCanoninzation=function (tag){
  var context=this;
  return new Promise(function(resolve,reject){
    if (context.canonizationMap.hasOwnProperty(tag)) resolve();
    else setTimeout(function(){
      fetch(context.tagCanonizerURL(tag))
        .then(function(response){
          if (response.status!=200) throw new Error("HTTP error: "+response.status);
          return response.json();
        }).then(function(data){
          context.canonizationMap[tag]={
            tagid:data["tag"]["tagid"],
            timestamp:Date.now()
          };
          context.saveCache();
        }).then(resolve,reject);
    },apiDelay);
  });
};
//Insufficient for recursive parents
/*TrimmerContext.prototype.fetchMissingParents=function (tagids){
  var context=this;
  return new Promise(function(resolve,reject){
    var missing=tagids.filter(function(tag){return !context.parentsMap.hasOwnProperty(tag);});
    if (!missing.length) resolve();
    else setTimeout(function(){
      fetch(context.tagInfoURL(tagids))
        .then(function(response){
          if (response.status!=200) throw new Error("HTTP error: "+response.status);
          return response.json();
        }).then(function(data){
          missing.forEach(function(tag){
            context.parentsMap[tag]={
              parents:data[tag]["parents"],
              timestamp:Date.now()
            };
          });
          context.saveCache();
          resolve(missing);
        }).then(resolve,reject);
    },apiDelay);
  });
};*/
TrimmerContext.prototype.fetchMissingTaxonomy=function (){
  var context=this;
  return new Promise(function(resolve,reject){
    if (this.taxonomy) resolve();
    else setTimeout(function(){
      fetch(context.taxonomyURL())
        .then(function(response){
          if (response.status!=200) throw new Error("HTTP error: "+response.status);
          return response.json();
        }).then(function(data){
          context.taxonomy={
            data:data,
            timestamp:Date.now()
          };
          context.parentsMap={};
          context.saveCache();
        }).then(resolve,reject);
    },apiDelay);
  });
};
TrimmerContext.prototype.getCanonization=function (tag){
  return this.canonizationMap[tag]["tagid"];
};
TrimmerContext.prototype.getCanonizationEach=function (tags){
  var context=this;
  return tags.map(function(tag){return context.getCanonization(tag);});
};
TrimmerContext.prototype.getParents=function (tagid){
  return this.taxonomy.data[tagid]&&this.taxonomy.data[tagid]["parents"];
};
TrimmerContext.prototype.getParentsEach=function (tagids){
  var context=this;
  return tagids.map(function(tagid){return context.getParents(tagid);});
};
TrimmerContext.prototype.getDeepParents=function (tagid){
  if (this.deepParentsMap[tagid]!=null) return this.deepParentsMap[tagid];
  var r=[];
  var p=this.getParents(tagid);
  if (p) for (var i=0;i<p.length;i++){
    var a=this.getDeepParents(p[i]);
    if (a) for (var j=0;j<a.length;j++){
      if (r.indexOf(a[j])==-1) r.push(a[j]);
    }
    if (r.indexOf(p[i])==-1) r.push(p[i]);
  }
  return this.deepParentsMap[tagid]=r;
};
TrimmerContext.prototype.getDeepParentsEach=function (tagids){
  var context=this;
  return tagids.map(function(tagid){return context.getDeepParents(tagid);});
};
TrimmerContext.prototype.localStorageKey=function (){
  return "TagTrimmer:"+this.tagType;
};
TrimmerContext.prototype.resetStorage=function (){
  this.canonizationMap={};
  this.taxonomy=null;
  this.deepParentsMap={};
};
TrimmerContext.prototype.clearCache=function (){
  this.resetStorage();
  this.saveCache();
};
TrimmerContext.prototype.saveCache=function (){
  localStorage.setItem(this.localStorageKey(),JSON.stringify({
    canonizationMap:this.canonizationMap,
    taxonomy:this.taxonomy
  }));
};
var cacheLifespan=86400000;
TrimmerContext.prototype.loadCache=function (){
  this.resetStorage();
  var saved=localStorage.getItem(this.localStorageKey());
  if (saved===null) return;
  var parsed=JSON.parse(saved);
  var time=Date.now();
  this.canonizationMap=parsed.canonizationMap;
  for (var a=Object.entries(this.canonizationMap),i=0;i<a.length;i++){
    if (a[i][1].timestamp+cacheLifespan<time) delete this.canonizationMap[a[i][0]];
  }
  this.taxonomy=parsed.taxonomy;
  if (this.taxonomy&&this.taxonomy.timestamp+cacheLifespan<time) this.taxonomy=null;
};
TrimmerContext.prototype.compute=function (tags,values){
  var context=this;
  var tagids=context.getCanonizationEach(tags);
  var parents=context.getDeepParentsEach(tagids);
  // parentsGraph[i][j] ~> tagids[i] has parent tagids[j]
  var parentsGraph=parents.map(function(l){return tagids.map(function(p){return !!l&&l.indexOf(p)!=-1;});});
  var l=tags.length;
  var states=Array(l).fill(0);
  for (var i=0;i<l;i++) if (values[i]=="keep"){
    states[i]=1;
    for (var j=0;j<l;j++) if (parentsGraph[i][j]) states[j]=2;
  }
  var excavationStack=[];
  for (var i=0;i<l;i++) if (states[i]<=0&&(values[i]=="remove"||values[i]=="excavate")){
    if (states[i]==0) states[i]=-1;
    if (values[i]=="excavate") excavationStack.push(i);
    for (var j=0;j<l;j++) if (parentsGraph[j][i]) states[j]=-2;
  }
  while (excavationStack.length){
    var i=excavationStack.pop();
    for (var j=0;j<l;j++){
      if (parentsGraph[i][j]&&states[j]==0&&
          parentsGraph.every(function(l,k){return !l[j]||states[k]<0;})){
        states[j]=-1;
        excavationStack.push(j);
      }
    }
  }
  return {
    tags:tags,
    tagids:tagids,
    parents:parents,
    parentsGraph:parentsGraph,
    values:values,
    states:states
  };
};

void (function(){
  var s=document.createElement("style");
  document.head.appendChild(s);
  s.innerHTML='\
    .tagtrimmer_button {\
      margin:0;\
    }\
    .tagtrimmer_table tr{\
      transition:all 0.1s ease;\
    }\
    .tagtrimmer_table tr.keep {\
      background-color:#a0ffa0;\
    }\
    .tagtrimmer_table tr.remove {\
      background-color:#ff8080;\
    }\
    .tagtrimmer_table tr.whatif_keep {\
      outline:solid 5px #00c000;\
      outline-offset:-5px;\
    }\
    .tagtrimmer_table tr.whatif_remove {\
      outline:solid 5px #ff0000;\
      outline-offset:-5px;\
    }\
    .tagtrimmer_table tr.whatif_auto {\
      outline:solid 5px #a0a0a0;\
      outline-offset:-5px;\
    }\
    .tagtrimmer_table td.parentsview_target {\
      text-shadow:blue 0 0 2px;\
    }\
    .tagtrimmer_table td.parentsview_parent {\
      text-decoration:solid overline 2px;\
    }\
    .tagtrimmer_table td.parentsview_child {\
      text-decoration:solid underline 2px;\
    }\
    .tagtrimmer_table input[type="radio"].no_effect {\
      opacity:0.5;\
    }';
})();

function TrimmerWindow(tagType){
  this.context=new TrimmerContext(tagType);
  this.createUI(tagType);
};
TrimmerWindow.prototype.createUI=function (){
  var trimmer=this;
  trimmer.targetElem=document.getElementById(trimmer.context.tagType);
  trimmer.targetElem.trimmer=trimmer;
  var labelElem=trimmer.targetElem.labels[0];
  labelElem.style.display="inline-block";
  labelElem.style.marginRight="8px";
  var toggleButton=document.createElement("button");
  labelElem.after(toggleButton);
  toggleButton.innerHTML="&#x1f333;";
  toggleButton.className="small button tagtrimmer_button";
  toggleButton.type="button";
  toggleButton.onclick=function(){trimmer.formElem.style.display=="none"?trimmer.open():trimmer.close();};
  trimmer.formElem=document.createElement("form");
  toggleButton.after(trimmer.formElem);
  trimmer.formElem.style="margin:4px;padding:4px;border:1px black solid;display:none;";
  trimmer.tableElem=document.createElement("table");
  trimmer.formElem.appendChild(trimmer.tableElem);
  trimmer.tableElem.innerHTML='\
    <thead>\
      <tr>\
        <th>Value</th>\
        <th title="Automatic">&#x2754;</th>\
        <th title="Remove this (and all children)">&#x2702;&#xfe0f;</th>\
        <th title="Remove this and all parents">&#x1f944;</th>\
        <th title="Keep this and all parents">&#x1f331;</th>\
      </tr>\
    </thead>';
  trimmer.tableElem.className="tagtrimmer_table";
  trimmer.tableBodyElem=document.createElement("tbody");
  trimmer.tableElem.appendChild(trimmer.tableBodyElem);
  trimmer.messageElem=document.createElement("p");
  trimmer.formElem.appendChild(trimmer.messageElem);
  var applyButton=document.createElement("button");
  trimmer.formElem.appendChild(applyButton);
  applyButton.textContent="Apply and close";
  applyButton.className="small button tagtrimmer_button";
  applyButton.type="button";
  applyButton.onclick=function(){trimmer.apply();trimmer.close();};
  var clearCacheButton=document.createElement("button");
  trimmer.formElem.appendChild(clearCacheButton);
  clearCacheButton.textContent="Clear cache";
  clearCacheButton.className="small button tagtrimmer_button";
  clearCacheButton.type="button";
  clearCacheButton.onclick=function(){trimmer.context.clearCache();trimmer.grabValues();};
};
TrimmerWindow.prototype.open=function (){
  this.formElem.style.display="block";
  this.grabValues();
};
TrimmerWindow.prototype.grabValues=function (){
  var trimmer=this;
  trimmer.tableBodyElem.innerHTML="";
  trimmer.context.loadCache();
  trimmer.tags=JSON.parse(trimmer.targetElem.value).map(function(e){return e.value;});
  trimmer.tags.reduce(function(promise,value,i){
    return promise.then(function(){
      trimmer.messageElem.textContent="Loading canonization "+(i+1)+"/"+trimmer.tags.length+" : "+value;
      return trimmer.context.fetchMissingCanoninzation(value);
    });},Promise.resolve())
    .then(function(){
      trimmer.messageElem.textContent="Loading taxonomy";
      return trimmer.context.fetchMissingTaxonomy();
    }).then(function(){
      trimmer.tags.forEach(function(tag){
        var rowElem=document.createElement("tr");
        trimmer.tableBodyElem.appendChild(rowElem);
        rowElem.onmouseover=function(){trimmer.setParentsView(tag);};
        rowElem.onmouseout=function(){trimmer.clearParentsView();};
        var cellElem=document.createElement("td");
        rowElem.appendChild(cellElem);
        cellElem.textContent=tag;
        ["auto","remove","excavate","keep"].forEach(function(value){
          var cellElem=document.createElement("td");
          rowElem.appendChild(cellElem);
          var buttonElem=document.createElement("input");
          cellElem.appendChild(buttonElem);
          buttonElem.type="radio";
          buttonElem.name=tag;
          buttonElem.value=value;
          buttonElem.onchange=function(){trimmer.update();};
          buttonElem.onmouseover=function(){trimmer.setWhatIf(tag,value);};
          buttonElem.onmouseout=function(){trimmer.clearWhatIf();};
          if (value=="auto") buttonElem.checked=true;
        });
      });
    }).then(function(){
      trimmer.update();
      trimmer.messageElem.textContent="";
    });
  trimmer.messageElem.textContent=trimmer.tags.join(";");
};
TrimmerWindow.prototype.close=function (){
  this.formElem.style.display="none";
};
TrimmerWindow.prototype.apply=function (){
  var trimmer=this;
  trimmer.targetElem.value=JSON.stringify(trimmer.tags
    .filter(function(_,i){return trimmer.lastResult.states[i]>=0;})
    .map(function(tag){return {"value":tag};}));
};
TrimmerWindow.prototype.update=function (){
  var trimmer=this;
  var values=trimmer.tags.map(function(tag){return trimmer.formElem.elements[tag].value;});
  var result=trimmer.context.compute(trimmer.tags,values);
  trimmer.lastResult=result;
  trimmer.tags.forEach(function(tag,i){
    var buttonList=trimmer.formElem.elements[tag];
    var rowElem=buttonList[0].closest("tr");
    rowElem.classList.remove("keep","remove","whatif_keep","whatif_remove","whatif_auto");
    if (result.states[i]>0) rowElem.classList.add("keep");
    if (result.states[i]<0) rowElem.classList.add("remove");
    buttonList.forEach(function(buttonElem){
      buttonElem.classList.remove("no_effect");
      if (result.states[i]==-2&&buttonElem.value=="remove") buttonElem.classList.add("no_effect");
      if (result.states[i]==2&&(buttonElem.value=="remove"||buttonElem.value=="excavate")) buttonElem.classList.add("no_effect");
    });
  });
};
TrimmerWindow.prototype.setWhatIf=function (targetTag,replaceValue){
  var trimmer=this;
  var values=trimmer.tags.map(function(tag){return tag==targetTag?replaceValue:trimmer.formElem.elements[tag].value;});
  var result=trimmer.context.compute(trimmer.tags,values);
  trimmer.tags.forEach(function(tag,i){
    var buttonList=trimmer.formElem.elements[tag];
    var rowElem=buttonList[0].closest("tr");
    rowElem.classList.remove("whatif_keep","whatif_remove","whatif_auto");
    if (Math.sign(result.states[i])==Math.sign(trimmer.lastResult.states[i])) return;
    if (result.states[i]>0) rowElem.classList.add("whatif_keep");
    if (result.states[i]<0) rowElem.classList.add("whatif_remove");
    if (result.states[i]==0) rowElem.classList.add("whatif_auto");
  });
};
TrimmerWindow.prototype.clearWhatIf=function (){
  var trimmer=this;
  trimmer.tags.forEach(function(tag){
    var rowElem=trimmer.formElem.elements[tag][0].closest("tr");
    rowElem.classList.remove("whatif_keep","whatif_remove","whatif_auto");
  });
};
TrimmerWindow.prototype.setParentsView=function (targetTag){
  var trimmer=this;
  var targetIndex=trimmer.tags.indexOf(targetTag);
  trimmer.tags.forEach(function(tag,i){
    var cellElem=trimmer.formElem.elements[tag][0].closest("tr").querySelector("td");
    cellElem.classList.remove("parentsview_target","parentsview_parent","parentsview_child");
    if (i==targetIndex) cellElem.classList.add("parentsview_target");
    if (trimmer.lastResult.parentsGraph[targetIndex][i]) cellElem.classList.add("parentsview_parent");
    if (trimmer.lastResult.parentsGraph[i][targetIndex]) cellElem.classList.add("parentsview_child");
  });
};
TrimmerWindow.prototype.clearParentsView=function (){
  var trimmer=this;
  trimmer.tags.forEach(function(tag){
    var cellElem=trimmer.formElem.elements[tag][0].closest("tr").querySelector("td");
    cellElem.classList.remove("parentsview_target","parentsview_parent","parentsview_child");
  });
};

void ["categories","labels","countries","allergens","traces"]
  .forEach(function(tagName){new TrimmerWindow(tagName);});
