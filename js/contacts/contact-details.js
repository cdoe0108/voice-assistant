window.FxContactMgr.View.ContactDetails = (function () {
  'use strict';

  var exports = {},
      ContactListView = null,
      ui = {},
      isVisible =  false;


  function closeView() {
    ui.view.style.display = 'none';
    ContactListView.showView();   
    document.querySelector('#searchbar').value = '';
    isVisible = false;
  }

  function isOpened(){
    return isVisible;
  }

  function onEvent(e){
     if(e.key === "*") {
      window.location.href='./speechinput.html';
    }else if(e.key === "SoftRight") {
      closeView();
      return ContactListView;
    }
    return this;
  }


  function render(contact) {

    exports.render = function (contact) {
      console.log('render contact details...');

      ui.valName.textContent = contact.fname + ' ' + contact.lname;
      ui.valMob.textContent = contact.mobile;
     // ui.valOrg.textContent = contact.org;
      ui.valType.textContent = contact.type;


      ui.view.style.display = 'block';
      isVisible = true;
    };

    init();
    exports.render(contact);
  } //end render


  function init() {
    ContactListView = window.FxContactMgr.View.ContactList;

    //--- cache dom elements ---//
    ui.view = document.querySelector('#view-contact-details');
    ui.btnBack = document.querySelector('#view-contact-details > header > .back');
    ui.valName = document.querySelector('#view-contact-details .val.name');
    ui.valMob = document.querySelector('#view-contact-details .val.mob');
    //ui.valOrg = document.querySelector('#view-contact-details .val.org');
    ui.valType = document.querySelector('#view-contact-details .val.type');

    //--- add event listeners ---//
    /**
     * always use touch events instead of click when developing for
     * touch screens. That way you can eleminate 300ms delay in your
     * touch/click events http://addr.pk/ae631
     */
    ui.btnBack.addEventListener('click', closeView, false);

  } //end init


  exports.render = render;
  exports.closeView = closeView;
  exports.isOpened = isOpened;
  exports.onEvent = onEvent;
  
  return exports;

}());
