function round(number, decimals = defaultDecimals) {
  const factor = decimals ? Math.pow(10, decimals) : 1;
  return Math.round(number * factor) / factor;
}

function getPerc(value, total, decimals = defaultDecimals) {
  return round(!total ? value : value * 100 / total, decimals);
}

function getRandomNumber(max, min = 0, decimals = defaultDecimals) {
  return round((Math.random() * (max - min)) + min, decimals);
}

function getRandomHexColor() {
  const a = getRandomNumber(256);
  const b = getRandomNumber(256);
  const c = getRandomNumber(256);
  return `#${((256+a<<8|b)<<8|c).toString(16).slice(1)}`;
}

function preventDefault(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
}

function findValueWithMagnetism(currentValue, magnetimsValues, tolerance) {
  for (let i = 0; i < magnetimsValues.length; i++) {
    if (Math.abs(currentValue - magnetimsValues[i][0]) <= tolerance) {
      return [magnetimsValues[i][0], magnetimsValues[i][1], true];
    }
  }

  return [currentValue, false, false];
}

function arrayOrderStringUp(a, b) {
  if (a > b) return +1;
  if (a < b) return -1;
  return 0;
}

function getNumberInBetween(a, b, c, decimals = defaultDecimals) {
  return round([a, b, c].sort(arrayOrderStringUp)[1], decimals);
}

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
function randomString(length) {
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

function getDomRect(dom, offsetX = 0, offsetY = 0) {
  const rect = JSON.parse(JSON.stringify(dom.getBoundingClientRect()));
  rect.left = rect.x = (rect.left - offsetX);
  rect.right = (rect.right - offsetX);
  rect.top = rect.y = (rect.top - offsetY);
  rect.bottom = (rect.bottom - offsetY);
  rect.centerX = round(rect.left + (rect.width / 2), 1);
  rect.centerY = round(rect.top + (rect.height / 2), 1);
  return rect;
}

function getPointProjectionOnLine(x1, y1, x2, y2, x3, y3) {
  // points {x1, y1} and {x2, y2} define the line
  // point {x3, y3} is the point to project on the line
  let x4, y4;
  const slopeLine1 = getSlopeCoefficientBetweenTwoPoints(x1, y1, x2, y2);
  if (slopeLine1 === 0) {
    x4 = x3;
    y4 = y1;
  } else if (isFinite(slopeLine1)) {
    const line2 = getPerpendicularLineFunctionPassingByPoint(slopeLine1, x3, y3);
    if (x3 === x1) {
      x4 = x2;
    } else {
      x4 = x1;
    }
    y4 = line2(x4);
  } else {
    x4 = x1;
    y4 = y3;
  }
  return getIntersectionBetween4Points(x1, y1, x2, y2, x3, y3, x4, y4);
}

function getSlopeCoefficientBetweenTwoPoints(x1, y1, x2, y2) {
  return (y2 - y1) / (x2 - x1);
}

function getPerpendicularLineFunctionPassingByPoint(slope, x1, y1) {
  return (x) => (-1 / slope) * (x - x1) + y1;
}

function getIntersectionBetween4Points(x1, y1, x2, y2, x3, y3, x4, y4, decimals = defaultDecimals) {
  // points {x1, y1} and {x2, y2} define the first line
  // points {x3, y3} and {x4, y4} define the second line
  let ua, denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) {
    return [false, false];
  }
  ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  return [
    round(x1 + ua * (x2 - x1), decimals),
    round(y1 + ua * (y2 - y1), decimals),
  ];
}

function isEqual(obj1, obj2) {
	function getType (obj) {
		return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
	}
	function areArraysEqual() {
		// Check length
		if (obj1.length !== obj2.length) return false;
		// Check each item in the array
		for (let i = 0; i < obj1.length; i++) {
			if (!isEqual(obj1[i], obj2[i])) return false;
		}
		// If no errors, return true
		return true;
	}
	function areObjectsEqual() {
		if (Object.keys(obj1).length !== Object.keys(obj2).length) return false;

		// Check each item in the object
		for (let key in obj1) {
			if (Object.prototype.hasOwnProperty.call(obj1, key)) {
				if (!isEqual(obj1[key], obj2[key])) return false;
			}
		}
		return true;
	}
	function areFunctionsEqual() {
		return obj1.toString() === obj2.toString();
	}
	function arePrimativesEqual() {
		return obj1 === obj2;
	}
	// Get the object type
	const type = getType(obj1);
	// If the two items are not the same type, return false
	if (type !== getType(obj2)) return false;
	// Compare based on type
	if (type === 'array') return areArraysEqual();
	if (type === 'object') return areObjectsEqual();
	if (type === 'function') return areFunctionsEqual();
	return arePrimativesEqual();
}

function getAngleDegBetweenTwoPoints(x1, y1, x2, y2) {
  return convertAngleRadToDeg(getAngleRadBetweenTwoPoints(x1, y1, x2, y2));
}

function getAngleRadBetweenTwoPoints(x1, y1, x2, y2) {
  const m1 = x2 - x1;
  const m2 = y2 - y1;
  if (m1 > 0 && m2 > 0) { // first quadrant
    return (Math.atan(m2 / m1));
  } else if (m1 < 0 && m2 > 0) { // second quadrant
    return (Math.atan(m2 / m1) + Math.PI);
  } else if (m1 < 0 && m2 < 0) { // third quadrant
    return (Math.atan(m2 / m1) + Math.PI);
  } else if (m1 > 0 && m2 < 0) { // fourth quadrant
    return (Math.atan(m2 / m1) + Math.PI * 2);
  } else {
    // multiples of 90
    if (m1 === 0) {
      if (m2 > 0) {
        return Math.PI / 2;
      } else {
        return Math.PI * 1.5;
      }
    } else {
      if (m1 > 0) {
        return 0;
      } else {
        return Math.PI;
      }
    }
  }
}

function convertAngleRadToDeg(rad) {
  return rad * 180 / Math.PI;
}

function getMiddlePointCoords(x1, y1, x2, y2, decimals = defaultDecimals) {
  return [
    round((x1 + x2) / 2, decimals),
    round((y1 + y2) / 2, decimals),
  ];
}

function roundAngleForSteps(deg, step = 3, interval = 45) {
  const delta = deg % interval;
  if (Math.abs(Math.trunc(delta)) < step) {
    return deg - delta;
  }
  if (Math.abs(Math.trunc(delta)) > interval - step) {
    if (delta > 0) {
      return Math.round(deg + interval - delta);
    } else {
      return Math.round(deg - interval - delta);
    }
  }
  return deg;
}
