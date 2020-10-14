# power-user-script
User script for your browser, to empower [Open Food Facts](https://world.openfoodfacts.org/)  contribution. Power User Script is a kind of laboratory, to explore new features before they can get into Open Food Facts.

Some features:
* keyboard shortcuts to different pages: product edition (e), product JSON (a), view mode (v), etc.
* styling improvements via CSS: barcode highlighted, fields highlighted, etc.
* show/hide barcode
* show/hide helpers
* sidebar quick links: page translation, category translation, Recent Changes, Hunger Game...
* inline edit of ingredients
* information enhancements beside barcode number: links to Google search, Open Beauty Facts, etc.
* information enhancements in the confirmation page: product issues, going further, etc.
* recent changes filter (filter as you type)
* etc. See complete list in the "changelog" or directly in JS code

# Install
To run userscripts it's best to have a script manager installed. Userscript managers are available as browser extensions:

* Greasemonkey  – works with Firefox - https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/
* Tampermonkey  – works with Chrome, Safari, Firefox and other browsers - http://tampermonkey.net/

Choose an appropriate manager and install it according to the requirements of your browser.

Once your script manager is installed you can go to https://github.com/openfoodfacts/power-user-script/blob/master/OpenFoodFactsPower.user.js

Just click on the Raw button and your script manager will ask you if you want to install the script.

# Changelog
### 2020-10-14T11:53
* Categorization opportunities link
* Add DuckDuckGo link for product barcode (near the barcode)
### 2020-06-26T16:33
* Deep link to Hunger Game when the page is related to a category, label or brand
* exclude wiki pages from script
### 2020-05-04T10:39
* Modify link to hunger game
* Nutrition facts picture takes all the place available: should work for every modern browser (CSS3)
* very small update, the "a" key now opens the json page in a new window (instead of Alt+Shift+A)
### 2020-04-17T14:33
* Confirmation page: quality errors and quality warnings displayed in red (or green when it's all right)
* Google Link for product barcode (near the barcode)
* Link to Open Pet Food Facts (near the barcode)
* Firefox: Nutrition facts picture takes all the place available
### 2020-04-11T17:26
* Add openbeautyfacts.org link and its status code (200 = the product exists; 404 it doesn't)
* Add .pro.openffodfacts.org link (status code isn't working)
* Add "ingredient mode" to simplify ingredients management => ("i" key in "edit" mode)
* Developper: console.log messages more clear
### 2020-03-24TT11:12
* Add a field to filter Recent Changes results (filter as you type)
### 2020-01-09T16:54
* Add version date to flag feature
### 2019-12-16T17:27
* Add Hunger Game link
* Various fixes
### 2019-12-09T18:34
* Change "?" menu position
### 2019-12-04T15:15
* Edit mode: show/hide field help comments
### 2019-11-22T08:33
* flagging improvement 
  * allow flagging on page which is not a revision
  * add product_improvement
* reorganize menu and add separators
### 2019-11-19T11:40
* Detect pro platform + add product public URL
### 2019-11-18T16:54
* Add quick links in the sidebar
* Refactor help box
### 2019-11-04T09:33
* change @updateURL to https://github.com/openfoodfacts/power-user-script/raw/master/OpenFoodFactsPower.user.js
* comment code made for easier to read number of products because of https://github.com/openfoodfacts/openfoodfacts-server/issues/2474
### 2019-10-23T13:42
* number of products easier to read (with separators depending on your locale); see: https://github.com/openfoodfacts/openfoodfacts-server/issues/2474
### 2019-09-12T16:45
* initial publication on this current Github repo
