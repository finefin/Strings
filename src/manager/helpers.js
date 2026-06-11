//  LiTTlE HElPERS

// device check
function isIOS() {
  if (/iPad|iPhone|iPod/.test(navigator.platform)) {
    return true;
  } else {
    // newer iPads are detected as InterlMac devices
    // we need to do a check for multitouch/touchscreen to
    // distinguish it from MacBooks
    return navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform);
  }
}

// ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ##
// Local storage

// save / load game / retrieves all saved items
function saveLocal(saveID, saveJson, logOutput = false) {
  if (logOutput) log("save: ", saveID, saveJson);
  localStorage.setItem(saveID, JSON.stringify(saveJson));
}

function loadLocal(saveID) {
  var saved = localStorage.getItem(saveID);
  if (saved) {
    return JSON.parse(saved);
  } else {
    log("local storage '" + saveID + "' not found.");
    return null;
  }
}

function allStorage() {
  var archive = [],
    keys = Object.keys(localStorage),
    i = 0,
    key;

  for (; (key = keys[i]); i++) {
    archive.push(key + "=" + localStorage.getItem(key));
  }

  log(archive);
}

// ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ##
// MATH++

// slightly better randomization, still pseudo
var seed = Math.floor(new Date().getTime() / 1000);
function random() {
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Value map function (converts value from one range to another)
Number.prototype.mapMinMax = function (in_min, in_max, out_min, out_max) {
  return ((this - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
};

// ensures that a value does not go below or above min/max values
function clampNumber (  value, min, max  ) {
  return Math.min (Math.max (value, min), max);
}

// calculate distance of two objects, e.g. in pixels
function distanceOf(ax, ay, bx, by) {
  var ab, ac, bc, cx, cy;
  cx = bx;
  cy = ay;
  ax < bx ? (ac = bx - ax) : (ac = ax - bx);
  ay < by ? (bc = by - ay) : (bc = ay - by);
  ab = Math.abs(Math.sqrt(ac * ac + bc * bc)); // Pythagoras much?
  return ab;
}

/*
    blend two colors to create the color that is at the percentage away from the first color
    @param: color1      => the first color, hex (ie: #000000)
    @param: color2      => the second color, hex (ie: #ffffff)
    @param: percentage  => the distance from the first color, as a decimal between 0 and 1 (ie: 0.5)
    @returns: string    => the third color, hex, represenatation of the blend between color1 and color2 at the given percentage
*/
function blend_colors(color1, color2, percentage) {
  color1 = color1 || "#000000";
  color2 = color2 || "#ffffff";
  percentage = percentage || 0.5;
  // 1: validate input
  if (color1.length != 4 && color1.length != 7) {
    log("colors must be provided as hexes");
    return;
  }
  if (color2.length != 4 && color2.length != 7) {
    log("colors must be provided as hexes");
    return;
  }
  if (percentage > 1 || percentage < 0) {
    log("percentage must be between 0 and 1");
    return;
  }

  // 2: check to see if we need to convert 3 char hex to 6 char hex, else slice off hash
  //      the three character hex is just a representation of the 6 hex where each character is repeated
  //      ie: #060 => #006600 (green)
  if (color1.length == 4) color1 = color1[1] + color1[1] + color1[2] + color1[2] + color1[3] + color1[3];
  else color1 = color1.substring(1);
  if (color2.length == 4) color2 = color2[1] + color2[1] + color2[2] + color2[2] + color2[3] + color2[3];
  else color2 = color2.substring(1);

  // 3: we have valid input, convert colors to rgb
  color1 = [parseInt(color1[0] + color1[1], 16), parseInt(color1[2] + color1[3], 16), parseInt(color1[4] + color1[5], 16)];
  color2 = [parseInt(color2[0] + color2[1], 16), parseInt(color2[2] + color2[3], 16), parseInt(color2[4] + color2[5], 16)];

  // 4: blend
  var color3 = [
    (1 - percentage) * color1[0] + percentage * color2[0],
    (1 - percentage) * color1[1] + percentage * color2[1],
    (1 - percentage) * color1[2] + percentage * color2[2],
  ];

  // 5: convert to hex
  color3 = "#" + int_to_hex(color3[0]) + int_to_hex(color3[1]) + int_to_hex(color3[2]);
  var hex = parseInt(color3.replace(/^#/, ""), 16);

  return hex;
}

/*
    lighten/darken a color by percent
    @param: color       => the color, hex (ie: #000000)
    @param: percent     => lightens color if > 0, darkens it if < 0
    @returns: string    => the shaded color as hex
*/
function shadeColor(color, percent) {
  color = color.substring(2, 8);

  var R = parseInt(color.substring(1, 3), 16);
  var G = parseInt(color.substring(3, 5), 16);
  var B = parseInt(color.substring(5, 7), 16);

  R = parseInt((R * (100 + percent)) / 100);
  G = parseInt((G * (100 + percent)) / 100);
  B = parseInt((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  var RR = R.toString(16).length == 1 ? "0" + R.toString(16) : R.toString(16);
  var GG = G.toString(16).length == 1 ? "0" + G.toString(16) : G.toString(16);
  var BB = B.toString(16).length == 1 ? "0" + B.toString(16) : B.toString(16);

  return "0x" + RR + GG + BB;
}

function adjust(color, amount) {
  return (
    "0x" +
    color
      .replace(/^0x/, "")
      .replace(/../g, (color) => ("0" + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2))
  );
}

/*
    convert a Number to a two character hex string
    must round, or we will end up with more digits than expected (2)
    note: can also result in single digit, which will need to be padded with a 0 to the left
    @param: num         => the number to conver to hex
    @returns: string    => the hex representation of the provided number
*/
function int_to_hex(num) {
  var hex = Math.round(num).toString(16);
  if (hex.length == 1) hex = "0" + hex;
  return hex;
}

function normalizeValue (value, min, max) {
    return (value - min) / (max - min);
};

function lerp (norm, min, max) {
    return (max - min) * norm + min;
};



// ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ##
// ARRAYS & OBJECTS

/**
 * Shuffles array in place.
 */
function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

/**
 * checks if all elements of array are equal.
 */
function allEqual(array) {
  try {
    return !array.some(function (value, index, array) {
      return value !== array[0];
    });
  } catch {
    log(array, " is not an array");
  }
}

/**
 * checks if two arrays are equal.
 */
function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * assumes array elements are primitive types
 * check whether 2 arrays are equal sets.
 * @param  {} a1 is an array
 * @param  {} a2 is an array
 */
function areArraysEqualSets(a1, a2) {
  const superSet = {};
  for (const i of a1) {
    const e = i + typeof i;
    superSet[e] = 1;
  }

  for (const i of a2) {
    const e = i + typeof i;
    if (!superSet[e]) {
      return false;
    }
    superSet[e] = 2;
  }

  for (let e in superSet) {
    if (superSet[e] === 1) {
      return false;
    }
  }

  return true;
}

/**
 * get keys of object that contain the value
 **/
function getKeysByValue(object, value) {
  return Object.keys(object).filter((key) => object[key] === value);
}

/**
 * returns the number of elements with a certain value
 **/
function howManyInArray(value, array) {
  let count = 0;
  for (var i = 0; i < array.length; i++) {
    if (array[i] === value) count++;
  }
  return count;
}

/**
 * return the stack trace to find out the caller of a function
 **/
function logInvokingLine() {
  const error = new Error();
  const stack = error.stack || '';
  const stackLines = stack.split('\n');
  // Adjust the index 2 or 3 based on how your environment's stack trace is structured
  const callerLine = stackLines[2] || ''; // This might need adjustment
  log('~~~~~~~ function() invoked from:', callerLine.trim());
}

/**
 * returns a random key of an object as a string
 **/
function getRandomKey (obj) {
  const keys = Object.keys(obj);
  const randomIndex = Math.floor( random() * keys.length );
  return keys [randomIndex]
}

// ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ##
// Phaser helpers

function cleanupScenes(scene, arrayOfSceneKeys = []) {
  var cleanupscenes = arrayOfSceneKeys;
  cleanupscenes.forEach((s) => scene.get(s).cleanup());
}

function clearTexture(scene, key) {
  if (scene.textures.list[key]) scene.textures.remove(key);
}

function clearAudio(scene, key) {
  if (scene.sound.get(key) != null) scene.sound.remove(key);
}

function setHover(objekt, image = null, tintColor = 0xff9d00) {
  if (objekt != null) {
    var color = tintColor;
    if (image == null) image = objekt;
    objekt.on("pointerover", () => {
      if (image.type != "Zone") image.setTint(color);
    });
    objekt.on("pointerout", () => {
      if (image.type != "Zone") image.clearTint();
    });
  }
}

function spritesCollide(spr1, spr2) {
  var boundsA = spr1.getBounds();
  var boundsB = spr2.getBounds();
  return Phaser.Geom.Intersects.RectangleToRectangle(boundsA, boundsB);
}

function blinkMe(scene, image, { repeat = 10, tintFill = false, duration = 1000, r = 255, g = 255, b = 255 }) {
  scene.tweens.addCounter({
    from: 255,
    to: 0,
    yoyo: true,
    repeat: repeat,
    duration: duration,
    onUpdate: function (tween) {
      var value = Math.floor(tween.getValue());
      var red = (r / 255) * value;
      var green = (g / 255) * value;
      var blue = (b / 255) * value;
      if (!tintFill) {
        image.setTint(Phaser.Display.Color.GetColor(red, green, blue));
      } else {
        image.setTintFill(Phaser.Display.Color.GetColor(red, green, blue));
      }
    },
  });
}

function wobbleMe(scene, obj, { strength = 1, scale = 1, duration = 1000, repeat = -1 }) {
  var tween = scene.tweens.add({
    targets: obj,
    scale: scale,
    ease: "Elastic.easeInOut", // 'Cubic', 'Elastic', 'Bounce', 'Back'
    duration: duration,
    repeat: repeat,
    yoyo: true,
  });
}

function toggleSound(scene) {
  var muteState = scene.sound.mute;
  scene.sound.setMute(!muteState);
}

// zooms and fades main camera for 'exit location' scene transitions
function transitionScene(scene, target, duration = 1000, zoom = 15, panX = 0) {
  log("TRANSITION TO SCENE ", target);
  var cam = scene.cameras.main;
  cam.setZoom(1);

  scene.scene.get("Audio").playSFX("Door");

  setTimeout(
    () => {
      cam.fadeOut(duration * 0.3);
    },
    duration * 0.6,
    this
  );

  if (panX != 0) {
    setTimeout(
      () => {
        cam.pan(panX, centerY, duration * 0.8, "Quart.easeIn");
      },
      duration * 0.1,
      this
    );
  }

  cam.zoomTo(
    zoom, //zoom distance
    duration,
    "Quart.easeIn",
    false,
    function (obj) {
      if (obj.zoomEffect.progress == 1) scene.scene.start(target);
    }
  );
}

function setGroupDepth ( theGroup, theDepth ) {
  // set depth of all children of group
  const children = theGroup.getChildren();
  for (let i = 0; i < children.length; i++){
    children[i].setDepth(theDepth);
  }
}

function stopDragging (gameObject, pointer) {
    // Only stop the drag if the object is currently being dragged
    //if (gameObject.input.dragState > 0) { // The drag state is 2 when the object is being dragged
        // Emit the dragend event manually
        gameObject.emit('dragend', pointer, gameObject.input.dragX, gameObject.input.dragY);

        // set pointer properties to simulate the pointer being released
        pointer.isDown = false;
        pointer.isUp = true;
        pointer.justUp = true;
        pointer.wasTouch = false;
        pointer.wasCanceled = false;
        gameObject.input.dragState = 0; // Reset the drag state

        gameObject.input.enabled = false;
        gameObject.scene.time.delayedCall(100, function() {
            gameObject.input.enabled = true;
        });

    //}
}


// ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ##
// DOM helpers

// check for DOM input field, do not allow numbers
function isValidName(evt) {
  var charCode = evt.which ? evt.which : evt.keyCode;
  if (charCode === 13) evt.target.blur();
  return charCode > 31 && (charCode < 48 || charCode > 57);
}

// creates a div element to display on top of everything
// can be used to display the Hintpad IP or other relevant info
function tempAlert(msg, durationInMS) {
  var el = document.createElement("div");
  el.setAttribute("style", "font-size:large;position:absolute;top:5%;left:5%;color:white;background-color:black;");
  el.innerHTML = msg;
  setTimeout(function () {
    el.parentNode.removeChild(el);
  }, durationInMS);
  document.body.appendChild(el);
}

// load a font face
function loadFont(name, url) {
  log("loading font: ", name, url);
  var newFont = new FontFace(name, "url(" + url + ")");
  newFont
    .load()
    .then(function (loaded) {
      document.fonts.add(loaded);
    })
    .catch(function (error) {
      return error;
    });
}

// log function that keeps reference to invoking line
// use instead of console.log()
function log() {
  if (gameConfig.devMode && !gameConfig.devModeOptions.disableConsoleLog) {
    if (window.console) {
      // Only run on the first time through - reset this function to the appropriate console.log helper
      if (Function.prototype.bind) {
        log = Function.prototype.bind.call(console.log, console);
      } else {
        log = function () {
          Function.prototype.apply.call(console.log, console, arguments);
        };
      }
      log.apply(this, arguments);
    }
  }
}

function videoStartPoint(video) {
  if (gameConfig.devModeOptions.skipVideo) {
    return video.getDuration() - 1;
  } else {
    return 0;
  }
}

// ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ##
// TIME

// convert seconds to Minutes:Seconds format
function formatTime(time) {
  var negativeFlag = false;
  if (time < 0) {
    time = time * -1;
    negativeFlag = true;
  }
  //transforms miliseconds to seconds since timer recieves milis.
  time = time / 1000;

  var hrs = ~~(time / 3600);
  var mins = ~~((time % 3600) / 60);
  var secs = ~~time % 60;
  var ret = "";
  if (hrs > 0) {
    ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
  }
  ret += (mins < 10 ? "0" : "") + mins + ":" + (secs < 10 ? "0" : "");
  ret += "" + secs;
  if (negativeFlag) {
    return "-" + ret;
  }
  return ret;
}

function millisToMs(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return seconds == 60 ? minutes + 1 + ":00" : minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

function secondsToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor((d % 3600) / 60);
  var s = Math.floor((d % 3600) % 60);

  var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  return hDisplay + mDisplay + sDisplay;
}

function secToTime(seconds) {
  var date = new Date(null);
  date.setSeconds(seconds);
  return date.toISOString().substr(14, 5);
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function moveMe(scene, obj, y, { duration = 500, repeat = 0 }) {
  // log(obj);
  var tween = scene.tweens.add({
    targets: obj,
    ease: "Linear", // 'Cubic', 'Elastic', 'Bounce', 'Back'
    duration: duration,
    y: y,
    repeat: repeat,
  });
}

/*
  return a rounded float with 2 decimal places AS A STRING!
  1.123456 -> 1.12
  1.1      -> 1.10
*/
function roundTwoDecimals(num) {
  return (Math.round(num * Math.pow(10, 2)) / Math.pow(10, 2)).toFixed(2);
}

/*
  return a rounded float with given decimal places & base
*/
function toFixedNumber(num, digits, base) {
  const pow = Math.pow(base ?? 10, digits);
  return Math.round(num * pow) / pow;
}

/*
  return the decimal part of a float value
*/
function getDecimalPortion(float) {
  return float - Math.trunc(float);
}

// find the (sub-)object that contains a certain key
function getKeyReference(object, key) {
  function f(o) {
    if (!o || typeof o !== "object") {
      return;
    }
    if (key in o) {
      reference = o;
      return true;
    }
    Object.keys(o).some(function (k) {
      return f(o[k]);
    });
  }
  var reference;
  f(object);
  return reference;
}

// return the item with a given 'itemIndex' parameter
function getItem (array, itemIndex) {
  return array.find ( item => item.itemIndex === itemIndex)
}

// remove the item with a given 'itemIndex' parameter, returns true on success
function removeItemFromArray (array, itemIndex) {
  const index = array.findIndex (item => item.itemIndex === itemIndex);
  if (index != -1) {
    array.splice (index, 1);
    return true
  }
  return false
}

// checks if a string is numeric, contains no other chars
// and can be displayed as a numeric value
function isNumeric(str) {
  if (typeof str != "string") return false; // we only process strings!
  return !isNaN(str) && !isNaN(parseFloat(str));
}

/**
 * calculates the time a certain number of frames take with a given frame rate
 **/
function framesToMilliseconds ( frameRate, numberOfFrames ) {
  if (frameRate<=0) {
    log ("FRAME RATE MUST BE > 0");
    return null
  }
  const ms = (numberOfFrames / frameRate) * 1000;
  return Math.round (ms)
}

// ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ##
// ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ##

// display bounds of an interactive game object
function showBounds(scene, sprite) {
  let debugRect = scene.add
    .rectangle(sprite.x, sprite.y, sprite.displayWidth, sprite.displayHeight)
    .setOrigin(sprite.originX, sprite.originY)
    .setStrokeStyle(4, 0x1a65ac)
    .setDepth(100);

  if (!gameConfig.devModeOptions.showBounds) {
    debugRect.setAlpha(0);
  }
  return debugRect;
}

////////////////// New Stuff ////////////////////////////

function showTweenText(targetScene, x, y, color, text) {
  var tweenText = targetScene.add.text(x, y, text, {
    align: "center",
    fontFamily: "Arial",
    color: color,
    fontSize: "42px",
    wordWrap: { width: 450 },
  });
  tweenText.alpha = 0.8;
  this.tween = targetScene.tweens.add({
    targets: tweenText,
    alpha: 0,
    y: 1000,
    duration: 1000,
  });
  this.timedEvent = targetScene.time.delayedCall(1000, onEvent, [], this);
  function onEvent() {
    tweenText.destroy();
  }
}




/**
 * Gibt eine Phaser.Vector2-Position für ein Objekt in einer Spirale zurück.
 * 
 * @param {'archimedes' | 'logarithmisch' | 'fermat' | 'fibonacci' | 'golden'} spiralform
 * @param {number} index - Index des Objekts (0 = Mitte)
 * @param {number} abstand - Abstand oder Skalierungsfaktor (je nach Spiralform unterschiedlich interpretiert)
 * @param {number} centerX - Mittelpunkt X
 * @param {number} centerY - Mittelpunkt Y
 * @returns {Phaser.Math.Vector2} - Absolute Position
 */
function getSpiralPosition(spiralform, index, abstand, centerX, centerY) {
  let angle, radius;

  switch (spiralform) {
    case 'arch':
      angle = index * 0.5;
      radius = abstand * index;
      break;

    case 'log':
      angle = index * 0.5;
      const b = 0.2; // Spiralweite
      radius = abstand * Math.exp(b * index);
      break;

    case 'fermat':
      // Fermat-Spirale: r = c * sqrt(n), θ = n * π
      angle = index * Math.PI;
      radius = abstand * Math.sqrt(index);
      break;

    case 'fibonacci':
    case 'golden':
      const goldenAngle = Phaser.Math.DegToRad(137.5); // ≈ 137.5°
      angle = index * goldenAngle;
      radius = abstand * Math.sqrt(index); // wie Fermat, aber mit goldenem Winkel
      break;

    default:
      angle = index * 0.5;
      radius = abstand * index;
      break;
  }

  const x = centerX + Math.cos(angle) * radius;
  const y = centerY + Math.sin(angle) * radius;

  return new Phaser.Math.Vector2(x, y);
}

