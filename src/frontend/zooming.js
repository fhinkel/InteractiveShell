/* global document */

function applySize(textarea, sizes) {
  var sizePercent = Math.round(sizes.currentSize * 100);
  textarea.style.fontSize = sizePercent.toString() + "%";
}

function zoomin(textarea, sizes) {
  console.log("CS: " + sizes);
  sizes.currentSize *= sizes.factor;
  applySize(textarea, sizes);
}

function zoomout(textarea, sizes) {
  sizes.currentSize /= sizes.factor;
  applySize(textarea, sizes);
}

function reset(textarea, sizes) {
  sizes.currentSize = 1.0;
  applySize(textarea, sizes);
}

function sanitizeFactor(factor) {
  var result = factor;
  if (result < 0) {
    result *= -1;
  }
  if (result === 0) {
    result += 1.1;
  }
  if (result < 1) {
    result = 1 / result;
  }
  return result;
}

exports.attachZoomButtons = function(textareaID,
                                     zoominID, resetID, zoomoutID,
                                     inputFactorOrDefault) {
  var inputFactor = typeof inputFactorOrDefault === 'undefined' ?
      1.1 :
      inputFactorOrDefault;
  var sizes = {
    factor: 1.1,
    currentSize: 1.0
  };
  var textarea;
  var zoominBtn;
  var zoomoutBtn;
  var resetBtn;

  var init = function() {
    sizes.factor = sanitizeFactor(inputFactor);
    textarea = document.getElementById(textareaID);
    zoominBtn = document.getElementById(zoominID);
    zoomoutBtn = document.getElementById(zoomoutID);
    resetBtn = document.getElementById(resetID);
  };

  var attachListeners = function(sizes) {
    zoominBtn.addEventListener("click", function() {
      zoomin(textarea, sizes);
    });
    zoomoutBtn.addEventListener("click", function() {
      zoomout(textarea, sizes);
    });
    resetBtn.addEventListener("click", function() {
      reset(textarea, sizes);
    });
  };

  init();
  attachListeners(sizes);
};
