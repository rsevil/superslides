/*! Superslides - v0.6.3-wip - 2014-05-25
* https://github.com/nicinabox/superslides
* Copyright (c) 2014 Nic Aitch; Licensed MIT */
(function(window, $) {

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

  // Private Methods
  var initialize = function() {
    multiplier = that._findMultiplier();

    that.$el.on('click', that.options.elements.nav + " a", function(e) {
      e.preventDefault();

      that.stop();
      if ($(this).hasClass('next')) {
        that.animate('next', function() {
          that.start();
        });
      } else {
        that.animate('prev', function() {
          that.start();
        });
      }
    });

    $(document).on('keyup', function(e) {
      if (e.keyCode === 37) {
        that.animate('prev');
      }
      if (e.keyCode === 39) {
        that.animate('next');
      }
    });

    $(window).on('resize orientationchange', function() {
      setTimeout(function() {
        var $children = that.$container.children();

        that.width  = that._findWidth();
        that.height = that._findHeight();

        $children.css({
          width: that.width,
          left: that.width
        });

        that.css.containers();
        that.css.images();
      }, 10);
    });
	
	if (window.Hammer){
		new Hammer(that.$el[0], { dragLockToAxis: true }).on("release dragleft dragright swipeleft swiperight", function (ev) {
			// disable browser scrolling
			ev.gesture.preventDefault();

			switch(ev.type) {
				case 'dragright':
				case 'dragleft':
					var size = that.size();
					var width = that._findWidth();
					// stick to the finger
					var pane_offset = -(100/size)*that.current;
					var drag_offset = ((100/width)*ev.gesture.deltaX) / size;

					// slow down at the first and last pane
					if((that.current == 0 && ev.gesture.direction == "right") ||
						(that.current == size-1 && ev.gesture.direction == "left")) {
						drag_offset *= .4;
					}

					that.setContainerOffset(drag_offset + pane_offset, false);
					break;

				case 'swipeleft':
					that.animate('next');
					ev.gesture.stopDetect();
					break;

				case 'swiperight':
					that.animate('prev');
					ev.gesture.stopDetect();
					break;

				case 'release':
					// more then 50% moved, navigate
					if(Math.abs(ev.gesture.deltaX) > that._findWidth()/2) {
						if(ev.gesture.direction == 'right') {
							that.animate('prev');
						} else {
							that.animate('next');
						}
					}
					else {
						that.showPane({
							upcoming_slide: that.current
						}, true);
					}
					break;
			}
		});
	}

    that.pagination._events();

    that.start();
    return that;
  };

var css = {
  containers: function() {
    if (that.init) {
      that.$el.css({
        height: that.height
      });

      that.$control.css({
        width: that.width
      });
	  
	  that.$container.css({
		width: that.width * that.size()
      });
    } else {
      $('body').css({
        margin: 0
      });

      that.$el.css({
        overflow: 'hidden',
        width: '100%',
        height: that.height
      });

      that.$control.css({
        height: '100%',
        width: that.width
      });

      that.$container.css({
        display: 'none',
        margin: '0',
        padding: '0',
        listStyle: 'none',
        position: 'relative',
        height: '100%',
		width: that.width * that.size()
      });
    }

    if (that.size() === 1) {
      that.$el.find(that.options.elements.nav).hide();
    }
  },
  images: function() {
    var $images = that.$container.find('img')
                                 .not(that.options.elements.preserve)

    $images.removeAttr('width').removeAttr('height')
      .css({
        "-webkit-backface-visibility": 'hidden',
        "-ms-interpolation-mode": 'bicubic',
        "position": 'relative',
        "left": '0',
        "top": '0',
        "z-index": '-1',
        "max-width": 'none'
      });

    $images.each(function() {
      var image_aspect_ratio = that.image._aspectRatio(this),
          image = this;

      if (!$.data(this, 'processed')) {
        var img = new Image();
        img.onload = function() {
          that.image._scale(image, image_aspect_ratio);
          that.image._center(image, image_aspect_ratio);
          $.data(image, 'processed', true);
        };
        img.src = this.src;

      } else {
        that.image._scale(image, image_aspect_ratio);
        that.image._center(image, image_aspect_ratio);
      }
    });
  },
  children: function() {
    var $children = that.$container.children();

    if ($children.is('img')) {
      $children.each(function() {
        if ($(this).is('img')) {
          $(this).wrap('<div>');

          // move id attribute
          var id = $(this).attr('id');
          $(this).removeAttr('id');
          $(this).parent().attr('id', id);
        }
      });

      $children = that.$container.children();
    }

    $children.css({
      overflow: 'hidden',
      height: '100%',
      width: that.width,
      zIndex: 0,
	  float:'left'
    });

  }
}

var image = {
  _centerY: function(image) {
    var $img = $(image);

    $img.css({
      top: (that.height - $img.height()) / 2
    });
  },
  _centerX: function(image) {
    var $img = $(image);

    $img.css({
      left: (that.width - $img.width()) / 2
    });
  },
  _center: function(image) {
    that.image._centerX(image);
    that.image._centerY(image);
  },
  _aspectRatio: function(image) {
    if (!image.naturalHeight && !image.naturalWidth) {
      var img = new Image();
      img.src = image.src;
      image.naturalHeight = img.height;
      image.naturalWidth = img.width;
    }

    return image.naturalHeight / image.naturalWidth;
  },
  _scale: function(image, image_aspect_ratio) {
    image_aspect_ratio = image_aspect_ratio || that.image._aspectRatio(image);

    var container_aspect_ratio = that.height / that.width,
        $img = $(image);

    if (container_aspect_ratio > image_aspect_ratio) {
      $img.css({
        height: that.height,
        width: that.height / image_aspect_ratio
      });

    } else {
      $img.css({
        height: that.width * image_aspect_ratio,
        width: that.width
      });
    }
  }
};

var pagination = {
  _setCurrent: function(i) {
    if (!that.$pagination) { return; }

    var $pagination_children = that.$pagination.children();

    $pagination_children.removeClass('current');
    $pagination_children.eq(i)
      .addClass('current');
  },
  _addItem: function(i) {
    var slide_number = i + 1,
        href = slide_number,
        $slide = that.$container.children().eq(i),
        slide_id = $slide.attr('id');

    if (slide_id) {
      href = slide_id;
    }

    var $item = $("<a>", {
      'href': "#" + href,
      'text': href
    });

    $item.appendTo(that.$pagination);
  },
  _setup: function() {
    if (!that.options.pagination || that.size() === 1) { return; }

    var $pagination = $("<nav>", {
      'class': that.options.elements.pagination.replace(/^\./, '')
    });

    that.$pagination = $pagination.appendTo(that.$el);

    for (var i = 0; i < that.size(); i++) {
      that.pagination._addItem(i);
    }
  },
  _events: function() {
    that.$el.on('click', that.options.elements.pagination + ' a', function(e) {
      e.preventDefault();

      var hash  = that._parseHash(this.hash), index;
      index = that._upcomingSlide(hash);

      if (index !== that.current) {
        that.animate(index, function() {
          that.start();
        });
      }
    });
  }
};

  this.css = css;
  this.image = image;
  this.pagination = pagination;

  this.$control = this.$container.wrap($control).parent('.slides-control');
  if (!this.options.loop)
	this.$el.find(that.options.elements.nav + ' a.prev').attr('disabled',true);

  that._findPositions();
  that.width  = that._findWidth();
  that.height = that._findHeight();
  

  this.css.children();
  this.css.containers();
  this.css.images();
  this.pagination._setup();

  return initialize();
};

Superslides.prototype = {
  _findWidth: function() {
    return $(this.options.inherit_width_from).width();
  },
  _findHeight: function() {
    return $(this.options.inherit_height_from).height();
  },

  _findMultiplier: function() {
    return this.size() === 1 ? 1 : 3;
  },

  _upcomingSlide: function(direction) {
    if ((/next/).test(direction)) {
      return this._nextInDom();

    } else if ((/prev/).test(direction)) {
      return this._prevInDom();

    } else if ((/\d/).test(direction)) {
      return +direction;

    } else if (direction && (/\w/).test(direction)) {
      var index = this._findSlideById(direction);
      if (index >= 0) {
        return index;
      } else {
        return 0;
      }

    } else {
      return 0;
    }
  },

  _findSlideById: function(id) {
    return this.$container.find('#' + id).index();
  },

  _findPositions: function(current, thisRef) {
    thisRef = thisRef || this;

    if (current === undefined) {
      current = -1;
    }

    thisRef.current = current;
    thisRef.next    = thisRef._nextInDom();
    thisRef.prev    = thisRef._prevInDom();
  },

  _nextInDom: function() {
	var index = this.current + 1;
  
	if (!this.options.loop 
		&& index === this.size()){
		return this.current;
	} else if (index === this.size()) {
      index = 0;
    }

    return index;
  },

  _prevInDom: function() {
	var index = this.current - 1;
  
	if (!this.options.loop
		&& index < 0){
		return this.current;
	}else if(index < 0) {
      index = this.size() - 1;
    }

    return index;
  },

  _parseHash: function(hash) {
    hash = hash || window.location.hash;
    hash = hash.replace(/^#/, '');

    if (hash && !isNaN(+hash)) {
      hash = +hash;
    }

	if (typeof(hash) === 'number')
		hash-=1;
	
    return hash;
  },

  size: function() {
    return this.$container.children().length;
  },

  destroy: function() {
    return this.$el.removeData();
  },

  update: function() {
    this.css.children();
    this.css.containers();
    this.css.images();

    this.pagination._addItem(this.size())

    this._findPositions(this.current);
    this.$el.trigger('updated.slides');
  },

  stop: function() {
    clearInterval(this.play_id);
    delete this.play_id;

    this.$el.trigger('stopped.slides');
  },

  start: function() {
    var that = this;

	this.animate();

    if (this.options.play) {
      if (this.play_id) {
        this.stop();
      }

      this.play_id = setInterval(function() {
        that.animate();
      }, this.options.play);
    }

    this.$el.trigger('started.slides');
  },

  animate: function(direction, userCallback) {
    var that = this,
        orientation = {};

    if (this.animating) {
      return;
    }

    this.animating = true;

    if (direction === undefined) {
      direction = 'next';
    }
	
	if (!that.options.loop 
		&& (((/next/).test(direction) && this.current == this.size()-1)
			|| ((/prev/).test(direction) && this.current == 0)
			)
		) {
		this.animating = false;
		return;
    }

    orientation.upcoming_slide = this._upcomingSlide(direction);
	orientation.outgoing_slide    = this.current;
	
	if (orientation.upcoming_slide >= this.size()){
		return;
	}
	
	if (!that.options.loop){	
		var nav = that.$el.find(that.options.elements.nav).removeClass('last-slide');
		var btns = nav.find('a').removeAttr('disabled');
		if (orientation.upcoming_slide == this.size()-1){
			btns.filter('.next')
				.attr('disabled', true);
			nav.addClass('last-slide');
		}else if (orientation.upcoming_slide == 0){
			btns.filter('.prev')
				.attr('disabled', true);
		}
	}

    that.$el.trigger('animating.slides', [orientation]);
	
	that.showPane(orientation,true,function(){
		if (that.size() > 1) {
		  that.pagination._setCurrent(orientation.upcoming_slide);
		}
	
		//set current, next && prev
		that._findPositions(orientation.upcoming_slide, that);

		if (typeof userCallback === 'function') {
			userCallback();
		}

		that.animating = false;
		that.$el.trigger('animated.slides');

		if (!that.init) {
			that.$el.trigger('init.slides');
			that.init = true;
			that.$container.fadeIn('fast');
		}
	});
  },
  
  showPane: function(orientation, animate, callback) {
	var offset = -((100/this.size())*orientation.upcoming_slide);
	this.setContainerOffset(offset, animate, callback);
  },
  
  setContainerOffset: function(percent, animate, callback) {
	this.$container.removeClass("animate");

	if(animate) {
		this.$container.addClass("animate");
	}
	
	if (window.Modernizr && window.Modernizr.csstransitions){
		if(window.Modernizr.csstransforms3d) {
			this.$container.css("transform", "translate3d("+ percent +"%,0,0) scale3d(1,1,1)");
		}
		else if(window.Modernizr.csstransforms) {
			this.$container.css("transform", "translate("+ percent +"%,0)");
		}
		else {
			var px = ((this._findWidth()*this.size()) / 100) * percent;
			this.$container.css("left", px+"px");
		}
	}else{
		this.$container.removeClass("animate");
		var px = ((this._findWidth()*this.size()) / 100) * percent;
		this.$container.animate({"left": px+"px"});
	}
	if (callback)
		callback();
  }
};

// jQuery plugin definition

$.fn[plugin] = function(option, args) {
  var result = [];

  this.each(function() {
    var $this, data, options;

    $this = $(this);
    data = $this.data(plugin);
    options = typeof option === 'object' && option;

    if (!data) {
      result = $this.data(plugin, (data = new Superslides(this, options)));
    }

    if (typeof option === "string") {
      result = data[option];
      if (typeof result === 'function') {
        return result = result.call(data, args);
      }
    }
  });

  return result;
};

$.fn[plugin].fx = {};

})(this, jQuery);
