(function () {
	var Contacts = window.FxContactMgr.API.Contacts;
	var allContactList;
	Contacts.loadAllContacts(function(a){allContactList = a;})

	var viewInFocus = null;
	var domElems = getDOMElements();
	var mic = document.getElementsByTagName('google-mic')[0];
	mic.setAttribute('mkt',VL.locale);
	var isTalkBack = false;
	var isLangSet = false;
	var isLangScreen = false;
	var notHomeScreen = false;
	var msgRecordInterval = 0;
	var isHelpOpen = false;
	var isNavOpen = false;
	var isKeyPressed = false;
	var audio;
	var isAudiofirst = true;
	var isFeedbackTextBox = true;
	var customvoiceinput = false;
	var navigateFrom = "Home";
	var isReactiveFeedback = false;
	var custominput = false;	
	
	window.addEventListener('DOMContentLoaded', function(e) {
		renderLocales();	//render the locale section
		renderFaq();	//render the faq section
		renderRatingOptions();	//render the rating option list
		
		if(navigator.userAgent.includes('Android')){
			VL.talkBackClassNames = VL.talkBackClassNamesAgent["Android"];
		}
		else{
			VL.talkBackClassNames = VL.talkBackClassNamesAgent["Gecko"];
		} // set classnames of google search page - for talkback, responsiveVoice
		
		setTimeout(function(){
			navigator.mozL10n.ctx.requestLocales(VL.locale);	// set the application language in the saved locale
		},300);
		
		recordingStart();
		document.getElementById('feedback-text').addEventListener("keypress",function(e) {
			if(e.keyCode == 13){
				e.preventDefault();
			}
		})
		document.getElementById('fedback-rating-text').addEventListener("input",function(e) {
			if(e.keyCode != 13 && e.key != "SoftLeft" && e.key != "SoftRight"){
				custominput = true;
			}
		})
		document.getElementById('feedback-text').addEventListener("input",function(e) {
			if(e.keyCode != 13 && e.key != "SoftLeft" && e.key != "SoftRight"){
				custominput = true;
			}
		})
		
		document.getElementById('sms-text').addEventListener("keydown",function(e) {
			if(e.keyCode == "13"){
				var keyDownAt = new Date();
				setTimeout(function() {
					if (+keyDownAt > +msgRecordInterval)
					{
						document.getElementById("small-mic-msg").style.display="none";
						var str= document.getElementById("sms-text").value;
						var position = document.getElementById('sms-text').selectionStart-1;

						str = str.substr(0, position) + '' + str.substr(position + 1);
						document.getElementById("sms-text").value=str;
						toggleMic(mic);
					}
				}, 2000);
			}
		});
		document.getElementById('sms-text').addEventListener("keyup",function(e) {
			if(e.keyCode == "13"){
				msgRecordInterval = new Date();
			}
		});

		document.getElementById('sms-text').addEventListener("input",function(e) {
			document.getElementById('msg_not_recorded').style.display = "none";
			if(this.value.length == 0){
				document.getElementById('send-sms-btn').style.display = "none";
			}
			else{
				document.getElementById('send-sms-btn').style.display = "block";
			}
		}); // long press for sms double recording

		document.addEventListener('keyup', function(e) {
			if(e.key === 'Enter' && mic.isRecording && !mic.isProcessing && VL.pushToTalk && navigator.onLine)
			{
				document.getElementById('nav-page').style.display = "none";
				setTimeout(function(){
					mic.endRecording();
				},300)
			}
		});	// for press center key and hold experience

		document.addEventListener('keydown',function(e){
			if(e.key == "Backspace"){
				if(!notHomeScreen)
				{
					window.close();
				}
				else{
					backToHome();
					e.preventDefault();
				}
			}
		});	// prevent the app from getting closed on BackSpace key press in the first time
		
		
		document.addEventListener('keypress', function(e) {
				window.resumeState();
				isKeyPressed = true;
				//if(!ST.listening){return}
				if(e.key === 'Enter' && !Contacts.isContactList && !Contacts.setMessageInput && !Contacts.isContactFoundMultipleMsg  && !isLangScreen && (!isReactiveFeedback || mic.isFeedbackComment) && (!mic.isMenuOpen || mic.isFeedback) && isFeedbackTextBox && navigator.onLine){
					// to start/stop mic recording
					if(mic.isRetryFlag){
						mic.isRetry = true;
						mic.isProcessing=false;
						ST.sendDataToAnalytics({ "eventName": "retry_tap" }, "event");					
					}
					toggleMic(mic);
				} else if(e.key === 'Enter' && !Contacts.isContactList && !Contacts.setMessageInput && !Contacts.isContactFoundMultipleMsg  && !isLangScreen && (!isReactiveFeedback || mic.isFeedbackComment) && (!mic.isMenuOpen || mic.isFeedback) && navigator.onLine && !isFeedbackTextBox){
					if(document.querySelectorAll(".rating-options-list li.active")[0].children[0].children[0].checked){
						document.querySelectorAll(".rating-options-list li.active")[0].children[0].children[0].checked= false
					}
					else{
						document.querySelectorAll(".rating-options-list li.active")[0].children[0].children[0].checked = true;
					}
				}else if(e.key === 'Enter' && !Contacts.isContactList && !Contacts.setMessageInput && !Contacts.isContactFoundMultipleMsg  && !isLangScreen && mic.isMenuOpen){
					// open the menu options
					var selOption = document.querySelectorAll("#menu-list li.active span")[0].getAttribute('id');
					// console.log("sel.. ",selOption)
					if(selOption == "menu-guide"){
						document.getElementById('menu-page').style.display = "none";
						displayHelp('menu');
					}else if(selOption == "faq"){
						displayNone("menu-page","mic-holder","suggest-options","nav-page","menu-options","back-btn");
						notHomeScreen = false;
						mic.isMenuOpen = true;
						isLangSet = false;
						document.getElementById('faq_page').style.display = "block";
						ST.sendDataToAnalytics({ "eventName": "FAQ_Tap" }, "event");
					}else if(selOption == "feedback"){
						if(navigator.onLine){
							displayNone("menu-page","mic-holder","suggest-options","nav-page","menu-options","back-btn");
							notHomeScreen = false;
							mic.isMenuOpen = true;
							isLangSet = false;
							mic.isFeedback = true;
							navigateFrom = "proactive_feedback";
							document.getElementById('small-mic-feedback').style.display = "block";
							document.getElementById('send-feedback').style.display = "block";
							document.getElementById('feedback-text').focus();
						}
					}
					else return;
				}else if(e.key === 'Enter' && Contacts.isContactList && Contacts.setMessageInput && !Contacts.isContactFoundMultipleMsg && !isLangScreen && !mic.isMenuOpen){
					// mulltiple contacts found while sending message
					Contacts.isContactFoundMultiple()
				}else if(e.key=="Enter" && Contacts.isContactList && !Contacts.setMessageInput  && !isLangScreen && !mic.isMenuOpen){
					// select and dial the contact in case multiple contacts in displayed
					Contacts.dialSelectedContact();
				}else if(e.key== "Enter" && !Contacts.isContactList && !Contacts.setMessageInput && isLangScreen && !mic.isMenuOpen){
					// change and save the new locale for the application
					var prevLocale = mic.mkt;
					var localeSet = document.querySelectorAll(".locales_list li.active")[0].getAttribute('lang-str');
					// console.log("Locale ", localeSet)
					ST.sendDataToAnalytics({ "eventName": "Language_select", "pro": { "previous_page": navigateFrom }}, "event");
					var sel_radio = document.getElementsByName('locale');
					for(var i=0;i<sel_radio.length;i++){
						sel_radio[i].removeAttribute("checked");
					}	
					document.querySelectorAll('.locales_list li.active')[0].getElementsByTagName('input')[0].setAttribute('checked',true);
					mic.isProcessing = false;
					isHelpOpen = false;
					isNavOpen = false;
					notHomeScreen = false;
					mic.setAttribute('mkt',localeSet);
					VL.locale = localeSet;
					localStorage.setItem('locale',localeSet);
					navigator.mozL10n.ctx.requestLocales(localeSet);
					for(var key in VL.mic_key[prevLocale]) {
						if(VL.mic_key[prevLocale][key][0] ===  mic.getAttribute('primary-text')) {
							mic.setAttribute('primary-text', VL.mic_key[mic.mkt][key]);
						}
						if(VL.mic_key[prevLocale][key][0] ===  mic.getAttribute('secondary-text')) {
							mic.setAttribute('secondary-text', VL.mic_key[mic.mkt][key]);
						}
					}
					setTimeout(function(){
						renderFaq();
						toggleLanguage('view-locales');
						document.getElementById('menu-options').style.display = "block";
						document.getElementById('suggest-options').style.display = "none";
						if(!navigator.onLine){
							document.getElementById('no-internet-page').style.display = "block";
							mic.setAttribute('secondary-text','');
							mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['check_internet']);
						}
						else{
							mic.setAttribute('secondary-text', '');
							setMicText('primary-text');
							document.getElementById('nav-page').style.display = "block";
							//document.getElementById('mic-holder').style.display = "block";
							NavigationManager.showView();
							viewInFocus = NavigationManager;
							isKeyPressed = false;
							recordingStart();
						}
						mic.img.src = navigator.onLine ? mic.imgSrcs.standBy : mic.imgSrcs.noInternet;
						document.getElementById('mic-holder').style.display = "block";
					},500)
				}else if(e.key === 'SoftLeft' && Contacts.setMessageInput && !isLangScreen && !mic.isProcessing && !mic.isRecording && !mic.isFeedback && !isReactiveFeedback){
					// send message
					if(mic.mkt == "en-IN")
					{
						playAudio('../audio/sendingmessage.mp3');
					}
					else if(mic.mkt == "hi-IN"){
						playAudio('../audio/smsbheja.mp3')
					}
					sendingSMS();
				}else if(e.key === 'SoftLeft' && !Contacts.setMessageInput && !isLangScreen && !mic.isProcessing && !mic.isRecording && !isReactiveFeedback && mic.isFeedback && !mic.isFeedbackComment){
					sendFeedback()
					//sendFeedback();
				}else if(e.key === 'SoftLeft' && !Contacts.setMessageInput && !isLangScreen && !mic.isProcessing && !mic.isRecording && isReactiveFeedback && mic.isFeedbackComment && !mic.isFeedback){
					// submit feedback
					sendComments("comment");
				}else if(e.key === 'SoftLeft' && !Contacts.setMessageInput && !isLangScreen && !mic.isProcessing && !mic.isRecording && !mic.isFeedback && isReactiveFeedback && !mic.isFeedbackComment){
					// submit rating
					ST.sendDataToAnalytics({ "eventName": "quantitative_feedback", "pro": { }}, "event");
					submitRating();
				}else if(e.key === 'SoftLeft' && mic.isRecording && !mic.isProcessing && !Contacts.setMessageInput && !mic.isFeedback && !VL.pushToTalk && !mic.isFeedback && !isReactiveFeedback){
					// cancel the recording
					mic.isCancelled = true;
					mic.recordingNotDone('cancel');
					backToHome();
				}else if(e.key === 'SoftLeft' && !mic.isMenu && !mic.isRecording && !mic.isProcessing  && !Contacts.isContactList && !isLangScreen && !mic.isMenuOpen && !mic.isFeedback && !isReactiveFeedback){
					// open the menu options
					// console.log("Menu Tap")
					ST.sendDataToAnalytics({ "eventName": "Menu_Tap", "pro": { "previous_page": navigateFrom}}, "event");
					mic.isMenuOpen = true;
					isLangSet = true;
					displayNone("nav-page","suggest-options","mic-holder","menu-options","cancel-btn","no-internet-page");
					document.getElementById('app-ver').innerHTML = 'v'+ST.analyticsData.avn;
					document.getElementById("menu-page").style.display="block";
					document.getElementById('back-btn').style.display = "table";
					
					notHomeScreen = true;
				} else if ((e.key === 'SoftRight' || e.key === 'Backspace') && (!isLangSet || mic.isMenuOpen) && (!mic.isProcessing || Contacts.setMessageInput || isReactiveFeedback) && (notHomeScreen || mic.isMenuOpen) && (!isNavOpen || !isHelpOpen || isLangScreen)) {
					// back to home screen
					// console.log("SoftRight...Back ")	
					backToHome();
				} else if (e.key === 'SoftRight' && !mic.isRecording && !mic.isProcessing && !Contacts.isContactList && !Contacts.setMessageInput && !mic.isFeedback) {
					// back to home screen from language list
					// console.log("SoftRight... ")
					isLangSet = false;
					isLangScreen = false;
					mic.isErrorScreen = false;
					toggleLanguage('view-locales');
					displayNone("nav-page","suggest-options","menu-options","cancel-btn","no-internet-page","menu-page");
					window.scrollTo(0,document.querySelectorAll('#locales-list li.active')[0].offsetTop-40);
					mic.isMenuOpen = false;
					ST.sendDataToAnalytics({ "eventName": "language_tap", "pro": { "previous_page": navigateFrom }}, "event");
				} else if((e.key=="0" || e.key=="ArrowLeft" || e.key =="Backspace" || e.key=="ArrowRight" || e.key === 'SoftRight' || e.key === 'SoftLeft') && !Contacts.setMessageInput && !isReactiveFeedback){
				 	e.preventDefault();
				} else if((e.key=="ArrowDown" || e.key=="ArrowUp") && Contacts.isContactList && !mic.isMenuOpen && !isReactiveFeedback){
					Contacts.focusContactList(e.key);	// scroll through multiple contacts when displayed in a list
				} else if((e.key=="ArrowDown" || e.key == "ArrowUp") && isLangScreen && !mic.isMenuOpen && !isReactiveFeedback){
					focusLocaleList(e.key,e);	// scroll through language options
				} else if((e.key=="ArrowDown" || e.key=="ArrowUp") && mic.isMenuOpen && !mic.isFeedback && !isReactiveFeedback){
					focusSuggestionList(e.key,'#menu-list li.active');	// scroll through the menu section
				} else if((e.key=="ArrowDown" || e.key=="ArrowUp") && (isHelpOpen || isNavOpen) && !isReactiveFeedback){
					focusSuggestionList(e.key,'.suggest-options-list li.active'); // scroll through the help section
				} else if((e.key=="ArrowDown" || e.key=="ArrowUp") && !(isHelpOpen || isNavOpen) && isReactiveFeedback){
					isFeedbackTextBox = false;
					focusSuggestionList(e.key,'.rating-options-list li.active'); // scroll through the help section
				} else if((e.key=="ArrowUp" || e.key == "ArrowDown") && (!notHomeScreen || !isLangScreen) && !Contacts.setMessageInput && !mic.isFeedback && !mic.isRecording && !mic.isProcessing && !isReactiveFeedback && navigator.onLine && !mic.isErrorScreen){
					displayNone("nav-page","mic-holder");
					isNavOpen = true;
					displayHelp('scroll-menu');
					document.getElementById('nav-mic').style.display= "block";
					document.getElementById("menu-options").style.display="block";
					mic.setAttribute('secondary-text', '');
					setMicText('primary-text');	// open extended view of the guide
				} else if((e.key == "ArrowRight" || e.key == "ArrowLeft") && isReactiveFeedback){
					focusRating(e.key,e); // scroll through the help section
				} else if(e.key == "Backspace" && !notHomeScreen){
					window.close();
				} else {
					if(!Contacts.setMessageInput && !mic.isRecording && !mic.isProcessing && navigator.onLine && !mic.isErrorScreen && !mic.isFeedback)
					{
						setMicText('primary-text');
						viewInFocus = NavigationManager;
						viewInFocus = viewInFocus.onEvent(e);
						e.preventDefault();
					}
				}
		});

		mic.addEventListener('click', function(e) {
			toggleMic(mic);
		});

		mic.addEventListener('recordingstarted', function(e) {
			Contacts.isContactList=false;
			hideAllViews('.help-view');
			mic.setAttribute('secondary-text', '');
			mic.setAttribute('mode', '');
		});

		// window.addEventListener('recordingNow', function(e) {
		// 	console.log('this is now in window listener for recording speech')
		// });

		mic.addEventListener('recordingended', function(e) {
			console.log('recordingended', e);
			console.debug('sst-initiate', Date.now());
			mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['processing']);
			mic.setAttribute('secondary-text', '');
			ST.sendDataToAnalytics({ "eventName": "query_processing_started" }, "event");			
		});

		mic.addEventListener('queryprocessed', function(e) {
			console.log('queryprocessed', e)
			console.debug('qu-received', Date.now());
			document.getElementById('cancel-btn').style.display = "none";
			mic.img.src = navigator.onLine ? mic.imgSrcs.standBy : mic.imgSrcs.noInternet;
			mic.setAttribute('primary-text', '');
			mic.isProcessing = false;
			customvoiceinput = false;
			executeIntentAction(e.detail, mic.mkt);
			e = null;
		});

		mic.addEventListener('queryprocessingerror', function(e) {
			console.log('queryprocessingerror', e)

			console.debug('sst-error', Date.now(), e);
			document.getElementById('cancel-btn').style.display = "none";
			document.getElementById('small-mic-retry').style.display = "none";
			if(!mic.isCancelled){
				mic.img.src = navigator.onLine ? mic.imgSrcs.didntCatch : mic.imgSrcs.noInternet;
				mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['didnt_catch']);
				setMicText('secondary-text');
				document.getElementById("menu-options").style.display="block";
			}
			mic.isProcessing = false;
			customvoiceinput = false;
			Contacts.setMessageInput = false;
			Contacts.isContactFoundMultipleMsg = false;
			Contacts.isContactList = false;
			mic.isSMSRecording = false;
			mic.isFeedback = false;
			mic.isErrorScreen = true;
			e = null;
			navigateFrom = "Sorry_didnt_catch";
			//analytics error B
			ST.sendAnalyticsError("didnt_get");
		});

		mic.addEventListener('networkprocessingerror', function(e) {
			console.log('networkprocessingerror', e)
			console.debug('sst-error', Date.now(), e);
			displayNone('cancel-btn','small-mic-retry');
			// document.getElementById('cancel-btn').style.display = "none";
			// document.getElementById('small-mic-retry').style.display = "none";
			if(!mic.isCancelled){
				mic.img.src = mic.imgSrcs.noInternet;
				mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['low_network']);
				setMicText('secondary-text');
				document.getElementById("menu-options").style.display="block";
			}
			mic.isProcessing = false;
			Contacts.setMessageInput = false;
			Contacts.isContactFoundMultipleMsg = false;
			Contacts.isContactList = false;
			mic.isSMSRecording = false;
			mic.isFeedback = false;
			mic.isErrorScreen = true;
			e = null;
			navigateFrom = "Sorry_didnt_catch";
			//analytics error B
			ST.sendAnalyticsError("didnt_get");
		});

		window.addEventListener("focus",function(){
			if(isTalkBack)
			{
				responsiveVoice.cancel();	// end talkack when back is pressed
			}
		});

		mic.addEventListener('focus', function(e) {
			domElems.smallMic.style.display = 'none';
		});

		NavigationManager.render();
		viewInFocus = NavigationManager;

	});

function autoRecord(mic){
	Contacts.isContactList=false;
	document.getElementById("menu-options").style.display="none";
    document.getElementById('nav-page').style.display="none";
	mic.startRecording();
	hideAllViews('.help-view');
	mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['listening']);
	mic.setAttribute('secondary-text', '')
}

function backToHome(){
	console.log(isReactiveFeedback,"-------isReactiveFeedback value here--------")
	if(navigateFrom == "proactive_feedback"){
		ST.sendDataToAnalytics({ "eventName": "proactive_feedback"+"_back", "pro": { }}, "event");
	}
	if(isReactiveFeedback && mic.isFeedbackComment){
		sendComments("skip");
		ST.sendDataToAnalytics({ "eventName": navigateFrom + "_skip", "pro": { }}, "event");
	}
	if(isReactiveFeedback && !mic.isFeedbackComment){
		localStorage.removeItem("showFeedback")
		callCancelFeedbackApi();
		ST.sendDataToAnalytics({ "eventName": "quantitative_feedback_cancel", "pro": { }}, "event");
	}
	mic.setAttribute('secondary-text', '');
	if(navigator.onLine){
		setMicText('primary-text');
	}else{
		mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['check_internet']);
	}
	hideAllViews('.not-home-screen');
	Contacts.isContactList=false;
	Contacts.setMessageInput = false;
	Contacts.isContactFoundMultipleMsg = false;
	Contacts.isContactList = false;

	notHomeScreen = false;
	isFeedbackTextBox = true;
	isReactiveFeedback = false;
	isHelpOpen = false;
	isLangScreen = false;
	isNavOpen = false;	
	mic.isSMSRecording = false;
	mic.isFeedback = false;
	mic.isErrorScreen = false;
	mic.isMenuOpen = false;
	mic.isProcessing = false;
	mic.isRecording = false;
	mic.isFeedbackComment = false;
	
	navigateFrom = "Home";	
	displayNone("send-sms","send-feedback","to-sms","phone-number","small-mic-msg","small-mic-feedback","suggest-options","faq_page","reactive-feedback-container");
	document.getElementById("mic-holder").style.display="block";
	document.getElementById("menu-options").style.display="block";
	mic.img.src = navigator.onLine ? mic.imgSrcs.standBy : mic.imgSrcs.noInternet;
	if(!navigator.onLine){
		document.getElementById('no-internet-page').style.display = 'block';
	}
	else{
		document.getElementById('nav-page').style.display="block";
		NavigationManager.showView();
		viewInFocus = NavigationManager;
	}
	document.querySelectorAll('.suggest-options-list li.active')[0].classList.remove('active');
	document.querySelectorAll('.suggest-options-list li')[0].classList.add('active');
}

function sendingSMS(){
	var number = document.getElementById('phone-number').innerHTML;
	var msg = document.getElementById('sms-text').value;
	Contacts.sendSMS(number,msg);
	notHomeScreen = false;
	setTimeout(function(){
		document.getElementById('msg-sent').style.display = "none";
		document.getElementById('mic-holder').style.display = "block";
		document.getElementById("menu-options").style.display="block";
		document.getElementById('nav-page').style.display="block";
		mic.setAttribute('secondary-text', '');
		mic.img.src = mic.imgSrcs.standBy;
		setMicText('primary-text');
		NavigationManager.showView();
		viewInFocus = NavigationManager;
	},1500)
}

function callCancelFeedbackApi(){
	var data = JSON.stringify({
		"crmid": ST.analyticsData.crmid
	});
	var request = new XMLHttpRequest({ mozSystem: true });
	var url = "https://feedbacktest.jio.ril.com/feedback/cancelfeedback";
	request.onreadystatechange = function(e) {
		if (request.readyState !== 4) {
			return;
		}
		if(request.status === 200){
			console.log(this.responseText)
			backToHome();
		}
	}
	request.open('POST', url, true);
	request.setRequestHeader("Content-Type", "application/json");
	request.setRequestHeader("appversion", ST.analyticsData.avn);
    request.setRequestHeader("appkey", ST.analyticsData.akey);
    request.send(data);

}

function callFeedBackApi(type,msg,rating){
	var params = {
		"crmid": ST.analyticsData.crmid,
		"timestamp":Date.now().toString(),
		"message":msg,
		"rating":rating,
		"eventid":type,
		"custominput":custominput,
		"voiceinput":customvoiceinput
	}
	if(msg.length <= 0){
		delete params.message;
	}
	var feedbackURL = 'https://feedbacktest.jio.ril.com/feedback/postfeedback';
	var http = new XMLHttpRequest({ mozSystem: true });
	return new Promise(function(resolve, reject){ 
		http.onreadystatechange = function (e) {
		if (http.readyState == 4 && http.status == 200) {
			resolve(JSON.parse(http.response));
		} else if (http.readyState == 4 && http.status != 200) {
			reject(http.response);
			console.log('error in fedback api')
		}
		
	}
	http.open('POST', feedbackURL, true);
	http.setRequestHeader("appkey", ST.analyticsData.akey);
	http.setRequestHeader("devicemodel", ST.analyticsData.mod);
	http.setRequestHeader("appversion", ST.analyticsData.avn);
	http.setRequestHeader("osversion", ST.analyticsData.osv);
	http.setRequestHeader("sid", ST.analyticsData.sid);	
	http.setRequestHeader("applanguage", mic.mkt);
	http.setRequestHeader("oslanguage", navigator.language);	
	http.setRequestHeader("Content-Type", "application/json");	
	http.send(JSON.stringify(params));	
  });	
}

function sendFeedback(){
	var msg = [];
	msg.push(document.getElementById('feedback-text').value)
	console.log(msg);	
	callFeedBackApi("proactive",msg,0).then(function(response){
		console.log(response);
		notHomeScreen = false;
		mic.isProcessing = false;
		mic.isFeedback = false;
		isFeedbackTextBox = true;
		mic.isMenuOpen = false;
		custominput = false;
		customvoiceinput = false;
		document.getElementById('send-feedback').style.display = "none";
		document.getElementById("small-mic-feedback").style.display = "none";
		document.getElementById('feedback-text').value = "";
		document.getElementById('msg-sent').style.display = "block";
		setTimeout(function(){
			document.getElementById('msg-sent').style.display = "none";
			document.getElementById('mic-holder').style.display = "block";
			document.getElementById("menu-options").style.display="block";
			document.getElementById('nav-page').style.display="block";
			mic.setAttribute('secondary-text', '');
			mic.img.src = mic.imgSrcs.standBy;
			setMicText('primary-text');
			NavigationManager.showView();
			viewInFocus = NavigationManager;
		},1500)
	},function(error){
		console.error(error);
	}); 
}

function sendComments(val){
	//get the rating from previous recording and the textbox input
	var msg = [];
	var ratingVal = document.querySelectorAll('.rating-list li.active a')[0].getAttribute("id")

	if(val != "skip"){
		// push textbox label messages
		var nodelist = document.querySelectorAll(".rating-options-list input")
		for(var item of nodelist){
			if(item.checked){
				msg.push(item.parentNode.textContent);
			}
		}

		if(document.getElementById('fedback-rating-text').value.length > 0){
			msg.push(document.getElementById('fedback-rating-text').value);
		}
	}
	console.log('rating here',ratingVal,"msg here",msg);
	callFeedBackApi("reactive",msg,ratingVal).then(function(response){
		notHomeScreen = false;
		mic.isProcessing = false;
		mic.isFeedback = false;
		mic.isFeedbackComment = false;
		isReactiveFeedback = false;
		isFeedbackTextBox = true;
		custominput = false;
		customvoiceinput = false;
		displayNone('send-feedback','small-mic-feedback','reactive-feedback-container')
		document.getElementById('feedback-text').value = "";
		if(val != "skip"){
			document.getElementById('msg-sent').style.display = "block";
			setTimeout(function(){
				displayNone('msg-sent','back-btn','menu-page');
				document.getElementById('mic-holder').style.display = "block";
				document.getElementById("menu-options").style.display="block";
				document.getElementById('nav-page').style.display="block";
				mic.setAttribute('secondary-text', '');
				mic.img.src = mic.imgSrcs.standBy;
				setMicText('primary-text');
				NavigationManager.showView();
				viewInFocus = NavigationManager;
			},1500)
		}
	},function(error){
		console.error(error);
	});
}

function makeRadioButton(name, value, text) {
    var label = document.createElement("label");
    var radio = document.createElement("input");
    radio.type = "radio";
    radio.name = name;
    radio.value = value;
	radio.classList.add('pull-right')
	label.appendChild(radio);
    label.appendChild(document.createTextNode(text));
    return label;
}

function makeCheckbox(value, text) {
    var label = document.createElement("label");
    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = value;
	checkbox.classList.add('pull-right')
	label.appendChild(checkbox);
    label.appendChild(document.createTextNode(text));
    return label;
}

function recordingStart(){
	mic.focus();
	if(navigator.onLine == false){
		document.getElementById('nav-page').style.display = 'none';
		document.getElementById("menu-options").style.display="block";
		document.getElementById("menu-page").style.display="none";
		mic.img.src = mic.imgSrcs.noInternet;
		mic.setAttribute('secondary-text','');
		mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['check_internet']);
		document.getElementById('no-internet-page').style.display = 'block';
	}
	else{
		if(JSON.parse(VL.isShowFeedback)){
			isReactiveFeedback = true;
			notHomeScreen = true;
			displayNone("menu-options","mic-holder","nav-page");
			document.getElementById('reactive-feedback-container').style.display = "block"
		}
		if(VL.pushToTalk){
			document.getElementById('nav-mic-voice').innerHTML = VL.mic_key[mic.mkt]['push_talk'];
			document.getElementById('retry-msg').innerHTML = VL.mic_key[mic.mkt]['retry_msg_ptt'];
			mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['push_talk']);
			mic.setAttribute('secondary-text', '');
		}
		else{
			document.getElementById('retry-msg').innerHTML = VL.mic_key[mic.mkt]['retry_msg'];
			document.getElementById('nav-mic-voice').innerHTML = VL.mic_key[mic.mkt]['activate_voice'];
			console.log(isKeyPressed,'key pressed');
			mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['activate_voice']);
			mic.setAttribute('secondary-text', '');
		}
		document.getElementById('msg_not_recorded_error').innerHTML = VL.mic_key[mic.mkt]['didnt_catch'];
		document.getElementById('record-msg').innerHTML = VL.mic_key[mic.mkt]['press_to_record_msg'];
		document.getElementById('record-feedback').innerHTML = VL.mic_key[mic.mkt]['press_to_record_feedback'];
		document.getElementById('retry-msg').innerHTML = document.getElementById('retry-msg').innerHTML.replace(new RegExp(VL.micIconText.join('|'), 'g'),"<img class='mic-icon' src='../../images/icons/voice.png' />")
		document.getElementById('nav-mic-voice').innerHTML = document.getElementById('nav-mic-voice').innerHTML.replace(new RegExp(VL.micIconText.join('|'), 'g'),"<img class='mic-icon' src='../../images/icons/voice.png' />")
		document.getElementById('record-msg').innerHTML = document.getElementById('record-msg').innerHTML.replace(new RegExp(VL.micIconText.join('|'), 'g'),"<img class='mic-icon' src='../../images/icons/voice.png' />")
		document.getElementById('record-feedback').innerHTML = document.getElementById('record-feedback').innerHTML.replace(new RegExp(VL.micIconText.join('|'), 'g'),"<img class='mic-icon' src='../../images/icons/voice.png' />")
	}
}

function renderLocales(){
	var locale_ul = document.getElementById('locales-list');
	for(var i=0;i<VL.locales.length;i++){
		var locale_li = document.createElement('li');
		locale_li.classList.add('locale_li')
		if(VL.locales[i]["lang_str"] == VL.locale){
			locale_li.classList.add('active')
		}
		locale_li.setAttribute('lang-str',VL.locales[i]["lang_str"]);
		
		var radio_btn = makeRadioButton('locale',VL.locales[i]["lang_str"],VL.locales[i]["display_name"]);
		locale_li.appendChild(radio_btn);
		locale_ul.appendChild(locale_li);
	}
	document.querySelectorAll('.locales_list li.active')[0].getElementsByTagName('input')[0].setAttribute('checked',true);
}

function renderRatingOptions(){
	var rating_option_ul = document.getElementById('rating-option-list');
	for(var i=0;i<VL.feedbackList[mic.mkt].length;i++){
		var rating_option_li = document.createElement('li');
		rating_option_li.classList.add('rating_option_li')
		// if(VL.locales[i]["lang_str"] == VL.locale){
		// 	locale_li.classList.add('active')
		// }
		// locale_li.setAttribute('lang-str',VL.locales[i]["lang_str"]);
		var checkbox_btn = makeCheckbox(false,VL.feedbackList[mic.mkt][i]);
		rating_option_li.appendChild(checkbox_btn);
		rating_option_ul.appendChild(rating_option_li);
	}
	document.querySelectorAll('.rating_option_li')[0].classList.add("active")
	//document.querySelectorAll('.locales_list li.active')[0].getElementsByTagName('input')[0].setAttribute('checked',true);
}

function renderFaq(){
	var faq_ul = document.getElementById('faq-list');
	while( faq_ul.firstChild ){
		faq_ul.removeChild( faq_ul.firstChild );
	}
	for(var i=0;i<VL.faq[mic.mkt].length;i++){
		var faq_li = document.createElement('li');
		faq_li.classList.add('faq_li');
		var faq_title = document.createElement('h5');
		faq_title.innerHTML = VL.faq[mic.mkt][i]["title"];
		var faq_text = document.createElement('div');
		faq_text.innerHTML = VL.faq[mic.mkt][i]["text"]
		faq_li.appendChild(faq_title);
		faq_li.appendChild(faq_text);
		faq_ul.appendChild(faq_li);
	}
}

function executeIntentAction(intent, mkt) {
	switch (intent.action) {
		case 'call': {
			document.getElementById('small-mic-retry').style.display = "none";
			if(intent.resolved_query == 'connection_error'){
				mic.setAttribute('primary-text',VL.mic_key[mic.mkt][intent.Name]);
				setMicText('secondary-text');
				//analytics network error on call
				mic.isErrorScreen = true;
				mic.img.src = mic.imgSrcs.noSim;
				document.getElementById("menu-options").style.display="block";
				ST.sendAnalyticsError(intent.Name);
			}
			else{
				mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['calling']);
				mic.setAttribute('secondary-text', '');
				var splitArr = intent.resolved_query.trim().split(" ")
				if((/^[0-9]+$/).test(splitArr[0]))
				{
					intent.Name = intent.resolved_query.trim().replace(/\s/g,'');
					Contacts.dialNumber(intent.Name);
				}
				else {
					if(intent.Name.includes("emergency")){
						Contacts.dialNumber("112")
					}
					else{
						Contacts.getFullTextSearch(allContactList,intent.Name,intent.resolved_query,function(a){Contacts.dialNumber(a[0].mobile)}, mic,'CALL');
					}
				}

				ST.sendDataToAnalytics({
				"eventName":"action_executed",
				"pro":{
						"application":"Call",
						"content":intent.Name,
						"action":intent.action,
						"content_locale":intent.resolved_query,
						"query_en":intent.query_en,
						"query_locale":intent.query_locale,
						"query_displayed": mic.mkt != 'en-IN' ? intent.query_locale : intent.query_en,
						"tti_engine":intent.ttiEngine
					}
				}, "event");
			}
			break;
		}
		case 'sms': {
			document.getElementById('small-mic-retry').style.display = "none";
			isLangSet = false;
			if(intent.resolved_query == 'connection_error'){
				mic.setAttribute('primary-text',VL.mic_key[mic.mkt][intent.Name]);
				setMicText('secondary-text');
				mic.isErrorScreen = true;
				mic.img.src = mic.imgSrcs.noSim;
				document.getElementById("menu-options").style.display="block";
				//analytics network error on SMS
				ST.sendAnalyticsError(intent.Name);	
			} else{
				Contacts.getSMSText(allContactList,intent.Name,intent.resolved_query,mic.mkt);
				document.getElementById('send-sms-btn').style.display = "block";
				notHomeScreen = true;
				ST.sendDataToAnalytics({
				"eventName":"action_executed",
				"pro":{
						"application":"SMS",
						"content":intent.Name,
						"action":intent.action,
						"content_locale":intent.resolved_query,
						"query_en":intent.query_en,
						"query_locale":intent.query_locale,
						"query_displayed": mic.mkt != 'en-IN' ? intent.query_locale : intent.query_en,
						"tti_engine":intent.ttiEngine
					}
				}, "event");
			}
			break;
		}
		case 'help':{
			document.getElementById('small-mic-retry').style.display = "none";
			displayHelp(intent, '');
			break;
		}
		case 'LANG':{
			isLangSet = false;
			isLangScreen = false;
			mic.isErrorScreen = false;
			toggleLanguage('view-locales');
			displayNone("nav-page","suggest-options","menu-options","cancel-btn","no-internet-page","menu-page","small-mic-retry");
			window.scrollTo(0,document.querySelectorAll('#locales-list li.active')[0].offsetTop-40);
			mic.isMenuOpen = false;
			break;
		}
		case 'open': {
			setTimeout(function(){
				document.getElementById('small-mic-retry').style.display = "none";
			},1000)
			
			
			openApps({name: intent.appName,resolvedQuery:intent.resolved_query});
			
			setTimeout(function(){
				setMicText('primary-text');
				document.getElementById("view-contacts").style.display="none";
				document.getElementById('small-mic-holder').style.display="none";
				document.getElementById('mic-holder').style.display="block";
				document.getElementById("menu-options").style.display="block";
				document.getElementById('nav-page').style.display="block";
			},1000)
			
			ST.sendDataToAnalytics({
				"eventName":"action_executed",
				"pro":{
					"application":intent.appName,
					"content":intent.resolved_query,
					"action":"open",
					"query_en":intent.query_en,
					"query_locale":intent.query_locale,
					"query_displayed": mic.mkt != 'en-IN' ? intent.query_locale : intent.query_en,
					"tti_engine":intent.ttiEngine
                }
            }, "event");

			break;
		}
		case 'namo': {
			ST.sendDataToAnalytics({
                "eventName":"action_executed",
                "pro":{
                    "application":"NAMO",
					"content":intent.resolved_query,
					"action":"open",
					"query_en":intent.query_en,
					"query_locale":intent.query_locale,
					"query_displayed": mic.mkt != 'en-IN' ? intent.query_locale : intent.query_en
                }
            }, "event");

			openNamoApp(intent.resolved_query);
			break;
		}
		case 'wifi':{
			document.getElementById('small-mic-retry').style.display = "none";
			wifiControl(intent);
			break;
		}
		case 'battery':{
			document.getElementById('small-mic-retry').style.display = "none";
			document.getElementById("mic-holder").style.display="none";
			document.getElementById("battery").style.display="block";
			document.getElementById('back-btn').style.display = "table";
			var batteryPerc = Math.round(navigator.battery.level*100)+'%';
			document.getElementById('batteryPercnt').textContent = VL.mic_key[mic.mkt]['battery_perc'] + " " + batteryPerc;
			notHomeScreen = true;
			ST.sendDataToAnalytics({
				"eventName":"action_executed",
				"pro":{
						"content":intent.resolved_query,
						"action":"Open",
						"query_en":intent.query_en,
						"query_locale":intent.query_locale,
						"query_displayed": mic.mkt != 'en-IN' ? intent.query_locale : intent.query_en,
						"tti_engine":intent.ttiEngine
					}
			}, "event");
			break;
		}
        case 'volume':{
			document.getElementById('small-mic-retry').style.display = "none";
			volControl(intent);
			break;
		}
		default: {
			ST.sendDataToAnalytics({
                "eventName":"action_executed",
                "pro":{
                    "application":"Browser",
					"content":intent.resolved_query,
					"action":"open",
					"query_en":intent.query_en,
					"query_locale":intent.query_locale,
					"query_displayed": mic.mkt != 'en-IN' ? intent.query_locale : intent.query_en,
					"tti_engine":intent.ttiEngine
                }
            }, "event");
			doGoogleSearch(intent.resolved_query,'');
			break;
		}
	}
}

function wifiControl(intent){
	var wifi;
	var flag=true;
	for(var i=0;i<VL.wifiControlOff.length;i++){
		if(intent.resolved_query.match(VL.wifiControlOff[i])){
			wifi=false;
			flag=false;
			wifiOnOff(wifi);
			break;
		}
	}

	if(flag){
		for(var i=0;i<VL.lang_key["hi-IN"].launchKeywords.length;i++){
			if(intent.resolved_query.match(VL.lang_key["hi-IN"].launchKeywords[i])){
				wifi=true;
				flag=false;
				wifiOnOff(wifi)
				break;
			}
		}	
	}

	if(flag){
		doGoogleSearch(intent.resolved_query,'');
	}

	ST.sendDataToAnalytics({
	"eventName":"action_executed",
	"pro":{
			"content":intent.resolved_query,
			"action":wifi?"On":"Off",
			"query_en":intent.query_en,
			"query_locale":intent.query_locale,
			"query_displayed": mic.mkt != 'en-IN' ? intent.query_locale : intent.query_en,
			"tti_engine":intent.ttiEngine
		}
	}, "event");
}

function wifiOnOff(flag){
	var lock;
	if(navigator.mozSettings){
		lock = navigator.mozSettings.createLock();
	}else{
		mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['didnt_catch']);
		setMicText('secondary-text');
		return;
	}
	
	var result = lock.set({
	'wifi.enabled': flag
	});
	
	result.onsuccess = function () {
		if(flag){
			mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['wifi_on'])
			setMicText('secondary-text');
		}else{
			mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['wifi_off'])
			setMicText('secondary-text');
		}
	}
	
	result.onerror = function () {
		mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['didnt_catch']);
		setMicText('secondary-text');
	}
}

function volControl(intent) {
	var volumeRequest = '';
	var content = intent.resolved_query.trim();
    for(var i=0;i<VL.volControlUp.length;i++){
        if(content.toLowerCase().match(VL.volControlUp[i].toLowerCase())){
			volumeRequest = "up";
            navigator.volumeManager.requestUp();
            break;
        }
        else if(content.toLowerCase().match(VL.volControlDown[i].toLowerCase())){
            volumeRequest = "down";
			navigator.volumeManager.requestDown();
            break;
        }
        else{
			doGoogleSearch(intent.resolved_query,'');
			return;
			//mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['didnt_catch']);
        }
    }
	ST.sendDataToAnalytics({
		"eventName":"action_executed",
		"pro":{
				"application":"VOLUME",
				"content":content,
				"action":volumeRequest,
				"query_en":intent.query_en,
				"query_locale":intent.query_locale,
				"query_displayed": mic.mkt != 'en-IN' ? intent.query_locale : intent.query_en,
				"tti_engine":intent.ttiEngine
			}
	}, "event");

    setTimeout(function(){
      mic.setAttribute('primary-text','');
	  setMicText('secondary-text');
    },2000)
}

function displayHelp(intent){
	// console.log("intent ",intent);
	document.getElementById("mic-holder").style.display="none";
	document.getElementById('menu-options').style.display="block";
	document.getElementById('back-btn').style.display = "none";
	notHomeScreen = true;
	mic.isMenuOpen = false;
	isLangSet = true;
	
	document.getElementById('suggest-options').style.display = "block";
	document.querySelectorAll('.suggest-options-list li.active')[0].classList.remove('active');
	document.querySelectorAll('.suggest-options-list li')[0].classList.add('active');
	document.getElementById('suggestion-title-menu').style.display = "block";
	document.getElementById('suggestion-title').style.display = "none";
	if(intent != 'menu' && intent != 'scroll-menu'){
		document.getElementById('nav-mic').style.display = "block";
		isNavOpen = true;
	}

	if(intent == 'menu'){
		isHelpOpen = true;
	}
	if(!navigator.onLine){
		document.getElementById('nav-mic').style.display = "none";
	}

	var event_name ="action_executed";
	var helpVoice ="Help";

	if (intent == 'menu') {
		event_name ="Guide_Access";
		navigateFrom = "Menu";
		helpVoice = "";
	} else if(intent ==  "scroll-menu"){
		event_name = "Guide_Access";
		navigateFrom = "Home";
		helpVoice = "";
	} else{
		navigateFrom = "Voice_command";
	}

	 ST.sendDataToAnalytics({
		 "eventName": event_name,
                "pro":{
					"previous_page": navigateFrom,
					"application": helpVoice,
					"content":intent.resolved_query,
					"action": helpVoice,
					"query_en":intent.query_en,
					"query_locale":intent.query_locale,
					"query_displayed": mic.mkt != 'en-IN' ? intent.query_locale : intent.query_en
                }
	}, "event");
}

function openNamoApp(query){
	if(mic.isRecording){return;}
	window.open('http://www.narendramodi.in/mann-ki-baat#0','_blank');
	document.getElementById('small-mic-retry').style.display = "none";
	window.close();
}

function playAudio(file){
	audio = new Audio(file);
	audio.play();
	isAudiofirst = !isAudiofirst;
}

function doGoogleSearch(query, respTime) {
	var splitArray = query.split(' ');
	var processedQuery = [];
	var isImageSearch = false;
	for (var i = 0; i < splitArray.length; i++) {
		if (VL.lang_key[mic.mkt].netSearch.indexOf(splitArray[i]) === -1) {
			processedQuery.push(splitArray[i]);
		}
		if(VL.searchImage.indexOf(splitArray[i]) >= 0){
			isImageSearch = true;
		}
	}
	query = processedQuery.join(" ");
	query = query.trim();
	if(isImageSearch){
		if(mic.mkt === "hi-IN"){
			var url = 'https://www.google.com/search?gs_ivs=1&q='+query+'&hl=hi&tbm=isch&lr=lang_hi';
		}else{
			var url = 'https://www.google.co.in/search?gs_ivs=1&tbm=isch&q='+query;
		}
	}
	else{
		if(mic.mkt === "hi-IN"){
			var url = 'https://www.google.com/search?gs_ivs=1&q='+query+'&hl=hi&lr=lang_hi';
		}else{
			var url = 'https://www.google.co.in/search?gs_ivs=1&q='+query;
		}
	}
	var xhttp = new XMLHttpRequest({mozSystem: true});
	xhttp.onreadystatechange = function() {
	if (this.readyState == 4 && this.status == 200) {
		if(mic.isRecording){return;}
		var parser = new DOMParser();
		window.open(url);
		document.getElementById('small-mic-retry').style.display = "none";
		var htmldoc = parser.parseFromString(this.responseText, 'text/html');
		if(!VL.isHindiTalkBack && mic.mkt == "en-IN")
		{
			if(htmldoc.querySelector(VL.talkBackClassNames["parent"]) != null )	
			{
				isTalkBack = true;
				if(VL.talkBackDescLong == "long"){
					responsiveVoice.speak(htmldoc.querySelector(VL.talkBackClassNames["long_content"]).textContent.split('.')[0])
				}
				else if(VL.talkBackDescLong == "both"){
					responsiveVoice.speak(htmldoc.querySelector(VL.talkBackClassNames["short_content"]).textContent.split('·')[0] + htmldoc.querySelector(VL.talkBackClassNames["long_content"]).textContent.split('.')[0])
				}
				else{
					responsiveVoice.speak(htmldoc.querySelector(VL.talkBackClassNames["short_content"]).textContent.split('·')[0])
				}
			}
			else if(htmldoc.querySelector(VL.talkBackClassNames["definition"]) != null ){
				isTalkBack = true;
				responsiveVoice.speak(htmldoc.querySelector(VL.talkBackClassNames["definition"]).textContent.split('.')[0])
			}
			else{
				if(isAudiofirst)
				{
					if(mic.mkt == "en-IN")
					{
						playAudio('../audio/hereiswhatifound.mp3');
					}
					else if(mic.mkt == "hi-IN"){
						playAudio('../audio/mujheyemila.mp3')
					}
				}
				else{
					if(mic.mkt == "en-IN")
					{
						playAudio('../audio/topresult.mp3');
					}
					else if(mic.mkt == "hi-IN"){
						playAudio('../audio/pehlaparinam.mp3')
					}
				}
			}
		}
		else if(VL.isHindiTalkBack){
			if(htmldoc.querySelector(VL.talkBackClassNames["parent"]) != null )
			{
				isTalkBack = true;
				if(mic.mkt == "hi-IN"){
					if(VL.talkBackDescLong == "long"){
						responsiveVoice.speak(htmldoc.querySelector(VL.talkBackClassNames["long_content"]).textContent.split('.')[0],"Hindi Female")
					}
					else if(VL.talkBackDescLong == "both"){
						responsiveVoice.speak(htmldoc.querySelector(VL.talkBackClassNames["short_content"]).textContent.split('·')[0] + htmldoc.querySelector(VL.talkBackClassNames["long_content"]).textContent.split('.')[0],"Hindi Female")
					}
					else{
						responsiveVoice.speak(htmldoc.querySelector(VL.talkBackClassNames["short_content"]).textContent.split('·')[0],"Hindi Female")
					}
				}
				else{
					if(VL.talkBackDescLong == "long"){
						responsiveVoice.speak(htmldoc.querySelector(VL.talkBackClassNames["long_content"]).textContent.split('.')[0])
					}
					else if(VL.talkBackDescLong == "both"){
						responsiveVoice.speak(htmldoc.querySelector(VL.talkBackClassNames["short_content"]).textContent.split('·')[0] + htmldoc.querySelector(VL.talkBackClassNames["long_content"]).textContent.split('.')[0])
					}
					else{
						responsiveVoice.speak(htmldoc.querySelector(VL.talkBackClassNames["short_content"]).textContent.split('·')[0])
					}
				}
			}
			else if(htmldoc.querySelector(VL.talkBackClassNames["definition"]) != null ){
				isTalkBack = true;
				if(mic.mkt == "hi-IN"){
					responsiveVoice.speak(htmldoc.querySelector(VL.talkBackClassNames["definition"]).textContent.split('.')[0],"Hindi Female")
				}
				else{
					responsiveVoice.speak(htmldoc.querySelector(VL.talkBackClassNames["definition"]).textContent.split('.')[0])
				}
			}
			else{
				if(isAudiofirst)
				{
					if(mic.mkt == "en-IN")
					{
						playAudio('../audio/hereiswhatifound.mp3');
					}
					else if(mic.mkt == "hi-IN"){
						playAudio('../audio/mujheyemila.mp3')
					}
				}
				else{
					if(mic.mkt == "en-IN")
					{
						playAudio('../audio/topresult.mp3');
					}
					else if(mic.mkt == "hi-IN"){
						playAudio('../audio/pehlaparinam.mp3')
					}
				}
			}
		}
		 else{
			 if(isAudiofirst)
				{
					if(mic.mkt == "en-IN")
					{
						playAudio('../audio/hereiswhatifound.mp3');
					}
					else if(mic.mkt == "hi-IN"){
						playAudio('../audio/mujheyemila.mp3')
					}
				}
				else{
					if(mic.mkt == "en-IN")
					{
						playAudio('../audio/topresult.mp3');
					}
					else if(mic.mkt == "hi-IN"){
						playAudio('../audio/pehlaparinam.mp3')
					}
				}
		 }
			setTimeout(function(){
				setMicText('primary-text');
				document.getElementById("view-contacts").style.display="none";
				document.getElementById('small-mic-holder').style.display="none";
				document.getElementById('mic-holder').style.display="block";
				document.getElementById("menu-options").style.display="block";
				document.getElementById('nav-page').style.display="block";
			},2000);
		}
		
	};
	
	xhttp.open("GET", url, true);
	xhttp.send(); 
}

function getDOMElements() {
	var mapping = {
		musicPlayer: '#music-player',
		musicPlayerAudio: '#music-player>audio',
		navPage: '#nav-page-list',
		smallMic: '#small-mic-holder'
	};
	return Object.keys(mapping).reduce(function(a, x) {
		a[x] = document.querySelector(mapping[x]);
		return a;
	}, {});
}

function hideAllViews(className) {
	displayNone("battery","back-btn","small-mic");
	document.getElementById("mic-holder").style.display="block";
	var views = [].slice.call(document.querySelectorAll(className));
	views.forEach(function(x){ x.style.display = 'none'});
}

function displayNone(){
  if(arguments.length > 0)
     for (var a in arguments)
     {
       document.getElementById(arguments[a]).style.display = "none"
     }
}

function toggleMic(mic) {
	if (mic.isRecording) {
		mic.endRecording();
		return;
	}
	if(mic.isProcessing) return;
	isNavOpen = false;
	displayNone("small-mic-msg","small-mic-feedback","small-mic-retry","nav-page","menu-options","reactive-feedback-container");
	mic.setFocus();
	mic.startRecording();
	mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['wait']);
	mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['listening']);
	if(navigateFrom == "proactive_feedback"){
		ST.sendDataToAnalytics({ "eventName": "proactive_feedback"+"_voice_input", "pro": { }}, "event");
		customvoiceinput = true;
	}
	if(navigateFrom.includes("qualitative")){
		ST.sendDataToAnalytics({ "eventName": navigateFrom +"_voice_input", "pro": { }}, "event");
		customvoiceinput = true;
	}
}

function focusSuggestionList(action,ele,e){
	var currEle = document.querySelectorAll(ele);
	if(action=="ArrowDown" && currEle[0] && (currEle[0].nextElementSibling != null)){
		currEle[0].classList.remove('active');
		currEle[0].nextElementSibling.classList.add('active');
	} else if(action=="ArrowDown" && currEle[0] && currEle[0].parentElement.parentElement.nextElementSibling.getAttribute("id") == "fedback-rating-text"){
		currEle[0].classList.remove('active');
		document.getElementById('fedback-rating-text').scrollIntoView();
		document.getElementById('fedback-rating-text').focus();
	} else if(action=="ArrowUp" && document.activeElement.getAttribute("id") == "fedback-rating-text"){
		document.getElementById('fedback-rating-text').blur();
		document.getElementById('fedback-rating-text').scrollIntoView();
		document.querySelectorAll(".rating-options-list li")[document.querySelectorAll(".rating-options-list li").length - 1].classList.add("active")
	} else if(action=="ArrowUp" && currEle[0] && (currEle[0].previousElementSibling != null)){
		currEle[0].classList.remove('active');
		currEle[0].previousElementSibling.classList.add('active');
	}
	if(document.activeElement.getAttribute("id") == "fedback-rating-text"){
		isFeedbackTextBox = true;
	}
}

function focusRating(action,e){
	var currEle = document.querySelectorAll('.rating-list li.active');
	if(action=="ArrowRight" && (currEle[0].nextElementSibling != null)){
		currEle[0].classList.remove('active');
		currEle[0].nextElementSibling.classList.add('active');
	} else if(action=="ArrowLeft" && (currEle[0].previousElementSibling != null)){
		currEle[0].classList.remove('active');
		currEle[0].previousElementSibling.classList.add('active');
	}
}

function submitRating(){
	localStorage.removeItem("showFeedback")
	var ratingVal = document.querySelectorAll('.rating-list li.active a')[0].getAttribute("id")
	console.log('rating here',ratingVal);
	displayNone('quantitative-feedback','back-feedback-btn');
	document.getElementById('qualitative-feedback').style.display = "block";
	document.getElementById('small-mic-feedback').style.display = "block";
	document.getElementById('skip-feedback-btn').style.display = "block";
	mic.isFeedbackComment = true;
	if(ratingVal == "5"){
		document.getElementById('rating5').style.display = "block";
		document.getElementById('fedback-rating-text').focus();
		isFeedbackTextBox = true;
		navigateFrom = "qualitative_5";
	}
	else{
		navigateFrom = "qualitative_321";
		if(ratingVal == "4"){
			document.getElementById('rating_3_msg').style.display = "none";
			document.getElementById('rating_4_msg').style.display = "block";
			navigateFrom = "qualitative_4";
		}
		document.getElementById('rating3').style.display = "block";
		isFeedbackTextBox = false;
	}
}

function focusLocaleList(action,e){
	var currEle = document.querySelectorAll('.locales_list li.active');
	if(action=="ArrowDown" && (currEle[0].nextElementSibling != null)){
		currEle[0].classList.remove('active');
		currEle[0].nextElementSibling.classList.add('active');
		if(currEle[0].offsetTop < 50){
			e.preventDefault();
		}
	} else if(action=="ArrowUp" && (currEle[0].previousElementSibling != null)){
		currEle[0].classList.remove('active');
		currEle[0].previousElementSibling.classList.add('active');
		if(currEle[0].offsetTop > (window.innerHeight - 50)){
			e.preventDefault();
		}
	}
}

function setMicText(val){
	if(VL.pushToTalk){
		mic.setAttribute(val, VL.mic_key[mic.mkt]['push_talk']);
	}
	else{
		mic.setAttribute(val, VL.mic_key[mic.mkt]['activate_voice']);
	}
}

function toggleLanguage(container) {
	var e = document.getElementById(container);
	if(e.style.display == 'block'){
		e.style.display = 'none';
		notHomeScreen = false;
		isLangScreen = false;
	}
    else{
    	isLangScreen = true;
    	e.style.display = 'block';
    	notHomeScreen = true;
    }
}
})();

function setDebugMode(bool) {
	if (bool) {
		console.log = function()  {};
		console.error = function () {};
	}
}

setDebugMode(false);