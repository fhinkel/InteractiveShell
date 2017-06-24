/* global document */

function applySize(textarea, sizes) {
  const sizePercent = Math.round(sizes.currentSize * 100);
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
  let result = factor;
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
  const inputFactor = typeof inputFactorOrDefault === "undefined" ?
      1.1 :
      inputFactorOrDefault;
  const sizes = {
    factor: 1.1,
    currentSize: 1.0,
  };
  let textarea;
  let zoominBtn;
  let zoomoutBtn;
  let resetBtn;

  const init = function() {
    sizes.factor = sanitizeFactor(inputFactor);
    textarea = document.getElementById(textareaID);
    zoominBtn = document.getElementById(zoominID);
    zoomoutBtn = document.getElementById(zoomoutID);
    resetBtn = document.getElementById(resetID);
  };

  const attachListeners = function(s) {
    zoominBtn.addEventListener("click", function() {
      zoomin(textarea, s);
    });
    zoomoutBtn.addEventListener("click", function() {
      zoomout(textarea, s);
    });
    resetBtn.addEventListener("click", function() {
      reset(textarea, s);
    });
  };

  init();
  attachListeners(sizes);
};
