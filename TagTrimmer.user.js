// ==UserScript==
// @name      Tag Trimmer
// @version   2024-09-29_2
// @grant     none
// @include   https://*.openfoodfacts.org/cgi/product.pl?type=edit&code=*
// @include   http://*.openfoodfacts.localhost/cgi/product.pl?type=edit&code=*
//
// @updateURL https://github.com/Naruyoko/power-user-script/raw/refs/heads/Naruyoko-custom/TagTrimmer.user.js
// ==/UserScript==

function TrimmerContext(tagType){
  this.tagType=tagType;
  this.resetStorage();
  this.initializeDatabase();
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
var cacheLifespan=86400000;
TrimmerContext.prototype.loadCanonization=function (tag){
  var context=this;
  return new Promise(function(resolve,reject){
    if (context.canonizationMap.hasOwnProperty(tag)) resolve();
    else{
      var os=context.db.transaction("canonizationMap","readonly").objectStore("canonizationMap");
      var getRequest=os.get(tag);
      getRequest.onerror=reject;
      getRequest.onsuccess=function (){
        var record=getRequest.result;
        if (record&&record.timestamp+cacheLifespan>=Date.now()){
          context.canonizationMap[tag]=record;
          resolve();
        }else{
          setTimeout(function(){
            fetch(context.tagCanonizerURL(tag))
              .then(function(response){
                if (response.status!=200) throw new Error("HTTP error: "+response.status);
                return response.json();
              }).then(function(data){
                var record={
                  tagid:data["tag"]["tagid"],
                  timestamp:Date.now()
                };
                context.canonizationMap[tag]=record;
                var os=context.db.transaction("canonizationMap","readwrite").objectStore("canonizationMap");
                var putRequest=os.put(record,tag);
                putRequest.onerror=reject;
                putRequest.onsuccess=resolve;
              });
          },apiDelay);
        }
      };
    }
  });
};
TrimmerContext.prototype.loadTaxonomy=function (){
  var context=this;
  return new Promise(function(resolve,reject){
    if (context.taxonomy) resolve();
    else{
      var os=context.db.transaction("taxonomy","readonly").objectStore("taxonomy");
      var getRequest=os.get(1);
      getRequest.onerror=reject;
      getRequest.onsuccess=function (){
        var record=getRequest.result;
        if (record&&record.timestamp+cacheLifespan>=Date.now()){
          context.taxonomy=record;
          context.deepParentsMap={};
          resolve();
        }else{
          setTimeout(function(){
            fetch(context.taxonomyURL())
              .then(function(response){
                if (response.status!=200) throw new Error("HTTP error: "+response.status);
                return response.json();
              }).then(function(data){
                var record={
                  data:data,
                  timestamp:Date.now()
                };
                context.taxonomy=record;
                context.deepParentsMap={};
                var os=context.db.transaction("taxonomy","readwrite").objectStore("taxonomy");
                var putRequest=os.put(record,1);
                putRequest.onerror=reject;
                putRequest.onsuccess=resolve;
              });
          },apiDelay);
        }
      };
    }
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
TrimmerContext.prototype.databaseName=function (){
  return "TagTrimmer:"+this.tagType;
};
TrimmerContext.prototype.resetStorage=function (){
  this.log("resetStorage");
  this.canonizationMap={};
  this.taxonomy=null;
  this.deepParentsMap={};
};
TrimmerContext.prototype.clearDatabase=function (){
  var context=this;
  context.resetStorage();
  return new Promise(function (resolve,reject){
    context.db.close();
    var deleteRequest=indexedDB.deleteDatabase(context.databaseName());
    deleteRequest.onerror=reject;
    deleteRequest.onsuccess=function (){
      context.log("clearDatabase: success");
      context.db=null;
      resolve();
    };
  });
};
TrimmerContext.prototype.initializeDatabase=function (){
  var context=this;
  context.db=context.db||null;
  return new Promise(function (resolve,reject){
    if (context.db) context.db.close();
    var dbRequest=indexedDB.open(context.databaseName());
    dbRequest.onerror=reject;
    dbRequest.onupgradeneeded=function (){
      context.log("initializeDatabase: upgradeneeded");
      context.db=dbRequest.result;
      var os;
      os=context.db.createObjectStore("canonizationMap");
      os.createIndex("tagid","tagid",{unique:false});
      os.createIndex("timestamp","timestamp",{unique:false});
      os=context.db.createObjectStore("taxonomy");
      os.createIndex("data","data",{unique:false});
      os.createIndex("timestamp","timestamp",{unique:false});
    };
    dbRequest.onsuccess=function (){
      context.log("initializeDatabase: success");
      context.db=dbRequest.result;
      context.db.onclose=function (){
        context.log("onclose");
      };
      resolve();
    };
  });
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
TrimmerContext.prototype.log=function (){
  arguments[0]="[Tagtrimmer:"+this.tagType+"]: "+arguments[0];
  console.log.apply(this,arguments);
}

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
    .tagtrimmer_table td:nth-child(n+2) {\
      text-align:center;\
    }\
    .tagtrimmer_table td.parentsview_target {\
      text-shadow:blue 0 0 2px;\
    }\
    .tagtrimmer_table td.parentsview_parent {\
      text-decoration-line:overline;\
      text-decoration-thickness:2px;\
    }\
    .tagtrimmer_table td.parentsview_child {\
      text-decoration-line:underline;\
      text-decoration-thickness:2px;\
    }\
    .tagtrimmer_table input[type="radio"].no_effect {\
      opacity:0.5;\
    }';
})();

function TrimmerWindow(tagType){
  this.context=new TrimmerContext(tagType);
  this.createUI();
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
  clearCacheButton.onclick=function(){
    trimmer.context.clearDatabase()
      .then(function (){return trimmer.context.initializeDatabase();})
      .then(function (){return trimmer.grabValues();});
  };
};
TrimmerWindow.prototype.open=function (){
  this.formElem.style.display="block";
  this.grabValues();
};
TrimmerWindow.prototype.grabValues=function (){
  var trimmer=this;
  trimmer.tableBodyElem.innerHTML="";
  trimmer.tags=JSON.parse(trimmer.targetElem.value).map(function(e){return e.value;});
  trimmer.tags.reduce(function(promise,value,i){
    return promise.then(function(){
      trimmer.messageElem.textContent="Loading canonization "+(i+1)+"/"+trimmer.tags.length+" : "+value;
      return trimmer.context.loadCanonization(value);
    });},Promise.resolve())
    .then(function(){
      trimmer.messageElem.textContent="Loading taxonomy";
      return trimmer.context.loadTaxonomy();
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
          cellElem.onmouseover=function(){trimmer.setWhatIf(tag,value);};
          cellElem.onmouseout=function(){trimmer.clearWhatIf();};
          buttonElem.type="radio";
          buttonElem.name=tag;
          buttonElem.value=value;
          buttonElem.onchange=function(){trimmer.update();};
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
