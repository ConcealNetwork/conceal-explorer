$(function(){
  'use strict';


  /////////////////// START: TEMPLATE SETTINGS /////////////////////
  var loc    = window.location.pathname;
  var path   = loc.split('/');
  var isRtl  = false;
  var newloc = '';

  // inject additional link tag for header skin
  $('head').append('<link id="headerSkin" rel="stylesheet" href="">');

  // show/hide template options panel
  $('body').on('click', '.template-options-btn', function(e){
    e.preventDefault();
    $('.template-options-wrapper').toggleClass('show');
  });

  // set current page to light mode
  $('body').on('click', '.skin-light-mode', function(e){
    e.preventDefault();
    newloc = loc.replace('template-dark', 'template');
    $(location).attr('href', newloc);
  });

  // set current page to dark mode
  $('body').on('click', '.skin-dark-mode', function(e){
    e.preventDefault();
    if(loc.indexOf('template-dark') >= 0) {
      newloc = loc;
    } else {
      newloc = loc.replace('template', 'template-dark');
    }
    $(location).attr('href', newloc);
  });

  // set current page to rtl/ltr direction
  $('body').on('click', '.slim-direction', function(){
    var val = $(this).val();
    
    if(val === 'rtl') {
      if(!isRtl) {
        if(path[3]) {
          newloc = '/slim/'+path[2]+'-rtl/'+path[3];
        } else {
          newloc = '/slim/'+path[2]+'-rtl/';
        }
        $(location).attr('href', newloc);
      }
    } else {
      if(isRtl) {
        if(path[3]) {
          newloc = '/slim/'+path[2].replace('-rtl','')+'/'+path[3];
        } else {
          newloc = '/slim/'+path[2].replace('-rtl','')+'/';
        }
        $(location).attr('href', newloc);
      }
    }
  });

  // toggles header to sticky
  $('body').on('click', '.sticky-header', function(){
    var val = $(this).val();
    if(val === 'yes') {
      $.cookie('sticky-header', 'true');
      $('body').addClass('slim-sticky-header');
    } else {
      $.removeCookie('sticky-header');
      $('body').removeClass('slim-sticky-header');
    }
  });

  // set skin to header
  $('body').on('click', '.header-skin', function(){
    var val = $(this).val();
    if(val !== 'default') {
      $.cookie('header-skin', val);
      $('#headerSkin').attr('href','../css/slim.'+val+'.css');
    } else {
      $.removeCookie('header-skin');
      $('#headerSkin').attr('href', '');
    }
  });

  // set page to wide
  $('body').on('click', '.full-width', function(){
    var val = $(this).val();
    if(val === 'yes') {
      $.cookie('full-width', 'true');
      $('body').addClass('slim-full-width');
    } else {
      $.removeCookie('full-width');
      $('body').removeClass('slim-full-width');
    }
  });
  /////////////////// END: TEMPLATE SETTINGS /////////////////////

});
