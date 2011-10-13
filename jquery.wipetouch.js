// jQuery WipeTouch 1.1.0
//
// Developed and maintained by Devv: http://devv.com
// This plugin is based on TouchWipe by Andreas Waltl: http://www.netcu.de
//
// USAGE
// $(selector).wipetouch(config);
//
// The wipe events should expect the result object with the following properties:
// speed - the wipe speed from 1 to 5
// x - how many pixels moved on the horizontal axis
// y - how many pixels moved on the vertical axis
//
// EXAMPLE
//		$(document).wipetouch({
//			allowDiagonal: true,
//			wipeLeft: function(result) { alert("Left on speed " + result.speed) },
//			wipeTopLeft: function(result) { alert("Top left on speed " + result.speed) },
//			wipeBottomLeft: function(result) { alert("Bottom left on speed " + result.speed) }
//		});
//
//
// More details at http://wipetouch.codeplex.com/
//
// LATEST CHANGES
// 1.1.0
// - New: tapToClick, if true will identify taps and and trigger a click on the touched element. Default is false.
// - Changed: events wipeBottom*** and wipeTop*** renamed to wipeDown*** and wipeUp***.
// - Changed: better touch speed calculation (was always too fast before).
// - Changed: speed will be an integer now (instead of float).
// - Changed: better wipe detection (if Y movement is more than X, do a vertical wipe instead of horizontal).
// - Bug fix: added preventDefault to touchStart and touchEnd internal events (this was missing).
// - Other general tweaks to the code.
//
//
// If you want to compress this code, we recommend Jasc: http://jasc.codeplex.com

(function($)
{
	$.fn.wipetouch = function(settings)
	{
		// ------------------------------------------------------------------------
		// PLUGIN SETTINGS
		// ------------------------------------------------------------------------

		var config = {
			// Variables and options
			moveX:				40,		// minimum amount of horizontal pixels to trigger a wipe event
			moveY:				40,		// minimum amount of vertical pixels to trigger a wipe event
			preventDefault:		true,	// if true, prevents default events (click for example)
			allowDiagonal:		false,	// if false, will trigger horizontal and vertical movements so
										// wipeTopLeft, wipeDownLeft, wipeTopRight, wipeDownRight are ignored
			tapToClick:			false,	// if user taps the screen it will fire a click event on the touched element

			// Wipe events
			wipeLeft:			false,	// called on wipe left gesture
			wipeRight:			false,	// called on wipe right gesture
			wipeUp:				false,	// called on wipe up gesture
			wipeDown:			false,	// called on wipe down gesture
			wipeUpLeft:			false,	// called on wipe top and left gesture
			wipeDownLeft:		false,	// called on wipe bottom and left gesture
			wipeUpRight:		false,	// called on wipe top and right gesture
			wipeDownRight:		false,	// called on wipe bottom and right gesture

			wipeTopLeft:		false,	// DEPRECATED, USE WIPEUPLEFT
			wipeBottomLeft:		false,	// DEPRECATED, USE WIPEDOWNLEFT
			wipeTopRight:		false,	// DEPRECATED, USE WIPEUPRIGHT
			wipeBottomRight:	false	// DEPRECATED, USE WIPEDOWNRIGHT
		};

		if (settings)
		{
			$.extend(config, settings);
		}

		this.each(function()
		{
			// ------------------------------------------------------------------------
			// INTERNAL VARIABLES
			// ------------------------------------------------------------------------
			var startX; // where touch has started, left
			var startY; // where touch has started, top
			var startDate = false; // used to calculate timing and aprox. acceleration
			var curX; // keeps touch X position while moving on the screen
			var curY; // keeps touch Y position while moving on the screen
			var isMoving = false; // is user touching and moving?
			var touchedElement = false; // element which user has touched

			// ------------------------------------------------------------------------
			// TOUCH EVENTS
			// ------------------------------------------------------------------------

			// Called when user touches the screen
			function onTouchStart(e)
			{
				if (!isMoving && e.touches.length > 0)
				{
					if (config.preventDefault)
					{
						e.preventDefault();
					}

					// temporary fix for deprecated events, will be removed soon!!!
					if (config.allowDiagonal)
					{
						if (!config.wipeDownLeft) config.wipeDownLeft = config.wipeBottomLeft;
						if (!config.wipeDownRight) config.wipeDownRight = config.wipeBottomRight;
						if (!config.wipeUpLeft) config.wipeUpLeft = config.wipeTopLeft;
						if (!config.wipeUpRight) config.wipeUpRight = config.wipeTopRight;
					}

					startDate = new Date().getTime();

					startX = e.touches[0].pageX;
					startY = e.touches[0].pageY;
					curX = startX;
					curY = startY;
					isMoving = true;

					touchedElement = $(e.target);

					this.addEventListener('touchmove', onTouchMove, false);
				}
			}

			// Called when user untouches the screen
			function onTouchEnd(e)
			{
				this.removeEventListener('touchmove', onTouchMove, false);

				touchCalculate(e);
			}

			// Called when user is touching and moving on the screen
			function onTouchMove(e)
			{
				if (config.preventDefault)
				{
					e.preventDefault();
				}

				if (isMoving)
				{
					curX = e.touches[0].pageX;
					curY = e.touches[0].pageY;
				}
			}

			// ------------------------------------------------------------------------
			// CALCULATE TOUCH AND TRIGGER
			// ------------------------------------------------------------------------

			function touchCalculate(e)
			{
				var endDate = new Date().getTime();	// current date to calculate timing
				var ms = startDate - endDate; // duration of touch in milliseconds

				var x = curX;			// current left position
				var y = curY;			// current top position
				var dx = x - startX;	// diff of current left to starting left
				var dy = y - startY;	// diff of current top to starting top
				var ax = Math.abs(dx);	// amount of horizontal movement
				var ay = Math.abs(dy);	// amount of vertical movement

				// moved less than 15 pixels and touch duration less than 100ms,
				// if tapToClick is true then triggers a click and stop processing
				if (ax < 15 && ay < 15 && ms < 100)
				{
					resetTouch();

					touchedElement.trigger("click");
					return;
				}

				var toright = dx > 0;	// if true X movement is to the right, if false is to the left
				var tobottom = dy > 0;	// if true Y movement is to the bottom, if false is to the top

				// calculate speed from 1 to 5, being 1 slower and 5 faster
				var s = ((ax + ay) * 60) / ((ms) / 6 * (ms));

				if (s < 1) s = 1;
				if (s > 5) s = 5;

				var result = {speed: parseInt(s), x: ax, y: ay};

				if (ax >= config.moveX)
				{
					// check if it's allowed and call diagonal wipe events
					if (config.allowDiagonal && ay >= config.moveY)
					{
						if (toright && tobottom)
						{
							triggerEvent(config.wipeDownRight, result);
						}
						else if (toright && !tobottom)
						{
							triggerEvent(config.wipeUpRight, result);
						}
						else if (!toright && tobottom)
						{
							triggerEvent(config.wipeDownLeft, result);
						}
						else
						{
							triggerEvent(config.wipeUpLeft, result);
						}
					}
					else if (ax >= ay)
					{
						if (toright)
						{
							triggerEvent(config.wipeRight, result);
						}
						else
						{
							triggerEvent(config.wipeLeft, result);
						}
					}
				}

				if (ay >= config.moveY && ay > ax)
				{
					if (tobottom)
					{
						triggerEvent(config.wipeDown, result);
					}
					else
					{
						triggerEvent(config.wipeUp, result);
					}
				}

				if (config.preventDefault)
				{
					e.preventDefault();
				}

				resetTouch();
			}

			// Resets the cached variables
			function resetTouch()
			{
				startX = false;
				startY = false;
				startDate = false;
				isMoving = false;
			}

			// Triggers a wipe event passing a result object with
			// speed from 1 to 5, and x / y movement amount in pixels
			function triggerEvent(wipeEvent, result)
			{
				if (wipeEvent) wipeEvent(result);
			}

			// ------------------------------------------------------------------------
			// ADD TOUCHSTART AND TOUCHEND EVENT LISTENERS
			// ------------------------------------------------------------------------

			if ('ontouchstart' in document.documentElement)
			{
				this.addEventListener('touchstart', onTouchStart, false);
				this.addEventListener('touchend', onTouchEnd, false);
			}
		});

		return this;
	};
})(jQuery);