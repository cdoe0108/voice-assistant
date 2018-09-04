window.FxContactMgr.View.ContactList = (function () {
  'use strict';

  const CHUNK_SIZE = 5;

  var exports = {},
  ContactsAPI = null,
  ContactDetailsView = null,
  
  ui = {},
  domElems = getDOMElements(),
  selectedIndex = 0,
  tmplContactItem = null,
  cachedContacts = [],
  isFirstChunk = true,
  renderedStart = 0,
  renderedTill = 0;


  function getDOMElements() {
    var mapping = {
      navPage: '#view-contacts',
      mic: 'bing-mic'
    };
    return Object.keys(mapping).reduce((a, x) => {
      a[x] = document.querySelector(mapping[x]);
      return a;
    }, {});
  }
  


  function contactClickHdlr(e) {
    var idx = e.target.dataset.idx;
    console.log(cachedContacts[idx]);
    ui.view.style.display = 'none';
    ContactDetailsView.render(cachedContacts[idx]);
  }
  
  function openContactItem() {
    hideView();
    if(selectedIndex >= 0 && cachedContacts.length > 0){
      ContactDetailsView.render(cachedContacts[selectedIndex]);  
    }
    
  }


  function clearContactsList() {
    if(ui.contactList){
      while(ui.contactList.firstChild){
        ui.contactList.removeChild(ui.contactList.firstChild);
      }
    }
  }
  
  
  function highLightItem(index) {
    if(ui.contactList){
       var childList = ui.contactList.childNodes;
       if(index<childList.length){
         childList[index].focus();
         console.log(childList[index], document.activeElement);
       }
    }
  }
  
  
  function renderContact(contact, idx) {
    var li = tmplContactItem.cloneNode(true).querySelector('li.listitem');
    li.dataset.idx = idx;
    li.textContent =  contact.fname + ' ' + contact.lname;
    li.tabIndex = 1;
    return li;
  }
 
  function renderReverseContacts() {

    var listFragment = document.createDocumentFragment(),
    i,
    len = cachedContacts.length,
    start = renderedStart - CHUNK_SIZE,
    limit = renderedStart;
    
    for (i = start; i <= len  && i < limit; ++i) {
      listFragment.appendChild(renderContact(cachedContacts[i], i));
    }

    ui.contactList.appendChild(listFragment);
    renderedStart = start;
    renderedTill = i;
    highLightItem(selectedIndex  % CHUNK_SIZE);
  }
  
  function renderContacts(renderStart) {
    var listFragment = document.createDocumentFragment(),
    i,
    len = cachedContacts.length,
    limit = renderedTill + CHUNK_SIZE;

    for (i = renderedTill; i < len && i < limit; ++i) {
      listFragment.appendChild(renderContact(cachedContacts[i], i));
    }

    ui.contactList.appendChild(listFragment);
    renderedStart = renderedTill;
    renderedTill = i;
    highLightItem(selectedIndex  % CHUNK_SIZE);
  }
  
  
  function selectNextItem(e) {
    console.log(e);
    if(e.key === "ArrowDown"){
        if(cachedContacts.length-1 == selectedIndex){
          return;
        }
      selectedIndex +=  1; 
      if(selectedIndex % CHUNK_SIZE== 0){
          clearContactsList();
          renderContacts();                
      }else{
          highLightItem(selectedIndex  % CHUNK_SIZE);
      }       
    }else if(e.key === "ArrowUp"){
      if(0 == selectedIndex){
          return;
      }
      selectedIndex -= 1;
      if(selectedIndex % CHUNK_SIZE == CHUNK_SIZE - 1){       
           clearContactsList();
           renderReverseContacts();                
      }else{
          highLightItem(selectedIndex  % CHUNK_SIZE);
      }      
    }
  }




  function getContactsCb(contacts,isCallAllowed) {
    if (!contacts) {
     alert('Failed to load contacts');
     return;
    }
    ui.contactHeader.innerHTML = '';
     
    if(contacts.length === 0){
      domElems.mic.setAttribute('primary-text', 'No contact found');
      domElems.mic.setAttribute('secondary-text', 'Press * to try again!');
      domElems.mic.setFocus();
      return;
    }
    if(contacts.length === 1 && isCallAllowed){
      navigator.mozTelephony.dial(contacts[0].mobile);  
      return;
    }else{
      ui.contactHeader.innerHTML = 'Choose the contact you want to call:';
      cachedContacts = cachedContacts.concat(contacts);    
      showView();
    }

    
    if (isFirstChunk) {
     renderContacts();
     isFirstChunk = false;
    }
    

  } //end getContactsCb
  
  

  function render(searchString) {
    console.log('init...');
    console.log('render contact list...');
    init(searchString);
    selectedIndex = selectedIndex % CHUNK_SIZE;
  } //end render


  function showView() {
    ui.view.style.display = 'block'; 
  }

  function hideView() {
    ui.view.style.display = 'none'; 
  }

  function onEvent(e) {
    if(e.key === "SoftRight" || e.key === "Backspace") {
      hideView();
      NavigationManager.showView();
      return NavigationManager;
    }else if(e.key === "ArrowDown" || e.key === "ArrowUp"){
      selectNextItem(e); 
    }else if(e.key === "Enter" || e.key === "Call"){
      navigator.mozTelephony.dial(cachedContacts[selectedIndex].mobile);  
    }
    return this;
  }


  function init(searchString) {
    cachedContacts = [];
    isFirstChunk = true;
    renderedTill = 0;
    ContactsAPI = window.FxContactMgr.API.Contacts;
    ContactDetailsView = window.FxContactMgr.View.ContactDetails;
  
    //--- cache dom elements ---//
    ui.view = document.querySelector('#view-contacts');
    ui.viewContent = ui.view.querySelector('.contact-content');
    ui.contactList = ui.view.querySelector('#contacts-list');
    ui.contactHeader = ui.view.querySelector('#contacts-header');
    while(ui.contactList.firstChild){
      ui.contactList.removeChild(ui.contactList.firstChild);
    }
    tmplContactItem = document.querySelector('#tmpl-contact-item').content;

    //--- add event listeners ---//
    /**
     * always use touch events instead of click when developing for
     * touch screens. That way you can eleminate 300ms delay in your
     * touch/click events http://addr.pk/ae631
     */
     //ui.contactList.addEventListener('click', contactClickHdlr, false);
    //ui.viewContent.addEventListener('scroll', contentScroll, false);

    //--- load and render contact list ---//
    // if(!searchString){
    //   //ContactsAPI.getAllContacts(CHUNK_SIZE, getContactsCb);      
    // }else if(searchString["command"] === "all"){
    //   //ContactsAPI.getAllContacts(CHUNK_SIZE, getContactsCb);      
    // }else if(searchString["command"] === "call" || searchString["command"] === "sms"){
      ContactsAPI.serachContacts(CHUNK_SIZE, getContactsCb, searchString);  
    // }      
    

  } //end init


  exports.render = render;
  exports.showView = showView;
  exports.hideView = hideView;
  exports.onEvent = onEvent;
  return exports;

}());
