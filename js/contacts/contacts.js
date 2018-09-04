window.FxContactMgr.API.Contacts = {	
	setMessageInput: false,
	isContactList:false,
	focusIndex:0,
	isContactFoundMultipleMsg:false,
	transformContact: function (c) {
		return {
			fname  : c.givenName  ? c.givenName[0]  : '',
			lname  : c.familyName ? c.familyName[0] : '',

      //both tel and email properties are arrays and
      //may contain more than one number/email.
      //For simplicity I am using only first one
      mobile : c.tel && c.tel.length     ? c.tel[0].value    : '',
      email  : c.email && c.email.length ? c.email[0].value  : '',
      org : c.org && c.org.length ? c.org[0] : 'None',
      type : c.type && c.type.length ? c.type[0] : ''
  };
},

loadAllContacts: function (callback){
	var self = this,
		request = window.navigator.mozContacts.getAll(),
		count = 0,
		allContact = [];

	request.onsuccess = function () {
		if(this.result) {
			count++;

			allContact.push(self.transformContact(this.result));
			
			// Display the name of the contact
			//console.log(this.result.givenName + ' ' + this.result.familyName);

			// Move to the next contact which will call the request.onsuccess with a new result
			this.continue();

		} else {
			callback(allContact)
			//console.log(count + 'contacts found.');
		}
	}

	request.onerror = function () {
		console.log('Something goes wrong!');
	}

},

getFullTextSearch: function (contactList, searchString, resolvedQuery, cb, mic, val){
	if(!mic){
		mic = document.getElementsByTagName('google-mic')[0]
	}
	var splitStr = searchString.split(" ");
	var processedStr = [];
	for (var i = 0; i < splitStr.length; i++) {
		if (VL.lang_key[mic.mkt].contactIgnoreWords.indexOf(splitStr[i]) === -1) {
			processedStr.push(splitStr[i]);
		}
	}
	searchString = processedStr.join(" ");
	searchString = searchString.trim();

	var splitStrLocale = resolvedQuery.split(" ");
	var processedStrLocale = [];
	for (var i = 0; i < splitStrLocale.length; i++) {
		if (VL.lang_key[mic.mkt].contactIgnoreWords.indexOf(splitStrLocale[i]) === -1) {
			processedStrLocale.push(splitStrLocale[i]);
		}
	}
	resolvedQuery = processedStrLocale.join(" ");
	resolvedQuery = resolvedQuery.trim();

	var self = this,
		contacts = [],
		closecontacts = [],
		searchContact=[],
		matchedContact=[],
		fullContact=[],
		count = 0,
		flag=false;
	var resEng = searchString.split(" ");
	var resLocale = resolvedQuery.split(" ");
	var res = resEng.concat(resLocale);
	res = res.filter(function(item, i, ar){ return ar.indexOf(item) === i; });


	for(i=0;i<res.length;i++){
		res[i] = res[i].toLowerCase();
	}

	for(var i=0; i<=contactList.length;i++){
		if(contactList[i]){
			var contactDetail = contactList[i];
			var fname = contactDetail.fname.toLowerCase();
			var lname = '';
			if(contactDetail.lname)
			{
				lname = contactDetail.lname.toLowerCase();
			}
			var fullName = (fname+lname).trim().replace(/\s/g, '');
			var query = searchString.trim().replace(/\s/g, '').toLowerCase();
			var queryLocale = resolvedQuery.trim().replace(/\s/g, '');

			if((fullName==query) || fullName==queryLocale){
				matchedContact.push(contactDetail);
			}
			for(var j=0;j<res.length;j++){
				if ((fname == res[j] || lname == res[j] || (fname.indexOf(res[j]) > -1) || lname.indexOf(res[j]) > -1) && res[j] != "") {
					if(fullContact.indexOf(fullName) === -1)
					{
						searchContact.push(contactDetail);	
						fullContact.push(fullName);
					}
				}
			}
		}
	}
	
	if(matchedContact.length>0){
		if(matchedContact.length==1){
			cb(matchedContact);
			return;
		}
		else{
			self.renderContactList(matchedContact,mic);
		}
	}else if(searchContact.length>=1){
		if((searchContact.length>1)){
			self.renderContactList(searchContact,mic);
		}else{
			cb(searchContact);
		}
	}else{
		var audio_en = new Audio('../audio/couldntfindcontact.mp3');
		var audio_hi = new Audio('../audio/samparknahimila.mp3');
		if(mic.mkt == "en-IN"){
			audio_en.play();
		}else if(mic.mkt == "hi-IN"){
			audio_hi.play();
		}
		mic.img.src = mic.imgSrcs.contactNotFound;
		mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['didnt_find_contact']);
		if(VL.pushToTalk){
			mic.setAttribute('secondary-text', VL.mic_key[mic.mkt]['push_talk']);
		}
		else{
			mic.setAttribute('secondary-text', VL.mic_key[mic.mkt]['activate_voice']);
		}
		self.setMessageInput = false;
		self.isContactFoundMultipleMsg = false;
		self.isContactList = false;
		mic.isSMSRecording = false;
		mic.isErrorScreen = true;
		document.getElementById("menu-options").style.display="block";
		//analytics not found contact
		ST.sendAnalyticsError("contact_not_found");
	}
},

renderContactList:function(contactlist, mic){
	
	this.isContactList = true;
	this.focusIndex = 0;

	mic.setAttribute('secondary-text', '');
	if(VL.pushToTalk){
		mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['push_talk']);
	}
	else{
		mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['activate_voice']);
	}
	
	document.getElementById("mic-holder").style.display="none";
	document.getElementById("menu-options").style.display="none";
	document.getElementById("small-mic-holder").style.display="block";
	document.getElementById("view-contacts").style.display="block";
	
	var contactListUi={};

	contactListUi.container = document.getElementById("contacts-list");

	contactListUi.container.innerHTML='';

	contactListUi.fragment = document.createDocumentFragment();

	for(var i=0;i<contactlist.length;i++){
		var contactDetails = {};
		contactDetails.li = document.createElement('li');
		contactDetails.li.classList.add("contact-list-li-"+i);
		contactDetails.name = document.createElement('div');
		contactDetails.name.classList.add("contact-list-name");
		contactDetails.mobile = document.createElement('div');
		contactDetails.mobile.classList.add("contact-list-mobile");
		contactDetails.name.textContent= contactlist[i].fname + ' ' + contactlist[i].lname;
		contactDetails.mobile.textContent= contactlist[i].mobile;
		contactDetails.li.appendChild(contactDetails.name);
		contactDetails.li.appendChild(contactDetails.mobile);
		contactListUi.fragment.appendChild(contactDetails.li)
	}
	contactListUi.container.appendChild(contactListUi.fragment);
	contactListUi.container.querySelector(".contact-list-li-0").classList.add("active-contact");
},

focusContactList:function(action){
	if(action=="ArrowDown"){
		var nextContact = document.getElementsByClassName("contact-list-li-"+(this.focusIndex+1));
		if(nextContact.length>0){
			document.getElementsByClassName("active-contact")[0].classList.remove("active-contact");
			nextContact[0].classList.add("active-contact");
			this.focusIndex = this.focusIndex+1;
		}
	}else if(action=="ArrowUp" && this.focusIndex>0){
		var prevContact = document.getElementsByClassName("contact-list-li-"+(this.focusIndex-1));
		if(prevContact.length>0){
			document.getElementsByClassName("active-contact")[0].classList.remove("active-contact");
			prevContact[0].classList.add("active-contact");
			this.focusIndex = this.focusIndex-1;
		}
	}
},

dialSelectedContact:function(){
	this.dialNumber(document.querySelectorAll(".active-contact .contact-list-mobile")[0].textContent);
},

	preprocessStrings : function (stringToPreprocess) {
		var patterns = /call\s[A-Z]+/i;
		var response = {};

		if(!stringToPreprocess || stringToPreprocess.length==0){
			response = {command:"all",query:''};	
		}
		else {
			for(var i=0;i<VL.toReplaceInCall.length;i++){
				if(stringToPreprocess.indexOf(VL.toReplaceInCall[i]) >=0 ){
					console.log(stringToPreprocess.indexOf(VL.toReplaceInCall[i]))
					console.log(stringToPreprocess.replace(VL.toReplaceInCall[i],""));
					response = {command:"call",query:stringToPreprocess.replace(VL.toReplaceInCall[i],"")};
				}
			}
		} 
		return response;
	},

	preprocessSmsStrings : function (stringToPreprocess) {
		var mic = document.getElementsByTagName('google-mic')[0];
		var response = {};
		var splitStr = stringToPreprocess.split(" ");
		var processedStr = [];
		for (var i = 0; i < splitStr.length; i++) {
			if (VL.lang_key[mic.mkt].contactIgnoreWords.indexOf(splitStr[i]) === -1) {
				processedStr.push(splitStr[i]);
			}
		}
		stringToPreprocess = processedStr.join(" ");
		stringToPreprocess = stringToPreprocess.trim();
		if(!stringToPreprocess || stringToPreprocess.length==0){
			response = {command:"all",query:''};	
		}
		else if((stringToPreprocess.indexOf('open') >= 0) || (stringToPreprocess.indexOf('kholo') >= 0)){ 
			response = {command:"open",query:""};
		} else {
			console.log(stringToPreprocess,'----preprocess-sms-string----') 
			response = {command:"SMS",query:stringToPreprocess};
		}
		return response;
	},

	getSMSText : function (contactList, smsTxt, resolvedQuery, lang){
		var mic = document.getElementsByTagName('google-mic')[0];
		var response = {
				name: {},
				msg: []
			},
			number = '',
			self = this,
			regex = new RegExp(/(?=(\d{5}))/g),
			isNotFound = true,
			smsTxtTrimmed = smsTxt.replace(/ /g,''),
			resolvedQueryTrimmed = resolvedQuery.replace(/ /g,''),
			splitStr = smsTxt.split(" "),
			allContacts = [];
			resolvedQueryArr = resolvedQuery.split(" ");
			if(resolvedQueryTrimmed.match(regex) && lang != "en-IN"){
				number = resolvedQueryTrimmed.match(/\d{5,}/)[0];
				isNotFound = false;
				document.getElementById('sms-text').value = resolvedQuery.replace(/\d{1,}/g,'').trim();
				console.log('replaced text locale'+ ' - ' + resolvedQueryTrimmed.trim(),'number '+ ' - ' + number)
			}
			else if(smsTxtTrimmed.match(regex)){
				number = smsTxtTrimmed.match(/\d{5,}/)[0];
				isNotFound = false;
				document.getElementById('sms-text').value = smsTxt.replace(/\d{1,}/g,'').trim();
				console.log('replaced text '+ ' - ' + smsTxtTrimmed.trim(),'number '+ ' - ' + number)
			}
			else{
				for(var i = 0; i<=contactList.length; i++){
					if(contactList[i])
					{
						if(contactList[i].fname.split(" ").length > 1){
							var fnameArr = contactList[i].fname.toLowerCase().split(" ");
							allContacts = allContacts.concat(fnameArr);
						}
						else{
							allContacts.push(contactList[i].fname.toLowerCase());
						}
						allContacts.push(contactList[i].lname.toLowerCase());
					}
				}
	
			for(var i = 0;i<=splitStr.length; i++){
				if(splitStr[i]){
					if(allContacts.indexOf(splitStr[i].toLowerCase()) >= 0) {
						isNotFound = false;
						self.getFullTextSearch(contactList, splitStr[i], resolvedQuery, self.isContactFound,mic,'SMS')
					}
					else if(resolvedQueryArr[i] && (allContacts.indexOf(resolvedQueryArr[i].toLowerCase()) >= 0) && (lang == "hi-IN")) {
						isNotFound = false;
						self.getFullTextSearch(contactList, resolvedQueryArr[i], resolvedQuery, self.isContactFound,mic,'SMS')
					}
					else{
						if(lang != "en-IN"){
							response.msg.push(resolvedQueryArr[i])
						}
						else{
							response.msg.push(splitStr[i]);
						}
						
					}
					}
				}
				response.msg = response.msg.join(" ");
				document.getElementById('sms-text').value = response.msg;
			}
			if(!isNotFound)
			{self.setMessageInput = true;}
			else{
				var audio_en = new Audio('../audio/couldntfindcontact.mp3');
				var audio_hi = new Audio('../audio/samparknahimila.mp3');
				if(mic.mkt == "en-IN"){
					audio_en.play();
				}else if(mic.mkt == "hi-IN"){
					audio_hi.play();
				}
				mic.img.src = mic.imgSrcs.contactNotFound;
				mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['didnt_find_contact']);
				if(VL.pushToTalk){
					mic.setAttribute('secondary-text', VL.mic_key[mic.mkt]['push_talk']);
				}
				else{
					mic.setAttribute('secondary-text', VL.mic_key[mic.mkt]['activate_voice']);
				}
				self.setMessageInput = false;
				self.isContactFoundMultipleMsg = false;
				self.isContactList = false;
				mic.isSMSRecording = false;
				mic.isErrorScreen = true;
				document.getElementById("menu-options").style.display="block";
				//analytics not found contact
				ST.sendAnalyticsError("contact_not_found");
			}
			if(number.length > 1){
				self.mesageNumber(number)
			}
	},

	mesageNumber: function mesageNumber(contact){
		var mic = document.getElementsByTagName('google-mic')[0];
		document.getElementById('send-sms').style.display = "block";
		document.getElementById('to-sms').innerHTML = "";
		document.getElementById('phone-number').innerHTML = '('+contact+')';
		document.getElementById('mic-holder').style.display = "none";
		document.getElementById('msg_not_recorded').style.display = "none";
		document.getElementById("menu-options").style.display="none";
		document.getElementById('sms-text').focus();
		document.getElementById("small-mic-msg").style.display = "block";
		self.setMessageInput = false;
		self.isContactFoundMultipleMsg = false;
		self.isContactList = false;
		mic.isSMSRecording = true;
	},

	isContactFound: function isContactFound(contact){
		if(contact.length > 0){
			var mic = document.getElementsByTagName('google-mic')[0];
			document.getElementById("small-mic-holder").style.display="none";
			document.getElementById("view-contacts").style.display="none";
			document.getElementById('mic-holder').style.display = "none";
			document.getElementById('msg_not_recorded').style.display = "none";
			document.getElementById("menu-options").style.display="none";
			document.getElementById('send-sms').style.display = "block";
			document.getElementById('to-sms').innerHTML = contact[0].fname;
			document.getElementById('phone-number').innerHTML = '('+contact[0].mobile+')';
			document.getElementById("small-mic-msg").style.display = "block";
			document.getElementById('sms-text').focus();
			mic.isSMSRecording = true;
		}
	},

	isContactFoundMultiple: function isContactFoundMultiple(){
		var self = this;
		var mic = document.getElementsByTagName('google-mic')[0];
		 document.getElementById("nav-page").style.display="none";
		 document.getElementById("menu-options").style.display="none";
		 document.getElementById("small-mic-holder").style.display="none";
		 document.getElementById("view-contacts").style.display="none";
		 document.getElementById('msg_not_recorded').style.display = "none";
		document.getElementById('send-sms').style.display = "block";
		document.getElementById('to-sms').innerHTML = document.querySelectorAll(".active-contact .contact-list-name")[0].textContent;
		document.getElementById('phone-number').innerHTML = '('+document.querySelectorAll(".active-contact .contact-list-mobile")[0].textContent+')';
		document.getElementById('mic-holder').style.display = "none";
		document.getElementById('sms-text').style.display = "block";
		document.getElementById("small-mic-msg").style.display = "block";
		document.getElementById('sms-text').focus();
		mic.isSMSRecording = true;
		self.isContactFoundMultipleMsg = true;
	},

	sendSMS: function sendSMS(number, message) {
		var self = this;
		var mic = document.getElementsByTagName('google-mic')[0];
		navigator.mozMobileMessage.send(number, message);
		document.getElementById('send-sms').style.display = "none";
		document.getElementById("small-mic-msg").style.display = "none";
		document.getElementById('to-sms').innerHTML = "";
		document.getElementById('phone-number').innerHTML = "";
		document.getElementById('sms-text').value = "";
		document.getElementById('msg-sent').style.display = "block";
		self.setMessageInput = false;
		self.isContactFoundMultipleMsg = false;
		self.isContactList = false;
		mic.isSMSRecording = false;
		mic.isProcessing = false;
	},

	dialNumber : function (num){
		var mic = document.getElementsByTagName('google-mic')[0];
		var audio_en = new Audio('../audio/placingcall.mp3');
		var audio_hi = new Audio('../audio/calllagaya.mp3');
		
		if(mic.mkt == "en-IN"){
			audio_en.play();
		}else if(mic.mkt == "hi-IN"){
			audio_hi.play();
		}

		if(mic.mkt == "en-IN" || mic.mkt == "hi-IN"){
			audio_en.addEventListener("ended", function(){
				navigator.mozTelephony.dial(num);
			});
			audio_hi.addEventListener("ended", function(){
				navigator.mozTelephony.dial(num);
			});
		}
		else{
			navigator.mozTelephony.dial(num);
		}
		
		mic.setAttribute('secondary-text', '');
		this.isContactList = false;
		setTimeout(function(){
			if(VL.pushToTalk){
				mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['push_talk']);
			}
			else{
				mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['activate_voice']);
			}
			document.getElementById("view-contacts").style.display="none";
			document.getElementById('small-mic-holder').style.display="none";
			document.getElementById('mic-holder').style.display="block";
			document.getElementById("menu-options").style.display="block";
			document.getElementById('nav-page').style.display="block";
		},4000)
	}
};