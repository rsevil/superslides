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
