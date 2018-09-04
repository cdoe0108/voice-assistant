var NavigationManager = (function(parent) {

	
	var ui = {},
	nextIndex = 0,
	NUMBER_OF_ITEMS = 1,
	domElems = getDOMElements(),
	isUIInitialized = false;
	var languageSelect='';
	parent.languageSelect="en-IN";
	function initializeUI(){
		ui.view = document.querySelector('#nav-page');
		ui.menuList = ui.view.querySelector('#nav-page-list');
		isUIInitialized = true; 					
	}

	function getDOMElements() {
		var mapping = {
			navPage: '#nav-page-list',
			mic: 'google-mic'
		};
		return Object.keys(mapping).reduce((a, x) => {
			a[x] = document.querySelector(mapping[x]);
			//console.log(a);
			return a;
		}, {});
	}

	parent.render = function(){
		if(!isUIInitialized){
			initializeUI();
			//console.log('redering navingation');
		}
	};

parent.onEvent = function(e){
		console.log(e);
		switch(e.key){
			case 'ArrowDown':
				moveDown(e);
				break;
			case 'ArrowUp':
				moveUp(e);
				break;
			case 'SoftRight':
				window.close();
				break;
			case '0':
				window.close();
				break;
		}
		parent.languageSelect = languageSelect;
		return languageSelect;
};



parent.showView =  function() {
	domElems.mic.setFocus();
	nextIndex = 0;
	if(typeof(ui.view) != 'undefined'){
		ui.view.style.display = 'block'; 
	}
};



parent.hideView =function() {
	ui.view.style.display = 'none'; 
};

function toggleLanguage() {
	if(domElems.mic.getAttribute('mkt') === 'hi-IN'){
		domElems.mic.setAttribute('mkt', 'en-IN');
		navigator.mozL10n.ctx.requestLocales('en-US');
	}else{
		navigator.mozL10n.ctx.requestLocales('hi-IN');
		domElems.mic.setAttribute('mkt', 'hi-IN');	
	}
}

function moveDown(e){
	//e.preventDefault();
	console.log(nextIndex);
	if(nextIndex >= NUMBER_OF_ITEMS){
	}else{
		var elem = domElems.navPage.children[
		nextIndex++];
		elem.focus();
	} 
	return this;
}
function moveUp(e){
	//e.preventDefault();
	console.log(nextIndex);
	if(nextIndex <= 1){
		domElems.mic.setFocus();
		nextIndex = 0;
	}else{
		console.log('element' +' ' +nextIndex);
		var elem = domElems.navPage.children[
		--nextIndex - 1];
		elem.focus();
	}
	return this;
}

return parent;

})(NavigationManager || {});
