var FFT =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/fft/fft.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/fft/fft.js":
/*!************************!*\
  !*** ./src/fft/fft.js ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nfunction FFT(size) {\n  this.size = size | 0;\n  if (this.size <= 1 || (this.size & this.size - 1) !== 0) throw new Error('FFT size must be a power of two and bigger than 1');\n  this._csize = size << 1; // NOTE: Use of `var` is intentional for old V8 versions\n\n  var table = new Array(this.size * 2);\n\n  for (var i = 0; i < table.length; i += 2) {\n    var angle = Math.PI * i / this.size;\n    table[i] = Math.cos(angle);\n    table[i + 1] = -Math.sin(angle);\n  }\n\n  this.table = table; // Find size's power of two\n\n  var power = 0;\n\n  for (var t = 1; this.size > t; t <<= 1) {\n    power++;\n  } // Calculate initial step's width:\n  //   * If we are full radix-4 - it is 2x smaller to give inital len=8\n  //   * Otherwise it is the same as `power` to give len=4\n\n\n  this._width = power % 2 === 0 ? power - 1 : power; // Pre-compute bit-reversal patterns\n\n  this._bitrev = new Array(1 << this._width);\n\n  for (var j = 0; j < this._bitrev.length; j++) {\n    this._bitrev[j] = 0;\n\n    for (var shift = 0; shift < this._width; shift += 2) {\n      var revShift = this._width - shift - 2;\n      this._bitrev[j] |= (j >>> shift & 3) << revShift;\n    }\n  }\n\n  this._out = null;\n  this._data = null;\n  this._inv = 0;\n}\n\nFFT.prototype.fromComplexArray = function fromComplexArray(complex, storage) {\n  var res = storage || new Array(complex.length >>> 1);\n\n  for (var i = 0; i < complex.length; i += 2) {\n    res[i >>> 1] = complex[i];\n  }\n\n  return res;\n};\n\nFFT.prototype.createComplexArray = function createComplexArray() {\n  var res = new Array(this._csize);\n\n  for (var i = 0; i < res.length; i++) {\n    res[i] = 0;\n  }\n\n  return res;\n};\n\nFFT.prototype.toComplexArray = function toComplexArray(input, storage) {\n  var res = storage || this.createComplexArray();\n\n  for (var i = 0; i < res.length; i += 2) {\n    res[i] = input[i >>> 1];\n    res[i + 1] = 0;\n  }\n\n  return res;\n};\n\nFFT.prototype.completeSpectrum = function completeSpectrum(spectrum) {\n  var size = this._csize;\n  var half = size >>> 1;\n\n  for (var i = 2; i < half; i += 2) {\n    spectrum[size - i] = spectrum[i];\n    spectrum[size - i + 1] = -spectrum[i + 1];\n  }\n};\n\nFFT.prototype.transform = function transform(out, data) {\n  if (out === data) throw new Error('Input and output buffers must be different');\n  this._out = out;\n  this._data = data;\n  this._inv = 0;\n\n  this._transform4();\n\n  this._out = null;\n  this._data = null;\n};\n\nFFT.prototype.realTransform = function realTransform(out, data) {\n  if (out === data) throw new Error('Input and output buffers must be different');\n  this._out = out;\n  this._data = data;\n  this._inv = 0;\n\n  this._realTransform4();\n\n  this._out = null;\n  this._data = null;\n};\n\nFFT.prototype.inverseTransform = function inverseTransform(out, data) {\n  if (out === data) throw new Error('Input and output buffers must be different');\n  this._out = out;\n  this._data = data;\n  this._inv = 1;\n\n  this._transform4();\n\n  for (var i = 0; i < out.length; i++) {\n    out[i] /= this.size;\n  }\n\n  this._out = null;\n  this._data = null;\n}; // radix-4 implementation\n//\n// NOTE: Uses of `var` are intentional for older V8 version that do not\n// support both `let compound assignments` and `const phi`\n\n\nFFT.prototype._transform4 = function _transform4() {\n  var out = this._out;\n  var size = this._csize; // Initial step (permute and transform)\n\n  var width = this._width;\n  var step = 1 << width;\n  var len = size / step << 1;\n  var outOff;\n  var t;\n  var bitrev = this._bitrev;\n\n  if (len === 4) {\n    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {\n      var off = bitrev[t];\n\n      this._singleTransform2(outOff, off, step);\n    }\n  } else {\n    // len === 8\n    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {\n      var _off = bitrev[t];\n\n      this._singleTransform4(outOff, _off, step);\n    }\n  } // Loop through steps in decreasing order\n\n\n  var inv = this._inv ? -1 : 1;\n  var table = this.table;\n\n  for (step >>= 2; step >= 2; step >>= 2) {\n    len = size / step << 1;\n    var quarterLen = len >>> 2; // Loop through offsets in the data\n\n    for (outOff = 0; outOff < size; outOff += len) {\n      // Full case\n      var limit = outOff + quarterLen;\n\n      for (var i = outOff, k = 0; i < limit; i += 2, k += step) {\n        var A = i;\n        var B = A + quarterLen;\n        var C = B + quarterLen;\n        var D = C + quarterLen; // Original values\n\n        var Ar = out[A];\n        var Ai = out[A + 1];\n        var Br = out[B];\n        var Bi = out[B + 1];\n        var Cr = out[C];\n        var Ci = out[C + 1];\n        var Dr = out[D];\n        var Di = out[D + 1]; // Middle values\n\n        var MAr = Ar;\n        var MAi = Ai;\n        var tableBr = table[k];\n        var tableBi = inv * table[k + 1];\n        var MBr = Br * tableBr - Bi * tableBi;\n        var MBi = Br * tableBi + Bi * tableBr;\n        var tableCr = table[2 * k];\n        var tableCi = inv * table[2 * k + 1];\n        var MCr = Cr * tableCr - Ci * tableCi;\n        var MCi = Cr * tableCi + Ci * tableCr;\n        var tableDr = table[3 * k];\n        var tableDi = inv * table[3 * k + 1];\n        var MDr = Dr * tableDr - Di * tableDi;\n        var MDi = Dr * tableDi + Di * tableDr; // Pre-Final values\n\n        var T0r = MAr + MCr;\n        var T0i = MAi + MCi;\n        var T1r = MAr - MCr;\n        var T1i = MAi - MCi;\n        var T2r = MBr + MDr;\n        var T2i = MBi + MDi;\n        var T3r = inv * (MBr - MDr);\n        var T3i = inv * (MBi - MDi); // Final values\n\n        var FAr = T0r + T2r;\n        var FAi = T0i + T2i;\n        var FCr = T0r - T2r;\n        var FCi = T0i - T2i;\n        var FBr = T1r + T3i;\n        var FBi = T1i - T3r;\n        var FDr = T1r - T3i;\n        var FDi = T1i + T3r;\n        out[A] = FAr;\n        out[A + 1] = FAi;\n        out[B] = FBr;\n        out[B + 1] = FBi;\n        out[C] = FCr;\n        out[C + 1] = FCi;\n        out[D] = FDr;\n        out[D + 1] = FDi;\n      }\n    }\n  }\n}; // radix-2 implementation\n//\n// NOTE: Only called for len=4\n\n\nFFT.prototype._singleTransform2 = function _singleTransform2(outOff, off, step) {\n  var out = this._out;\n  var data = this._data;\n  var evenR = data[off];\n  var evenI = data[off + 1];\n  var oddR = data[off + step];\n  var oddI = data[off + step + 1];\n  var leftR = evenR + oddR;\n  var leftI = evenI + oddI;\n  var rightR = evenR - oddR;\n  var rightI = evenI - oddI;\n  out[outOff] = leftR;\n  out[outOff + 1] = leftI;\n  out[outOff + 2] = rightR;\n  out[outOff + 3] = rightI;\n}; // radix-4\n//\n// NOTE: Only called for len=8\n\n\nFFT.prototype._singleTransform4 = function _singleTransform4(outOff, off, step) {\n  var out = this._out;\n  var data = this._data;\n  var inv = this._inv ? -1 : 1;\n  var step2 = step * 2;\n  var step3 = step * 3; // Original values\n\n  var Ar = data[off];\n  var Ai = data[off + 1];\n  var Br = data[off + step];\n  var Bi = data[off + step + 1];\n  var Cr = data[off + step2];\n  var Ci = data[off + step2 + 1];\n  var Dr = data[off + step3];\n  var Di = data[off + step3 + 1]; // Pre-Final values\n\n  var T0r = Ar + Cr;\n  var T0i = Ai + Ci;\n  var T1r = Ar - Cr;\n  var T1i = Ai - Ci;\n  var T2r = Br + Dr;\n  var T2i = Bi + Di;\n  var T3r = inv * (Br - Dr);\n  var T3i = inv * (Bi - Di); // Final values\n\n  var FAr = T0r + T2r;\n  var FAi = T0i + T2i;\n  var FBr = T1r + T3i;\n  var FBi = T1i - T3r;\n  var FCr = T0r - T2r;\n  var FCi = T0i - T2i;\n  var FDr = T1r - T3i;\n  var FDi = T1i + T3r;\n  out[outOff] = FAr;\n  out[outOff + 1] = FAi;\n  out[outOff + 2] = FBr;\n  out[outOff + 3] = FBi;\n  out[outOff + 4] = FCr;\n  out[outOff + 5] = FCi;\n  out[outOff + 6] = FDr;\n  out[outOff + 7] = FDi;\n}; // Real input radix-4 implementation\n\n\nFFT.prototype._realTransform4 = function _realTransform4() {\n  var out = this._out;\n  var size = this._csize; // Initial step (permute and transform)\n\n  var width = this._width;\n  var step = 1 << width;\n  var len = size / step << 1;\n  var outOff;\n  var t;\n  var bitrev = this._bitrev;\n\n  if (len === 4) {\n    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {\n      var off = bitrev[t];\n\n      this._singleRealTransform2(outOff, off >>> 1, step >>> 1);\n    }\n  } else {\n    // len === 8\n    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {\n      var _off2 = bitrev[t];\n\n      this._singleRealTransform4(outOff, _off2 >>> 1, step >>> 1);\n    }\n  } // Loop through steps in decreasing order\n\n\n  var inv = this._inv ? -1 : 1;\n  var table = this.table;\n\n  for (step >>= 2; step >= 2; step >>= 2) {\n    len = size / step << 1;\n    var halfLen = len >>> 1;\n    var quarterLen = halfLen >>> 1;\n    var hquarterLen = quarterLen >>> 1; // Loop through offsets in the data\n\n    for (outOff = 0; outOff < size; outOff += len) {\n      for (var i = 0, k = 0; i <= hquarterLen; i += 2, k += step) {\n        var A = outOff + i;\n        var B = A + quarterLen;\n        var C = B + quarterLen;\n        var D = C + quarterLen; // Original values\n\n        var Ar = out[A];\n        var Ai = out[A + 1];\n        var Br = out[B];\n        var Bi = out[B + 1];\n        var Cr = out[C];\n        var Ci = out[C + 1];\n        var Dr = out[D];\n        var Di = out[D + 1]; // Middle values\n\n        var MAr = Ar;\n        var MAi = Ai;\n        var tableBr = table[k];\n        var tableBi = inv * table[k + 1];\n        var MBr = Br * tableBr - Bi * tableBi;\n        var MBi = Br * tableBi + Bi * tableBr;\n        var tableCr = table[2 * k];\n        var tableCi = inv * table[2 * k + 1];\n        var MCr = Cr * tableCr - Ci * tableCi;\n        var MCi = Cr * tableCi + Ci * tableCr;\n        var tableDr = table[3 * k];\n        var tableDi = inv * table[3 * k + 1];\n        var MDr = Dr * tableDr - Di * tableDi;\n        var MDi = Dr * tableDi + Di * tableDr; // Pre-Final values\n\n        var T0r = MAr + MCr;\n        var T0i = MAi + MCi;\n        var T1r = MAr - MCr;\n        var T1i = MAi - MCi;\n        var T2r = MBr + MDr;\n        var T2i = MBi + MDi;\n        var T3r = inv * (MBr - MDr);\n        var T3i = inv * (MBi - MDi); // Final values\n\n        var FAr = T0r + T2r;\n        var FAi = T0i + T2i;\n        var FBr = T1r + T3i;\n        var FBi = T1i - T3r;\n        out[A] = FAr;\n        out[A + 1] = FAi;\n        out[B] = FBr;\n        out[B + 1] = FBi; // Output final middle point\n\n        if (i === 0) {\n          var FCr = T0r - T2r;\n          var FCi = T0i - T2i;\n          out[C] = FCr;\n          out[C + 1] = FCi;\n          continue;\n        } // Do not overwrite ourselves\n\n\n        if (i === hquarterLen) continue; // In the flipped case:\n        // MAi = -MAi\n        // MBr=-MBi, MBi=-MBr\n        // MCr=-MCr\n        // MDr=MDi, MDi=MDr\n\n        var ST0r = T1r;\n        var ST0i = -T1i;\n        var ST1r = T0r;\n        var ST1i = -T0i;\n        var ST2r = -inv * T3i;\n        var ST2i = -inv * T3r;\n        var ST3r = -inv * T2i;\n        var ST3i = -inv * T2r;\n        var SFAr = ST0r + ST2r;\n        var SFAi = ST0i + ST2i;\n        var SFBr = ST1r + ST3i;\n        var SFBi = ST1i - ST3r;\n        var SA = outOff + quarterLen - i;\n        var SB = outOff + halfLen - i;\n        out[SA] = SFAr;\n        out[SA + 1] = SFAi;\n        out[SB] = SFBr;\n        out[SB + 1] = SFBi;\n      }\n    }\n  }\n}; // radix-2 implementation\n//\n// NOTE: Only called for len=4\n\n\nFFT.prototype._singleRealTransform2 = function _singleRealTransform2(outOff, off, step) {\n  var out = this._out;\n  var data = this._data;\n  var evenR = data[off];\n  var oddR = data[off + step];\n  var leftR = evenR + oddR;\n  var rightR = evenR - oddR;\n  out[outOff] = leftR;\n  out[outOff + 1] = 0;\n  out[outOff + 2] = rightR;\n  out[outOff + 3] = 0;\n}; // radix-4\n//\n// NOTE: Only called for len=8\n\n\nFFT.prototype._singleRealTransform4 = function _singleRealTransform4(outOff, off, step) {\n  var out = this._out;\n  var data = this._data;\n  var inv = this._inv ? -1 : 1;\n  var step2 = step * 2;\n  var step3 = step * 3; // Original values\n\n  var Ar = data[off];\n  var Br = data[off + step];\n  var Cr = data[off + step2];\n  var Dr = data[off + step3]; // Pre-Final values\n\n  var T0r = Ar + Cr;\n  var T1r = Ar - Cr;\n  var T2r = Br + Dr;\n  var T3r = inv * (Br - Dr); // Final values\n\n  var FAr = T0r + T2r;\n  var FBr = T1r;\n  var FBi = -T3r;\n  var FCr = T0r - T2r;\n  var FDr = T1r;\n  var FDi = T3r;\n  out[outOff] = FAr;\n  out[outOff + 1] = 0;\n  out[outOff + 2] = FBr;\n  out[outOff + 3] = FBi;\n  out[outOff + 4] = FCr;\n  out[outOff + 5] = 0;\n  out[outOff + 6] = FDr;\n  out[outOff + 7] = FDi;\n};\n\nmodule.exports = FFT;\n\n//# sourceURL=webpack://FFT/./src/fft/fft.js?");

/***/ })

/******/ });