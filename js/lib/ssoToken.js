var ST = ST || {};
ST.SSOTOKEN = '';
ST.SUBSCRIBER_ID = '';
ST.KEY_IMEI = '';
ST.KEY_IMSI = '';
ST.commonName = '';
ST.googleAPIURL = 'https://api.media.jio.com/apis/va/src/response/index.php';
// https://api.media.jio.com/apis/va/src/response/index.php => prod VL url
// http://devapi1.jio.ril.com/jiotest/va/src/response/index.php => dev VL url

ST.analyticsUrl = 'https://collect.media.jio.com/postdata/'; //"https://collectpreprod.media.jio.com/postdata/";
ST.lbCookie = '';

ST.analyticsData = {}
ST.analyticsData.akey = "109152002";
// ST.analyticsData.uid = "NA";
// ST.analyticsData.idamid = "NA";
//ST.analyticsData.mode = "NA";
ST.analyticsData.rtc = "NA";
ST.analyticsData.did = "NA";
// ST.analyticsData.mnc_code = "NA";
ST.analyticsData.avn = "1.3.5";
ST.analyticsData["x-forwarded-for"] = "NA";
ST.analyticsData.mod = navigator.userAgent;
ST.analyticsData.mnu = "LYF";
ST.analyticsData.osv = "NA";
ST.analyticsData.dtpe = "F";
ST.analyticsData.nwk = "NA";
ST.analyticsData.pf = "K";
// ST.analyticsData.profileid = "NA";
ST.analyticsData.crmid = "NA";
ST.analyticsData.imsi = "NA";
ST.analyticsData.lng = 0;
ST.analyticsData.lat = 0;
ST.analyticsData.sid = new Date().getTime();
ST.analyticsData.imei = "NA";
ST.analyticsData.language = "NA";
ST.analyticsData.language = "NA";
ST.analyticsData.ori = "Portrait";
ST.analyticsData.carrier = "Jio";
ST.isF90M = ST.analyticsData.mod.includes('F90M');

ST.errorConstants ={
    "no_sim":{
        "message":"Please insert a sim card",
        "detail":"When there is no SIM card, and a call/SMS is attempted",
        "code":"1"
    },
    "poor_connectivity":{
        "message":"Poor Network Connectivity",
        "detail":"When there is a SIM card, but with very poor signal (less than 10% signal), and an SMS/Call is attempted",
        "code":"2"
    },
    "no_internet":{
        "message":"Please close app & ensure you have internet connectivity",
        "detail":"When there is no internet connection (neither via SIM data nor via WiFi)",
        "code":"3"
    },
    "contact_not_found":{
        "message":"Contact not found",
        "detail":"When an SMS/Call is attempted to a contact that is not present in the Contact List",
        "code":"4"
    },
    "didnt_get":{
        "message":"Sorry didn't catch",
        "detail":"When voice command is not recorded properly",
        "code":"5"
    }
}

//ST.RequestInQueue = false;

ST.configSSO = function() {
    var config = new Config();
    config.app_name = 'RJIL_HelloJio';
    initSsoConfig(config, function(onCallBack) {
        ST.setSsoLibrary();
    }, function(onInitError) {
       console.log('this is sso error'+onInitError);
    });

}

ST.getDeviceId = function() {
    const IMEI_INDEX = 5;
    const DEVICE_INFO_INDEX = 6;
    const ICCID_INDEX = 7;
    const ADID_INDEX = 8;
    const IMSI_INDEX = 9;
    const MSISDN_INDEX = 10;

    var store_name = navigator.getDataStores('jio_service_store');
    store_name.then(function(stores){
        stores[0].get(ADID_INDEX).then(function(tempAdid){
            ST.analyticsData.did = tempAdid;
            ST.analyticsData.sid = ST.analyticsData.did + ST.analyticsData.sid;
        });

        stores[0].get(DEVICE_INFO_INDEX).then(function(deviceinfo_temp){
            ST.analyticsData.osv=deviceinfo_temp.os_name;
            ST.analyticsData.mod = deviceinfo_temp.hardware_info;
        });

        stores[0].get(IMSI_INDEX).then(function(tempImsi) {
          // ST.analyticsData.imsi = tempImsi;
             ST.analyticsData.imsi = "";
        });

         stores[0].get(IMEI_INDEX).then(function(tempImei) {
           // console.log("IMEI is " + tempImei);
           // ST.analyticsData.imei = tempImei;
           ST.analyticsData.imei = "";
      });

        setTimeout(function(){
            ST.initalAnalytics();
            console.log(JSON.parse(localStorage.getItem("showFeedback")),localStorage.getItem('showFeedback'))
            if((!JSON.parse(localStorage.getItem("showFeedback")) && localStorage.getItem("showFeeback") != "true")){
                ST.showfeedback();
            }
        },2000)
    });
}

ST.setLatLong = function() {
    navigator.geolocation.getCurrentPosition(function(pos) {
        ST.analyticsData.lat = pos.coords.latitude;
        ST.analyticsData.lng = pos.coords.longitude;
    }, function(error) {
        console.log(error, "lat long not capture");
    })
}

ST.initalAnalytics = function(){
    ST.sendDataToAnalytics({ "eventName": "app_launch" }, "event");
    ST.sendDataToAnalytics({
        "sty":"B"
    }, "B");
    ST.sendDataToAnalytics({ "eventName": "homescreen_launch" }, "event");
    if(navigator.onLine){
        var error = localStorage.getItem('hellojio_error');
        if(error){
            ST.sendAnalyticsError("no_internet");
            localStorage.removeItem("hellojio_error")
        }
    }
}

ST.setAnalyticsCommonData = function() {

    ST.analyticsData.crmid = ST.SUBSCRIBER_ID;
    //ST.analyticsData.imsi = ST.KEY_IMSI;
    //ST.analyticsData.sid = ST.SSOTOKEN;
    //ST.analyticsData.imei = ST.KEY_IMEI;
    ST.analyticsData.language = navigator.language;

    ST.setLatLong();
    ST.getDeviceId();
}
ST.setSsoLibrary = function(callback = false) { //return false;
    var handleError = false;
    var forceSSo = false;
    startSSOEngine(handleError, forceSSo, function(successResponse) {
        ST.setSSOData(successResponse);
    }, function(errorResponse) {
        console.log('this is sso error'+errorResponse);
        ST.setAnalyticsCommonData();
    }, false);
}

ST.setSSOData = function(data) {
    ST.SSOTOKEN = data.KEY_SSO_TOKEN;
    ST.SUBSCRIBER_ID = data.KEY_USER.subscriberId;
    ST.KEY_IMEI = data.KEY_DEVICE_INFO.KEY_IMEI;
    ST.KEY_IMSI = data.KEY_DEVICE_INFO.KEY_IMSI;
    ST.commonName = data.KEY_USER.commonName;
    ST.lbCookie = data.KEY_LB_COOKIE;
    ST.action = '';
    ST.appName = '';
    ST.query = '';
    ST.getGoogleApiKey();
    ST.setAnalyticsCommonData();
}


ST.getGoogleApiKey = function() {
    var apiUrl = "";
    var request = new XMLHttpRequest({ mozSystem: true, mozAnon: true });

    request.onreadystatechange = function(e) {
        if (request.readyState !== 4) {
            return;
        }
        if(request.status === 200){
            var data = JSON.parse(request.response)
            if (data.result.googleprodkey) {
                VL.apiKey = data.result.googleprodkey;
                // console.log("VL_Update ", JSON.parse(data.result.dictionary))
                Object.assign(VL, JSON.parse(data.result.dictionary));
                localStorage.setItem('pttFlag',JSON.parse(data.result.dictionary).pushToTalk);
                //localStorage.setItem('dictionary',data.result.dictionary);
                localStorage.setItem('apiKey', data.result.googleprodkey);
                //console.log("Prod Key",VL.apiKey);
            }
        }
    };

    var params = "appInfo=voiceAssistant"
    request.open('POST', ST.googleAPIURL, true);
    request.setRequestHeader("Content-Type", 'application/x-www-form-urlencoded');
    request.setRequestHeader("ssotoken", ST.SSOTOKEN);
    request.setRequestHeader("subscriberId", ST.SUBSCRIBER_ID);
    request.setRequestHeader("IMEI", ST.KEY_IMEI);
    request.setRequestHeader("jioId", ST.commonName);
    request.setRequestHeader("lbcookie", ST.lbCookie);
    request.timeout = 5000; // Set timeout to 5 seconds (5000 milliseconds)
    request.ontimeout = function () {console.log('dictionary call timeout'); }
    request.send(params);
}

    ST.showfeedback = function(){
        var request = new XMLHttpRequest({ mozSystem: true, mozAnon: true });
        var url = "https://feedbacktest.jio.ril.com/feedback/showfeedback?id="+ST.analyticsData.crmid;
        request.onreadystatechange = function(e) {
            if (request.readyState !== 4) {
                return;
            }
            if(request.status === 200){
                console.log(this.responseText)
                localStorage.setItem("showFeedback",JSON.parse(this.response).show)
                //localStorage.setItem("showFeedback",true)
            }
        };

        request.open('GET', url, true);
        request.setRequestHeader("appkey", ST.analyticsData.akey);
        request.setRequestHeader("devicemodel", ST.analyticsData.mod);
        request.setRequestHeader("appversion", ST.analyticsData.avn);
        request.setRequestHeader("osversion", ST.analyticsData.osv);
        request.setRequestHeader("sid", ST.analyticsData.sid);	
        request.send({});
    }


ST.sendAnalyticsError = function(info){
    ST.sendDataToAnalytics({
					"eventName":"hellojio_error",
					"pro":ST.errorConstants[info]
	},"event");
}

ST.sendDataToAnalytics = function(eventData, param) {
    ST.experience_type =  VL.pushToTalk ? VL.pushToTalk.toString() : "false";
    ST.analyticsData.rtc = Date.now().toString();
    //ST.analyticsData.language = VL.setLocale();
    ST.analyticsData.language = document.getElementsByTagName('google-mic')[0].getAttribute("mkt");
    //console.log("ST",ST.analyticsData.language)
    //console.log("GET",document.getElementsByTagName('google-mic')[0].getAttribute("mkt"))

    var analyticsData = {
        "akey": ST.analyticsData.akey,
        // "uid": ST.analyticsData.uid,
        // "idamid":ST.analyticsData.idamid,
        //"mode": ST.analyticsData.mode,
        "rtc": ST.analyticsData.rtc,
        "did": ST.analyticsData.did,
        // "mnc_code": ST.analyticsData.mnc_code,
        "avn": ST.analyticsData.avn,
        "x-forwarded-for": ST.analyticsData["x-forwarded-for"],
        "mod": ST.analyticsData.mod,
        "mnu": ST.analyticsData.mnu,
        "osv": ST.analyticsData.osv,
        "dtpe": ST.analyticsData.dtpe,
        "nwk": "4G",
        "pf": "K",
        // "profileid": ST.analyticsData.profileid,
        "crmid": ST.analyticsData.crmid,
        "imsi": ST.analyticsData.imsi,
        "lng": ST.analyticsData.lng,
        "lat": ST.analyticsData.lat,
        "sid": ST.analyticsData.sid,
        "imei": ST.analyticsData.imei,
        "language": ST.analyticsData.language,
        "language_os": navigator.language,
        "ori":ST.analyticsData.ori,
        "experience_type": ST.experience_type,
        "c":ST.analyticsData.carrier,
    }

    if(eventData.sty){
        analyticsData.sty = eventData.sty;
    }

    if(eventData.eventName){
        analyticsData.key = eventData.eventName;
    }

    if (eventData.pro) {
        analyticsData.pro = eventData.pro;
    }


    var url = ST.analyticsUrl + param;

    var xhttp = new XMLHttpRequest({ mozSystem: true });
    xhttp.open("POST", url , true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(analyticsData));

    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4) {
            if (xhttp.readyState == 200) {
                console.log(xhttp.responseText);
            } else {
                console.log(xhttp.status);
            }
        }
    };

}

ST.configSSO();
