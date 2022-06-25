const defaultDecimals = 4;

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
