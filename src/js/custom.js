(function(){
  $(window).scroll(function () {
      var top = $(document).scrollTop();
      $('.splash').css({
        'background-position': '0px -'+(top/3).toFixed(2)+'px'
      });
      if(top > 50)
        $('#home > .navbar').removeClass('navbar-transparent');
      else
        $('#home > .navbar').addClass('navbar-transparent');
  });

  $("a[href='#']").click(function(e) {
    e.preventDefault();
  });

})();


var original = $.fn.val;
$.fn.val = function() {
  if ($(this).is('*[contenteditable=true]')) {
    return $.fn.html.apply(this, arguments);
  };
  return original.apply(this, arguments);
};
