(function () {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var audioContext = new AudioContext();
    var audioInput = null,
        realAudioInput = null,
        inputPoint = null,
        audioRecorder = null
        mediaRecorder = null;
    var localStream;
    const MicProto = Object.create(HTMLDivElement.prototype);
    // const apiKey = 'AIzaSyAt8FuLEsAfhfbsyc_5ZkR3jtVpYFVLPls';
    //const apiKey = 'AIzaSyAd7Tah0dlq9K7wozaqXFmmb96p5lIjwUo';
    var chunks = [];
    const apiaiKey = 'c51b73e3d5924565a6f5ff37229a3b0e';
    var googleTransURL = 'https://translation.googleapis.com/language/translate/v2?key=';
    MicProto.isSuspend = false;
    window.currentTime = new Date().getTime();
    
    var lang_str = '';
    var isHindiProcessing = false;
    var hindiResultantText = '';
    var speech;
    var app_session_id = '';
    var recording_index = 0;
    var temp_index = 0;
    var isSpeaking = false;
    
    MicProto.timeOut = 8000;
    MicProto.timeOutID = null;
    MicProto.isSMSRecording = false;
    MicProto.isMenuOpen = false;
    MicProto.isLanguageReset = false;
    MicProto.isErrorScreen = false;

    MicProto.createdCallback = function () {
        const shadow = this.createShadowRoot();

        // The mic image
        const img = document.createElement('img');
        img.src = this.imgSrcs.standBy;
        img.className = 'img';
        shadow.appendChild(img);
        this.img = img;

        // The primary text
        const primaryText = document.createElement('div');
        primaryText.innerHTML = this.getAttribute('primary-text');
        primaryText.className = 'primary-text';
        shadow.appendChild(primaryText);
        this.primaryText = primaryText;

        // The secondary text
        const secondaryText = document.createElement('div');
        secondaryText.innerHTML = this.getAttribute('secondary-text');
        secondaryText.className = 'secondary-text';
        shadow.appendChild(secondaryText);
        this.secondaryText = secondaryText;

        // Add audio hint
        const audioHint = document.createElement('audio');
        audioHint.src = this.getAttribute('audio-hint-src');
        shadow.appendChild(audioHint);
        this.audioHint = audioHint;

        // Other properties
        this.mode = this.getAttribute('mode');
        this.mkt = this.getAttribute('mkt');
        initAudio();

        // Give elements default style
        img.style.display = 'block';
        img.style.marginLeft = 'auto';
        img.style.marginRight = 'auto';
        img.style.padding = '0px 0px 8px 0px';
        this.style.textAlign = 'center';
        primaryText.style.color = '#323232';
        primaryText.style.fontSize = '17px';
        secondaryText.style.color = '#323232';
        secondaryText.style.fontSize = '14px';
    };

    MicProto.attributeChangedCallback = function (attrName, oldVal, newVal) {
        switch (attrName) {
            case 'primary-text':
                {
                    this.primaryText.innerHTML = newVal;
                    break;
                }
            case 'secondary-text':
                {
                    this.secondaryText.innerHTML = newVal;
                    break;
                }
            case 'audio-hint-src':
                {
                    this.audioHint.src = newVal;
                    break;
                }
            case 'mode':
                {
                    this.mode = newVal;
                    break;
                }
            case 'mkt':
                {
                    this.mkt = newVal;
                    break;
                }
        }
    };

    MicProto.setFocus = function () {
        this.style.display = 'block';
        this.focus();
    }

    MicProto.imgSrcs = {
        standBy: window.location.protocol + '//' + window.location.hostname + '/images/pngs/Mic.png',
        listening: window.location.protocol + '//' + window.location.hostname + '/images/gifs/listening.gif',
        processing: window.location.protocol + '//' + window.location.hostname + '/images/gifs/processing.gif',
        noInternet: window.location.protocol + '//' + window.location.hostname + '/images/icons/no-internet-icon.png'
    };

    MicProto.startRecording = function () {
        var mic = document.getElementsByTagName('google-mic')[0];
        if(!VL.pushToTalk && !mic.isSMSRecording){
            document.getElementById('cancel-btn').style.display = "table";
        }
        dispatchCustomEvent(this, 'recordingstarted');
        this.isRecording = true;
        this.isProcessing = false;
        this.isLanguageReset = false;
        this.isMenuOpen = false;
        this.isErrorScreen = false; 
        this.isRetryFlag = false;
        this.isCancelled = false;
        this.img.src = this.imgSrcs.listening;
        if(VL.isLivAI)
        {
            // console.log("isLivAILang ", VL.isLivAILang.indexOf(mic.mkt));
            if (VL.isLivAILang.indexOf(mic.mkt) != -1){
                VL.defaultSpeechAPI = "livAI";
            }
            else{
                VL.defaultSpeechAPI = "google";
            }
        }
        else{
            VL.defaultSpeechAPI = "google";
        }
        // to be used for calling different api in case of different locale
        if (VL.defaultSpeechAPI == 'google') {
            navigator.getUserMedia({ audio: true }, function (stream) {
                localStream = stream;
                realAudioInput = audioContext.createMediaStreamSource(localStream);
                audioRecorder = new Recorder(realAudioInput);
                audioRecorder.clear();
                audioRecorder.record();
                startHark(stream);
            }, function (e) {
                console.log(e);
            });
        } else if (VL.defaultSpeechAPI == 'livAI') {
                app_session_id = create_UUID();
                recording_index = 0;
                temp_index = 0;
                mediaRecorder.start(500);
                startHark(mediaRecorder.stream);           
        }
    };

    MicProto.recordingNotDone = function (val) {

        if(val != 'cancel'){
            dispatchCustomEvent(this, 'queryprocessingerror');
        }
        speech.stop();
        isSpeaking = false;
        this.isRecording = false;
        this.isProcessing = false;
        this.img.src = navigator.onLine ? this.imgSrcs.standBy : this.imgSrcs.noInternet;
        if (VL.defaultSpeechAPI == 'livAI') {
            if(mediaRecorder.state == "recording")
            {
                mediaRecorder.stop();
            }
            else{
                dispatchCustomEvent(this, 'queryprocessingerror');
            }
        } else {
            audioRecorder.stop();
            localStream.stop();
        }
		clearTimeout(MicProto.timeOutID);
    };

    MicProto.endRecording = function () {
        
     	speech.stop();
        isSpeaking = false;
        document.getElementById('cancel-btn').style.display = "none";
        var mic = document.getElementsByTagName('google-mic')[0];
        if(!navigator.onLine){
            document.getElementById('nav-page').style.display = 'none';
            document.getElementById("menu-options").style.display="none";
            document.getElementById("menu-page").style.display="none";
            mic.img.src = mic.imgSrcs.noInternet;
            mic.setAttribute('secondary-text','');
            mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['check_internet']);
            document.getElementById('no-internet-page').style.display = 'block';

            localStorage.setItem('hellojio_error', "no_internet");
            return;
        }
        
        dispatchCustomEvent(this, 'recordingended');
        this.isRecording = false;
        this.isProcessing = true;
        this.img.src = this.imgSrcs.processing;
        if (VL.defaultSpeechAPI == 'livAI') {
            console.log('end recording called - 1');
            mediaRecorder.stop();            
        } else {
            audioRecorder.getBuffers(gotBuffers);
            audioRecorder.stop();
            localStream.stop();
        }
        clearTimeout(MicProto.timeOutID);
    };

    function mediaRecorderInit(stream) {
        console.log('media recorder init is called')
        var mic = document.getElementsByTagName('google-mic')[0];
        if (VL.defaultSpeechAPI == 'livAI') {
            console.log('liv ai media recorder initialised')
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.onstop = function(e) {
                var blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
                chunks = [];
                console.log('stop media recorder after end recording - 3') 
                if(!mic.isCancelled)
                {
                    ++recording_index;
                    temp_index=recording_index;
                    callLivApi(blob,temp_index);
                }
            }
            mediaRecorder.ondataavailable = function(e) {
                if(e.data.size > 0){chunks.push(e.data);}
                if(isSpeaking && mic.isRecording){
                    var blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
                    chunks = [];
                    callLivApi(blob,++recording_index);
                }
            }
        }
    }

    function startHark(stream) {
        var options = {};
        var mic = document.getElementsByTagName('google-mic')[0];
        mic.setAttribute('primary-text', VL.mic_key[mic.mkt]['listening']);
        ST.sendDataToAnalytics({"eventName":"listening_started"}, "event");
        speech = hark(stream, options);
        var decibel = ST.isF90M ? -70 : -60;
        speech.setThreshold(decibel);
        console.log("Start Hark")
        speech.on('speaking', function() {
            isSpeaking = true;
            clearTimeout(MicProto.timeOutID);
            console.log('Speaking!');
        });

        speech.on('stopped_speaking', function() {
            if(!VL.pushToTalk){
                mic.endRecording();
                document.getElementById('nav-page').style.display = "none";
                document.getElementById("menu-options").style.display="none";
                document.getElementById("menu-page").style.display="none";
                console.log('stopped_speaking - 2');
            }
        });

        MicProto.timeOutID = setTimeout(function() {
            if(!VL.pushToTalk){
                mic.endRecording();
                document.getElementById('nav-page').style.display = "none";
                document.getElementById("menu-options").style.display="none";
                document.getElementById("menu-page").style.display="none";
            }
        }, MicProto.timeOut);
    }

    function dispatchCustomEvent(obj, eName, eProps) {
        var event = new CustomEvent(eName, {
            detail: eProps
        });
        if (obj['on' + eName]) {
            obj['on' + eName](event);
        } else {
            obj.dispatchEvent(event);
        }
    }

    function getQueryIntent(query) {
        return new Promise(function(resolve, reject){
            const xhttp = new XMLHttpRequest({ mozSystem: true });

            xhttp.onreadystatechange = function () {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        resolve(JSON.parse(this.responseText));
                    } else {
                        reject(this.status);
                        return;
                    }
                }
            };

            var url = "https://api.api.ai/api/query?v=20150910&query=" + encodeURIComponent(query) +
                "&lang=en&sessionId=0b2ce379-7c24-44bb-80cf-b061ef2f7adc&timezone=2017-04-19T18:53:39+0530";

            xhttp.open('GET', url, true);
            xhttp.setRequestHeader("accept", "*/*");
            xhttp.setRequestHeader("authorization", "Bearer " + apiaiKey);
            xhttp.send();
        });

    }

    function getTranslateLanguageString(query) {
        return new Promise(function(resolve, reject){
            const xhttp = new XMLHttpRequest({ mozSystem: true });
            var data = "{'q': '" + query + "','target': 'en'}";
            xhttp.onreadystatechange = function () {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        resolve(JSON.parse(this.responseText));
                    } else {
                        reject(this.status);
                        return;
                    }
                }
            };

            xhttp.open('POST', googleTransURL, true);
            xhttp.setRequestHeader("accept", "*/*");
            xhttp.send(data);
        });

    }

    /* Code related to Record the audio*/
    function gotBuffers(buffers) {
        audioRecorder.exportMonoWAV(setUpGoogleAPIClient);
    }

    function initAudio() {
        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!navigator.cancelAnimationFrame)
            navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
        if (!navigator.requestAnimationFrame)
            navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;
    }


    function setUpGoogleAPIClient(blob) {
        if (blob == "") {
            console.log("do nothing");
        } else {
            var reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = callGoogleApi;
        }
    }

    function create_UUID() {
        var dt = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }

    function blobToFile(blob, fileName) {
        blob.lastModifiedDate = new Date();
        blob.name = fileName;
        return blob;
    }

    function callLivApi(fileText,recording_index) {
        var mic = document.getElementsByTagName('google-mic')[0];
        var resultantText = '';
        lang_str = mic.mkt;
        hindiResultantText = '';
        if(mic.isCancelled){
            return;
        }

        var blob = blobToFile(fileText, "tmp.ogg");

        var data = new FormData();
        // console.log("VL.isLiveLanguage... ", VL.isLiveLanguage[lang_str])
        data.append("language", VL.isLiveLanguage[lang_str]);
        data.append("app_session_id", app_session_id);
        data.append("recording_index", recording_index);
        data.append("is_last", "true");
        data.append('audio_file', blob, "tmp.ogg");
        var xhr = new XMLHttpRequest({ mozSystem: true });
        xhr.addEventListener("readystatechange", function() {
            if (this.readyState === 4) {
                if(mic.isCancelled){
                    return;
                }
                var response = JSON.parse(this.responseText);
                console.log("response ", response)
                try {
                    if (lang_str != "en-IN") {
                        hindiResultantText = response["transcriptions"][0]["utf_text"];
                    }
                    resultantText = response["extra_info"]["transliterate_en_text"][0];
                    resultantText = resultantText.toLowerCase().replace(/jiyo/,"jio");
                    if(resultantText.includes("monkey bath")){
                        resultantText = resultantText.replace("monkey bath","mann ki baat")
                    }
                    if(resultantText.includes("zee music") || (resultantText.includes("zee cinema") && (resultantText.indexOf("tv")<0)) || resultantText.includes("zee store") || resultantText.includes("zee video") || resultantText.includes("zee money") || resultantText.includes("zee kisan") || resultantText.includes("zee chat") || resultantText.includes("my zee")){
                        resultantText = resultantText.replace("zee","jio")
                    }
                    if(resultantText.includes("g tv") || resultantText.includes("g cinema") || resultantText.includes("g music") || resultantText.includes("g store") || resultantText.includes("g video") || resultantText.includes("g money") || resultantText.includes("g kisan") || resultantText.includes("g news") || resultantText.includes("g xpress news") || resultantText.includes("g express news") || resultantText.includes("g chat") || resultantText.includes("my g")){
                        resultantText = resultantText.replace("g","jio")
                    }
                    if(resultantText.includes("g o tv") || resultantText.includes("g o cinema") || resultantText.includes("g o music") || resultantText.includes("g o store") || resultantText.includes("g o video") || resultantText.includes("g o money") || resultantText.includes("g o kisan") || resultantText.includes("g o news") || resultantText.includes("g o xpress news") || resultantText.includes("g o express news") || resultantText.includes("g o chat") || resultantText.includes("my g o")){
                        resultantText = resultantText.replace("g o","jio")
                    }
                    if(resultantText.includes("geo tv") || resultantText.includes("geo cinema") || resultantText.includes("geo music") || resultantText.includes("geo store") || resultantText.includes("geo video") || resultantText.includes("geo money") || resultantText.includes("geo kisan") || resultantText.includes("geo news") || resultantText.includes("geo xpress news") || resultantText.includes("geo express news") || resultantText.includes("geo chat") || resultantText.includes("my geo")){
                        resultantText = resultantText.replace("geo","jio")
                    }
                    if(resultantText.includes("0 tv") || resultantText.includes("0 cinema") || resultantText.includes("0 music") || resultantText.includes("0 store") || resultantText.includes("0 video") || resultantText.includes("0 money") || resultantText.includes("0 kisan") || resultantText.includes("0 news") || resultantText.includes("0 xpress news") || resultantText.includes("0 express news") || resultantText.includes("0 chat") || resultantText.includes("my 0")){
                        resultantText = resultantText.replace("0","jio")
                    }
                    if(resultantText.includes("s m s")){
                        resultantText = resultantText.replace("s m s","sms")
                    }
                    if(resultantText.includes("jio pe")){
                        resultantText = resultantText.replace("pe","pay")
                    }
                    if(resultantText.startsWith("s") && resultantText.endsWith("m")){
                        resultantText = resultantText.replace(/s m|sm/,"fm")
                    }
                    if(hindiResultantText.startsWith("एस") && hindiResultantText.endsWith("एम")){
                        hindiResultantText = hindiResultantText.replace(/एस एम|एसएम/,"एफएम")
                    }
                    // console.log("isLiveTransLang ", VL.isLiveTransLang, " isLivAILang ", VL.isLivAILang, " lang_str ", typeof(lang_str));
                    // console.log("isLivAILang.. ", VL["isLivAILang"].indexOf(lang_str), " isLiveTransLang.. ", VL["isLiveTransLang"].indexOf(lang_str));

                    if((temp_index == response["recording_index"]))
                    {
                        if(lang_str == "en-IN"){
                            processFurther(resultantText, resultantText, mic);
                        }else{
                            processFurther(resultantText, hindiResultantText, mic);
                        }
                    } else if ((temp_index == 0) && mic.isRecording && VL["isLivAILang"].indexOf(lang_str) != -1 && VL["isLiveTransLang"].indexOf(lang_str) != -1){
                        console.log('text to be processed - 4',temp_index)
                        if(VL.isLiveTranscription)
                        {
                            mic.setAttribute('secondary-text', '');
                            if (lang_str != "en-IN") {
                                mic.setAttribute('primary-text', hindiResultantText);
                            }else{
                                mic.setAttribute('primary-text', resultantText);
                            }
                        }
                    }
                } catch (e) {
                    console.log('Error Query Process LIV API')
                    if(((temp_index == response["recording_index"]) || (temp_index > 0 && (this.status == 412 || this.status == 400))) && !isSpeaking)
                    {
                        dispatchCustomEvent(mic, 'queryprocessingerror', {
                            response: ''
                        });
                    }
                }

            }
        });

        xhr.open("POST", VL.livAPIURL);
        xhr.setRequestHeader("authorization", "Token " + VL.livAPITOKEN);
        xhr.send(data);

    }

    function callGoogleApi(e){
        var mic = document.getElementsByTagName('google-mic')[0];
        if(mic.isCancelled){
            return;
        }
        lang_str = mic.mkt;
        hindiResultantText = '';
        // if(lang_str != "en-IN"){
        //    Promise.all([googleSpeechRequest(e, lang_str),googleSpeechRequest(e,"en-IN")]).then(function(response){
        //        if (Object.getOwnPropertyNames(response[0]).length == 0 || Object.getOwnPropertyNames(response[1]).length == 0) {
        //             if(!mic.isSMSRecording){
        //                 dispatchCustomEvent(mic, 'queryprocessingerror', {
        //                     response: ''
        //                 });
        //             }
        //             else{
        //                 document.getElementById('mic-holder').style.display = "none";
        //                 document.getElementById('msg_not_recorded').style.display = "block";
        //                 document.getElementById('send-sms').style.display = "block";
        //                 document.getElementById("small-mic-msg").style.display = "block";
        //                 document.getElementById('send-sms-btn').style.display = "block";
		// 		        document.getElementById('small-mic-msg').style.bottom = '24px';
        //                 mic.isProcessing = false;
        //                 document.getElementById("small-mic-retry").style.display = "none";
        //             }
        //        }
        //        else {
        //             var hindiResponse = response[0];
        //             var engResponse = response[1];
		// 			hindiResultantText = hindiResponse.results[hindiResponse.results.length - 1].alternatives[0].transcript;
        //             console.log('before language translation hindi' + hindiResultantText);
        //             if(!mic.isCancelled)
        //             {
        //                 mic.setAttribute('secondary-text','');
        //                 document.getElementById('small-mic-retry').style.display = "block";
        //                 mic.isRetryFlag = true;
        //                 mic.isRetry = false;
        //                 if(lang_str != 'en-IN'){mic.setAttribute('primary-text',hindiResultantText);}
        //                 mic.img.src = navigator.onLine ? mic.imgSrcs.standBy : mic.imgSrcs.noInternet;
        //             }
        //             //}
        //             processApiResponse(engResponse);
        //        }
        //     }).catch(function(error){
		// 		  if(!mic.isSMSRecording){
        //               dispatchCustomEvent(mic, 'queryprocessingerror', {
        //                 response: error
        //               });
        //           }
		// 	});
        // }
        // else{
        voxtaSpeechRequest(e,"en-IN").then(function(data){
            processApiResponse(data);
        }).catch(function(error){
                if(!mic.isSMSRecording){
                    dispatchCustomEvent(mic, 'queryprocessingerror', {
                    response: error
                    });
                }
        });
        //}
    }

    function processApiResponse(response){
        var mic = document.getElementsByTagName('google-mic')[0];
        var resultantText = '';
        var actualText = '';
        if (Object.getOwnPropertyNames(response).length == 0) {
             if(!mic.isSMSRecording){
                dispatchCustomEvent(mic, 'queryprocessingerror', {
                    response: error
                });
            }
            else{
                document.getElementById('mic-holder').style.display = "none";
                document.getElementById('send-sms').style.display = "block";
                document.getElementById("small-mic-msg").style.display = "block";
                document.getElementById('send-sms-btn').style.display = "block";
                document.getElementById('msg_not_recorded').style.display = "block";
                document.getElementById('small-mic-msg').style.bottom = '24px';
                mic.isProcessing = false;
                document.getElementById("small-mic-retry").style.display = "none";
            }
        } else {
            resultantText = response.results[response.results.length - 1].alternatives[0].transcript;
            actualText = resultantText;
            console.log('before language translation ' + resultantText);
            if(lang_str == "en-IN"){
                processFurther(resultantText, resultantText, mic);
            }else{
                processFurther(resultantText, hindiResultantText, mic);
            }
        }
    }

    function processFurther(resultantText, actualText, mic){
        if(mic.isSMSRecording){
                document.getElementById('mic-holder').style.display = "none";
                document.getElementById('msg_not_recorded').style.display = "none";
                document.getElementById('send-sms').style.display = "block";
                document.getElementById("small-mic-msg").style.display = "block";
                document.getElementById('sms-text').value = document.getElementById('sms-text').value + ' ' + actualText;
                document.getElementById('send-sms-btn').style.display = "block";
				document.getElementById('small-mic-msg').style.bottom = '24px';
                mic.isProcessing = false;
                document.getElementById("small-mic-retry").style.display = "none";
            }
            else{
                if(!mic.isSMSRecording)
                {
                    document.getElementById('small-mic-retry').style.display = "block";
                }
                mic.isRetryFlag = true;
                mic.isRetry = false;
                mic.setAttribute('secondary-text','');
                resultantText = resultantText.replace(/geo|Geo/,"jio");
                if(resultantText.includes("monkey bath")){
                    resultantText = resultantText.replace("monkey bath","mann ki baat")
                }
                if(resultantText.includes("Zee Music")){
                    resultantText = resultantText.replace("Zee","Jio")
                }
                if(lang_str == 'en-IN'){mic.setAttribute('primary-text',resultantText);}
                else{mic.setAttribute('primary-text',actualText);}
            }
            mic.img.src = navigator.onLine ? mic.imgSrcs.standBy : mic.imgSrcs.noInternet;
            ST.sendDataToAnalytics({
                "eventName":"search_query_displayed",
                "pro":{
                    "query_displayed": lang_str != 'en-IN' ? hindiResultantText : resultantText,
                    "query_en":actualText,
                    "query_locale": lang_str != 'en-IN' ? hindiResultantText : actualText
                }
            }, "event");
            //setTimeout(function(){
            if(!mic.isSMSRecording && !mic.isRetry)
            {
                mic.isRetryFlag = false;
                getIntentObject(resultantText, actualText);
            }
            //},1500)
    }
	
	function googleSpeechRequest(e,lang){
        var mic1 = document.getElementsByTagName('google-mic')[0]; 
        var googleSpeechURL = 'https://speech.googleapis.com/v1/speech:recognize?key=' + VL.apiKey;       
        base64data = e.target.result;
        audio = base64data.split(',');
		var data = '{"config":{"encoding":"LINEAR16","languageCode":"'+lang+'"},"audio":{"content":"' + audio[1] + '"}}';
        return new Promise(function(resolve, reject){
             var http = new XMLHttpRequest({ mozSystem: true });
             http.open("POST", googleSpeechURL, true);
             http.onreadystatechange = function () {
                if (http.readyState == 4 && http.status == 200) {
                    resolve(JSON.parse(http.responseText));
                } else if (http.readyState == 4 && http.status != 200) {
                    reject(JSON.parse(http.responseText)); 
                }
            };
            for(var key in VL.speechApiHeaders)
            {
                if(VL.speechApiHeaders.length > 0){
                    http.setRequestHeader(VL.speechApiHeaders[key].headerName, VL.speechApiHeaders[key].headerValue)
                }
            }
            
            http.timeout = VL.speech_output_timeout; // Set timeout to 5 seconds (5000 milliseconds)
            http.ontimeout = function () {console.log('speech api timeout');
             dispatchCustomEvent(mic1, 'networkprocessingerror');
            }
            http.send(data);
        });
    }

    function voxtaSpeechRequest(e,lang){
        var mic1 = document.getElementsByTagName('google-mic')[0]; 
        var googleSpeechURL = 'https://sec.voxta.com/speech/recognize';       
        base64data = e.target.result;
        audio = base64data.split(',');
		//var data = '{"config":{"encoding":"LINEAR16","languageCode":"'+lang+'"},"audio":{"content":"' + audio[1] + '"}}';
        var data = {
            "appId": "01aaa17c-850b-43c8-bf20-4021a5528c56",
            "appKey": "680fdd08-4abe-44b4-9180-9f8d3335f83d",
            "audio": {
                "content": audio[1]
            },
            "config":{
                "locale":"en-IN",
                "contextualEntities":["location","person_name"],
                "sampleRateHz":16000
            }
        }
        return new Promise(function(resolve, reject){
             var http = new XMLHttpRequest({ mozSystem: true });
             http.open("POST", googleSpeechURL, true);
             http.onreadystatechange = function () {
                if (http.readyState == 4 && http.status == 200) {
                    resolve(JSON.parse(http.responseText));
                } else if (http.readyState == 4 && http.status != 200) {
                    reject(JSON.parse(http.responseText)); 
                }
            };
            
            //http.timeout = VL.speech_output_timeout; // Set timeout to 5 seconds (5000 milliseconds)
            // http.ontimeout = function () {console.log('speech api timeout');
            //  dispatchCustomEvent(mic1, 'networkprocessingerror');
            // }
            http.send(JSON.stringify(data));
        });
    }

   
    function getIntentObject(speechText,actualText) {
        var mic1 = document.getElementsByTagName('google-mic')[0];
        isHindiProcessing = lang_str !== 'en-IN'?true:false;
        var intentObj = {};
        if((lang_str != "en-IN") && (lang_str != "hi-IN")){
            intentObj = getProcessedIntentObject(speechText);
            intentObj.query_en = actualText;
            intentObj.query_locale = lang_str != 'en-IN' ? hindiResultantText : actualText;
            if(!mic1.isCancelled && !mic1.isRetry)
            {
                setTimeout(function(){
                    dispatchCustomEvent(mic1, 'queryprocessed', intentObj);
                },1500)
            }
        }else{
           var mlTimeout = false;
            var mlResponse = false;
            
            clearTimeout(mlStart);
            var mlStart = setTimeout(function () {
                mlTimeout = true;
                if (mlResponse){
                    dispatchCustomEvent(mic1, 'queryprocessed', intentObj);
                }
            }, 1500);

            getProcessedIntentFromMl(speechText,actualText).then(function(response) {
                console.log("Success!", response.post_data);
                mlResponse = true;      
                intentObj = response.post_data;
                if(response.post_data.intent == "browser" && response.post_data.action == "open"){
                    response.post_data.intent = response.post_data.action = "";
                }else{
                    intentObj.appName = response.post_data.intent;
                }
                intentObj.query_en = actualText;
                intentObj.query_locale = lang_str != 'en-IN' ? hindiResultantText : actualText;
                intentObj.ttiEngine = "ML";
                var msg = checkNetWork(); 
                var Contacts = window.FxContactMgr.API.Contacts;
                speechText = speechText.toLowerCase();           
                if(intentObj.appName == 'call') {
                    if(msg != 'good_strength'){
                        intentObj.action = "call";
                        intentObj.appName = '';
                        intentObj.Name = msg;
                        intentObj.resolved_query = 'connection_error';
                    }
                    else{
                        intentObj.action = "call";
                        intentObj.appName = '';
                        intentObj.Name = Contacts.preprocessStrings(speechText).query;
                        intentObj.resolved_query = lang_str == 'hi-IN' ? Contacts.preprocessStrings(hindiResultantText).query : Contacts.preprocessStrings(speechText).query;
                    }
                }
                else if(intentObj.appName == 'sms' && Contacts.preprocessSmsStrings(speechText).command !='open' && Contacts.preprocessSmsStrings(speechText).command !='all') {
                    if(msg != 'good_strength'){
                        intentObj.action = "call";
                        intentObj.appName = '';
                        intentObj.Name = msg;
                        intentObj.resolved_query = 'connection_error';
                    }
                    else{
                        intentObj.Name = Contacts.preprocessSmsStrings(speechText).query;
                        intentObj.resolved_query = lang_str != 'en-IN' ? Contacts.preprocessSmsStrings(hindiResultantText).query : Contacts.preprocessSmsStrings(speechText).query;
                        intentObj.action = "sms";
                        intentObj.appName = '';
                    }
                }
                else if(intentObj.appName == 'MyJio'){
                    var content ='';
                    if(speechText.includes('balance'))
                    {
                        content = 'balance';
                    }
                    else if(speechText.includes('recharge'))
                    {
                        content = 'recharge';
                    }
                    else if(speechText.includes('usage'))
                    {
                        content = 'usage';
                    }
                    else if(speechText.includes('my plan') || speechText.includes('active plan') || speechText.includes('current plan'))
                    {
                        content = 'myplan';
                    }
                    else if(speechText.includes('plan'))
                    {
                        content = 'plans';
                    }
                    else{
                        content='';
                    }			
                    intentObj.action = 'open';
                    intentObj.resolved_query = content;
                }
                if(!mic1.isCancelled && !mic1.isRetry)
                {
                    intentObj.appName = resolveIntentText(response.post_data.intent).appName;                
                    if (mlTimeout){
                        dispatchCustomEvent(mic1, 'queryprocessed', intentObj);                    
                    }
                }
            }, function(error) {
                console.error("Failed!", error);
            });  
        }
           
    }

    function getProcessedIntentFromMl(speechText,actualText){
        var mic1 = document.getElementsByTagName('google-mic')[0];
        var lg = '';
        (mic1.mkt == "en-IN") ? lg ="en" : lg = "hi";
        var jioMlURL = 'http://vassistdev.jio.ril.com/testinput?sentence=' + speechText + '&lang=' + lg;
        return new Promise(function(resolve, reject){
             var http = new XMLHttpRequest({ mozSystem: true });
             http.open("GET", jioMlURL, true);
             http.onreadystatechange = function () {
                if (http.readyState == 4 && http.status == 200) {
                    resolve(JSON.parse(http.responseText));
                } else if (http.readyState == 4 && http.status != 200) {
                    var intentObj = getProcessedIntentObject(speechText);
                    intentObj.query_en = actualText;
                    intentObj.query_locale = lang_str != 'en-IN' ? hindiResultantText : actualText;
                    if(!mic1.isCancelled && !mic1.isRetry)
                    {
                        dispatchCustomEvent(mic1, 'queryprocessed', intentObj);
                    }
                        reject(JSON.parse(http.responseText)); 
                }
            };
            http.timeout = VL.ml_output_timeout; // Set timeout to 5 seconds (5000 milliseconds)
            http.ontimeout = function () {
                console.log('ml api call timeout'); 
                var intentObj = getProcessedIntentObject(speechText);
                intentObj.query_en = actualText;
                intentObj.query_locale = lang_str != 'en-IN' ? hindiResultantText : actualText;
                if(!mic1.isCancelled && !mic1.isRetry)
                {
                    dispatchCustomEvent(mic1, 'queryprocessed', intentObj);
                }
            }
            http.send();
        });
    }

    // function resolvedIntentFromMl(text){
    //     var mlResponse = {};
        
    //     return mlResponse;
    // }

	function resolveIntentText(text)
	{
        var appExcuteOrder = ((text.includes('jio') || text.includes('geo') || text.includes('jeo')) && !(text.includes('internet') || text.includes('net')) || text.includes('browser') || text.includes('google')) ?['jioApps','systemApps']:['systemApps','jioApps'];
		var orderLen = appExcuteOrder.length;
		for(var j=0;j<orderLen;j++)
		{
			var app=appExcuteOrder[j];
			for(var prop in VL[app]){
				var len = VL[app][prop].length;
				for(var i=0;i<len;i++)
				{
					//var regex = new RegExp("\\W" + VL[app][prop][i] + "\\W");
					var regex = new RegExp('(^|\\W)'+VL[app][prop][i]+'($|\\W)');
					if(regex.test(text)){
						return {matchedWord:VL[app][prop][i],appName:prop,appType:app}
					}
				}
			}
		}
		return {matchedWord:'',appName:'',appType:''};
	}
    function checkNetWork(){
        var cnx = navigator.mozMobileConnections[0];
        var msg = "";
        if(cnx.iccId){
            //console.log("The voice operator is " + cnx.voice.network.longName);
            if (cnx.voice.connected && (cnx.voice.relSignalStrength < 10)) {
                console.log("The signal has a strength of " + (+cnx.voice.relSignalStrength) + "%");
                msg = 'poor_connectivity'; 
            } 
            else if(cnx.voice.network == null || cnx.voice.network.longName == null){
                msg = 'poor_connectivity'; 
            }
            else {
                msg = "good_strength"
                //console.log("The state of the connection is: " + cnx.voice.state);
                //msg = "The state of the connection is: " + cnx.voice.state;
            }
        }
        else{
            //console.log("Please insert a sim card")
            msg = 'no_sim';
        }
        return msg;
    }
    function getProcessedIntentObject(speechText) {
        var Contacts = window.FxContactMgr.API.Contacts;
		var intent = { action: '', appName: '', resolved_query: '', ttiEngine: "keywords" };
		speechText= speechText.toLowerCase();
		var appInfo = resolveIntentText(speechText);
		console.log("App: ",appInfo);
		if(appInfo.appName == '' || appInfo.appName == 'Net')
		{
            intent.resolved_query = lang_str != 'en-IN' ? hindiResultantText : speechText;
            return intent;
		}
        else if(appInfo.appName == 'Call') {
            var msg = checkNetWork();
            if(msg != 'good_strength'){
                intent.action = "call";
                intent.appName = '';
                intent.Name = msg;
                intent.resolved_query = 'connection_error';
                return intent;
            }
			else{
                intent.action = "call";
                intent.appName = '';
                intent.Name = Contacts.preprocessStrings(speechText).query;
                intent.resolved_query = lang_str == 'hi-IN' ? Contacts.preprocessStrings(hindiResultantText).query : Contacts.preprocessStrings(speechText).query;
                return intent;
            }
		}
		else if(appInfo.appName == 'Wifi'){
			intent.action="wifi";
			intent.resolved_query = speechText;
			return intent;
		}
        else if(appInfo.appName == 'Volume'){
			intent.action="volume";
			intent.resolved_query = speechText;
			return intent;
		}
        // else if(appInfo.appName == 'Language'){
		// 	intent.action="LANGUAGE";
		// 	intent.resolved_query = speechText;
		// 	return intent;
		// }
        else if(appInfo.appName == "Battery"){
            intent.action="battery";
			intent.resolved_query = speechText;
			return intent;
        }
		else if(appInfo.appName == 'Namo') {
			intent.action = "namo";
			intent.resolved_query = lang_str != 'en-IN' ? hindiResultantText : speechText;
			return intent;
		}
		else if(appInfo.appName == 'Messages' && Contacts.preprocessSmsStrings(speechText).command !='open' && Contacts.preprocessSmsStrings(speechText).command !='all') {
            var msg = checkNetWork();
            if(msg != 'good_strength'){
                intent.action = "call";
                intent.appName = '';
                intent.Name = msg;
                intent.resolved_query = 'connection_error';
                return intent;
            }
			else{
                intent.Name = Contacts.preprocessSmsStrings(speechText).query;
                intent.resolved_query = lang_str != 'en-IN' ? Contacts.preprocessSmsStrings(hindiResultantText).query : Contacts.preprocessSmsStrings(speechText).query;
                intent.action = "sms";
                intent.appName = '';
                return intent; 
            }
		}
		else if(appInfo.appName == 'MyJio'){
			var content ='';
			if(speechText.includes('balance'))
			{
				content = 'balance';
			}
			else if(speechText.includes('recharge'))
			{
				content = 'recharge';
			}
			else if(speechText.includes('usage'))
			{
				content = 'usage';
			}
			else if(speechText.includes('my plan') || speechText.includes('active plan') || speechText.includes('current plan'))
			{
				content = 'myplan';
			}
			else if(speechText.includes('plan'))
			{
				content = 'plans';
			}
			else{
				content='';
			}			
			intent.action = 'Launch';
			intent.appName = appInfo.appName;
			intent.resolved_query = content;
			return intent;
		}
       else if(appInfo.appName == 'JioChat'){
           var content = '';
           speechText = speechText.replace(appInfo.matchedWord,'');
           if(speechText.includes("hi")){
				content = speechText.replace(/hi/i,"")
			}
            if(speechText.includes("hello")){
                content = speechText.replace(/hello/i,"")
            }

            intent.action = 'open';
			intent.appName = appInfo.appName;
			intent.resolved_query = content;
			return intent;

        } else if(appInfo.appName == 'HelpVoice'){
            intent.action = "help";
            intent.appName = 'HelpVoice';
            return intent;
        } else if(appInfo.appName == 'Language'){
           intent.action = "LANG";
           intent.appName = 'Language';
           return intent;
        }
		else{
			speechText = speechText.replace(appInfo.matchedWord,'');
			speechTextArray = speechText.split(' ');
			speechTextArray.splice(speechTextArray.indexOf(''),1);
			var processedData = [];
			var len = speechTextArray.length;
			for(var i=0;i<len;i++)
			{
				if(VL.lang_key[lang_str].ignoreWords.indexOf(speechTextArray[i])<0 &&  VL.lang_key[lang_str].launchKeywords.indexOf(speechTextArray[i])<0)
				processedData.push(speechTextArray[i])
			}
			intent.action = 'open';
			intent.appName = appInfo.appName;
			intent.resolved_query = processedData.join(' ');
			return intent;
			
		} 
	   
    }
	function handleVisibilityChange() {
        //console.log('method for timeout current time',window.currentTime,'---------',(window.currentTime + (1000*60*2) - new Date().getTime()))
        if((window.currentTime + (1000*60*2) - new Date().getTime()) <= 0 && !MicProto.isSuspend){
            console.log('is suspended')
            audioContext.suspend();
            if(speech){speech.handleSuspend();}
            document.getElementById('processing-gif').src = "";
            document.getElementById('listening-gif').src = "";
            MicProto.isSuspend = true;
        }
	}
    var screenTimeout = setInterval(handleVisibilityChange,700);

    document.registerElement('google-mic', {
        prototype: MicProto
    });
    var onError = function(err) {
        console.log('The following error occured: ' + err);
    }
    window.resumeState = function(){
        window.currentTime = new Date().getTime();
        console.log('mic current time',window.currentTime)
         if(MicProto.isSuspend){
            audioContext.resume();
            if(speech){speech.handleResume();}
            document.getElementById('processing-gif').src = "../images/gifs/processing.gif";
            document.getElementById('listening-gif').src = "../images/gifs/listening.gif";
            console.log('suspend reset')
            MicProto.isSuspend = false;
        }
    }
    window.addEventListener("focus", function(event) {
        //window.currentTime = new Date().getTime();
      
        window.resumeState()
        navigator.mediaDevices.getUserMedia({ audio: true }).then(mediaRecorderInit, onError);
    }, false);
})();
