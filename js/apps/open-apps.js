function openApps(params) {
	console.log('params', params);
	var mic = document.getElementsByTagName('google-mic')[0];
	var result = navigator.mozApps.mgmt.getAll();
	var apps = [];
	
	result.onsuccess = function() {
		result.result.forEach(
			function(item) {
				apps.push(item.manifest.name);
			});

		
		var inputName = params.name.toLowerCase();
		var index = apps.findIndex(item => inputName  === item.toLowerCase());
		
		if(mic.isRecording){return;}
		if(index > 0){
			if(mic.mkt == "en-IN"){
				var audio = new Audio('../audio/openingapp.mp3');
				audio.play()
			}
			else if(mic.mkt == "hi-IN"){
				var audio = new Audio('../audio/appkhola.mp3');
				audio.play();
			}
			if(inputName == 'jiochat'){
				let activity = new MozActivity({
					name: 'JioChat',
					type: "text/plain",
					data:{                            
						contentType: params.resolvedQuery
					}
				});
			}else if(inputName == 'myjio'){
					let activity = new MozActivity({
					name: 'MyJio',
					type: "text/plain",
					data:{                            
						//contentType: params.resolvedQuery,
						get:params.resolvedQuery
					}

				});

			}else if((VL.systemApps['Messages'].indexOf(inputName) >= 0) && (VL.openSendSMS.indexOf(params.resolvedQuery) >= 0)){
					let activity = new MozActivity({
						name: "new",
						type: "text/plain", 
						data: {
							type: "websms/sms",
						}
					}); 
			}else{
				readWriteSdCard(0,params.resolvedQuery);
				result.result[index].launch();
			}
		}
		else{
			if(VL.systemApps["Facebook"].indexOf(inputName) >= 0){
				window.open('https://m.facebook.com')
			}
			else if(VL.systemApps["Youtube"].indexOf(inputName) >= 0){
				window.open('https://m.youtube.com')
			}
			else{
				if(mic.mkt == "en-IN"){
					var audio = new Audio('../audio/couldntfindapp.mp3');
					audio.play()
				}
				else if(mic.mkt == "hi-IN"){
					var audio = new Audio('../audio/appnahimila.mp3');
					audio.play();
				}
			}
		}
	}
}

function readWriteSdCard(sid,query){
	deleteSdCardFile();
	var sdcard = navigator.getDeviceStorages('sdcard');
	var storage = sdcard[sid];

	var file = new Blob([query], {type: 'text/plain'});

	console.log('file', file);

	var request = storage.addNamed(file, 'voice.txt');

	console.log(request);

	request.onsuccess = function () {
		console.log(this.result);
	}

	request.onerror = function () {
		console.log(this.error);
	}
}

function deleteSdCardFile(){
	console.log('deleteSdCardFile');
	var sdcard = navigator.getDeviceStorage('sdcard');
	var request = sdcard.delete("voice.txt");

	request.onsuccess = function () {
	console.log('filedelted');
	}

	request.onerror = function () {
	console.log('unable to delete');
	}
}