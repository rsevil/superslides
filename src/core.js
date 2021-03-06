var Superslides, plugin = 'superslides';

Superslides = function(el, options) {
  this.options = $.extend({
    play: false,
    inherit_width_from: window,
    inherit_height_from: window,
    pagination: true,
    hashchange: false,
    scrollable: true,
	loop: true,
    elements: {
      preserve: '.preserve',
      nav: '.slides-navigation',
      container: '.slides-container',
      pagination: '.slides-pagination'
    }
  }, options);

  var that       = this,
      $control   = $('<div>', { "class": 'slides-control' }),
      multiplier = 1;

  this.$el        = $(el);
  this.$container = this.$el.find(this.options.elements.container);
