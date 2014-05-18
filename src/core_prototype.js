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

    return hash-1;
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
