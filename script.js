// CONFIG
const elementsCount = 5;
const rotationMagnetismStep = 45; // degrees
const tolerances = {
  dragAndResize: 1,  // % of the container
  rotation: 2.5,     // degrees
};
const activeElementsRate = 1;
let containerWidth = 0, containerHeight = 0;
let containerLeft = 0, containerTop = 0;


// STATE
const draggableElements = [];
const magnetismCoords = {
  x: [], // center X
  y: [], // center Y
  l: [], // left side
  t: [], // top side
  r: [], // right side
  b: [], // bottom side
};
let resizeMode = true;
let magnetismIsActive = true;
let currentSelectedId = false; // string or false
let currentSelectedElement = false;
let canGoOutside = true;
// if canGoOutside === true --> elements can go 50% outside the container in each direction (their center is always inside the container)
// if canGoOutside === false --> elements can not go outside the container


// DOM REF
let mainWrapper;
let magnetisedLineX, magnetisedLineY, magnetisedLineR;



// UPDATE MAGNETISM COORDS WHENEVER NECESSARY
const cleanMagnetismCoords = () => {
  magnetismCoords.x = [];
  magnetismCoords.y = [];
  magnetismCoords.l = [];
  magnetismCoords.t = [];
  magnetismCoords.r = [];
  magnetismCoords.b = [];
};

const updateMagnetismCoordsIfNeeded = () => {
  cleanMagnetismCoords();
  if (resizeMode && currentSelectedId) {
    const selectedElement = draggableElements.find(e => e.id === currentSelectedId);
    if (selectedElement && selectedElement.active) {
      const elementHasRotation = !!selectedElement.rotation;
      magnetismCoords.x = getMagnetismCoordsXForElement(currentSelectedId);
      magnetismCoords.y = getMagnetismCoordsYForElement(currentSelectedId);
      if (!elementHasRotation) { // this version does not support left right top bottom allignement for rotated elements
        magnetismCoords.l = getMagnetismCoordsLeftForElement(currentSelectedId);
        magnetismCoords.t = getMagnetismCoordsTopForElement(currentSelectedId);
        magnetismCoords.r = getMagnetismCoordsRightForElement(currentSelectedId);
        magnetismCoords.b = getMagnetismCoordsBottomForElement(currentSelectedId);
      }
	  }
  }
};

const getMagnetismCoordsXForElement = (elementId) => {
  // Returns magnetism coords for element centerX position (during drag and drop).
  const draggedElement = draggableElements.find(e => e.id === elementId);
  const draggedElementHasRotation = !!draggedElement.rotation;

  const coords = [];
  coords.push([round(50, defaultDecimals), 50]); // dragged element centerX with container centerX

  if (!draggedElementHasRotation) { // this version does not support left right top bottom allignement for rotated elements
    coords.push([round(draggedElement.width / 2, defaultDecimals), false]); // dragged element centerX with container left side
    coords.push([round(100 - draggedElement.width / 2, defaultDecimals), false]); // dragged element centerX with container right side
    coords.push([round(50 + draggedElement.width / 2, defaultDecimals), 50]); // dragged element left side with container centerX
    coords.push([round(50 - draggedElement.width / 2, defaultDecimals),  50]); // dragged element right side with container centerX
  }

  draggableElements
    .filter(e => e.active && e.id !== elementId)
    .forEach(e => {
      const elementHasRotation = !!e.rotation;
      coords.push([e.x, e.x]); // dragged element centerX with others elements centerX
      if (!draggedElementHasRotation && !elementHasRotation) { // this version does not support left right top bottom allignement for rotated elements
        const elementLeft = round(e.x - (e.width / 2), defaultDecimals);
        const elementRight = round(e.x + (e.width / 2), defaultDecimals);
        if (elementLeft > 0) { // if element left side is currently visible
          coords.push([round(elementLeft + (draggedElement.width / 2), 1), elementLeft]); // dragged element left side with others elements left side
          coords.push([round(elementLeft - (draggedElement.width / 2), 1), elementLeft]); // dragged element right side with others elements left side
        }
        if (elementRight < 100) { // if element right side is currently visible
          coords.push([round(elementRight + (draggedElement.width / 2), 1), elementRight]); // dragged element left side with others elements right side
          coords.push([round(elementRight - (draggedElement.width / 2), 1), elementRight]); // dragged element right side with others elements right side
        }
      }
    })

  return coords;
};

const getMagnetismCoordsYForElement = (elementId) => {
  // Returns magnetism coords for element centerY position (during drag and drop).
  const draggedElement = draggableElements.find(e => e.id === elementId);
  const draggedElementHasRotation = !!draggedElement.rotation;

  const coords = [];
  coords.push([round(50, defaultDecimals), 50]); // dragged element centerY with container centerY

  if (!draggedElementHasRotation) { // this version does not support left right top bottom allignement for rotated elements
    coords.push([round(draggedElement.height / 2, defaultDecimals), false]); // dragged element centerY with container top side
    coords.push([round(100 - draggedElement.height / 2, defaultDecimals), false]); // dragged element centerY with container bottom side
    coords.push([round(50 + draggedElement.height / 2, defaultDecimals), 50]); // dragged element left side with container centerY
    coords.push([round(50 - draggedElement.height / 2, defaultDecimals),  50]); // dragged element right side with container centerY
  }

  draggableElements
    .filter(e => e.active && e.id !== elementId)
    .forEach(e => {
      const elementHasRotation = !!e.rotation;
      coords.push([e.y, e.y]); // dragged element centerY with others elements centerY
      if (!draggedElementHasRotation && !elementHasRotation) { // this version does not support left right top bottom allignement for rotated elements
        const elementTop = round(e.y - (e.height / 2), defaultDecimals);
        const elementBottom = round(e.y + (e.height / 2), defaultDecimals);
        if (elementTop > 0) { // if element top side is currently visible
          coords.push([round(elementTop + (draggedElement.height / 2), 1), elementTop]); // dragged element top side with others elements top side
          coords.push([round(elementTop - (draggedElement.height / 2), 1), elementTop]); // dragged element bottom side with others elements top side
        }
        if (elementBottom < 100) { // if element bottom side is currently visible
          coords.push([round(elementBottom + (draggedElement.height / 2), 1), elementBottom]); // dragged element top side with others elements bottom side
          coords.push([round(elementBottom - (draggedElement.height / 2), 1), elementBottom]); // dragged element bottom side with others elements bottom side
        }
      }
    })

  return coords;
};

const getMagnetismCoordsLeftForElement = (elementId) => {
  // Returns magnetism coords for dragged element left side (during resize)
  const coords = [];
  coords.push([0, false]); // dragged element left side with container left side
  coords.push([round(50, 1), 50]); // dragged element left side with container centerX

  draggableElements
    .filter(e => e.active && e.id !== elementId)
    .forEach(e => {
      const elementLeft = round(e.x - (e.width / 2), defaultDecimals);
      const elementRight = round(e.x + (e.width / 2), defaultDecimals);
      if (elementLeft > 0) { // if element left side is currently visible
        coords.push([elementLeft, elementLeft]); // dragged element left side with others elements left side
      }
      if (elementRight < 100) { // if element right side is currently visible
        coords.push([elementRight, elementRight]); // dragged element left side with others elements right side
      }
    });

  return coords;
};

const getMagnetismCoordsRightForElement = (elementId) => {
  // Returns magnetism coords for dragged element right side (during resize)
  const coords = [];
  coords.push([100, false]); // dragged element right side with container right side
  coords.push([round(50, 1), 50]); // dragged element right side with container centerX

  draggableElements
    .filter(e => e.active && e.id !== elementId)
    .forEach(e => {
  	  const elementLeft = round(e.x - (e.width / 2), defaultDecimals);
      const elementRight = round(e.x + (e.width / 2), defaultDecimals);
      if (elementLeft > 0) { // if element left side is currently visible
        coords.push([elementLeft, elementLeft]); // dragged element right side with others elements left side
      }
      if (elementRight < 100 - 1) { // if element right side is currently visible
        coords.push([elementRight, elementRight]); // dragged element left side with others elements right side
      }
    });

  return coords;
};

const getMagnetismCoordsTopForElement = (elementId) => {
  // Returns magnetism coords for dragged element top side (during resize)
  const coords = [];
  coords.push([0, false]); // dragged element top side with container top side
  coords.push([round(50, 1), 50]); // dragged element top side with container centerY

  draggableElements
    .filter(e => e.active && e.id !== elementId)
    .forEach(e => {
      const elementTop = round(e.y - (e.height / 2), defaultDecimals);
      const elementBottom = round(e.y + (e.height / 2), defaultDecimals);
      if (elementTop > 0) { // if element top side is currently visible
        coords.push([elementTop, elementTop]); // dragged element top side with others elements top side
      }
      if (elementBottom < 100) { // if element bottom side is currently visible
        coords.push([elementBottom, elementBottom]); // dragged element top side with others elements bottom side
      }
    });

  return coords;
};

const getMagnetismCoordsBottomForElement = (elementId) => {
  // Returns magnetism coords for dragged element bottom side (during resize)
  const coords = [];
  coords.push([100, false]); // dragged element bottom side with container bottom side
  coords.push([round(50, 1), 50]); // dragged element bottom side with container centerY

  draggableElements
    .filter(e => e.active && e.id !== elementId)
    .forEach(e => {
      const elementTop = round(e.y - (e.height / 2), defaultDecimals);
      const elementBottom = round(e.y + (e.height / 2), defaultDecimals);
      if (elementTop > 0) { // if element top side is currently visible
        coords.push([elementTop, elementTop]); // dragged element bottom side with others elements top side
      }
      if (elementBottom < 100) { // if element bottom side is currently visible
        coords.push([elementBottom, elementBottom]); // dragged element bottom side with others elements bottom side
      }
    });

  return coords;
};



// DRAG AND DROP
let dragStartX = -1, dragStartY = -1;
let elementCoordXAtMouseDown = -1, elementCoordYAtMouseDown = -1;

const onElementPointerDown = (event, elementId) => {
  preventDefault(event);

  if (elementId !== currentSelectedId) {
    const element = document.querySelector(`#${elementId}`);
    if (!element.classList.contains('active')) {
      return;
    }
    currentSelectedElement = element;
    currentSelectedId = elementId;
    updateMagnetismCoordsIfNeeded();
  }

  const element = draggableElements.find(e => e.id === elementId);
  dragStartX = getPerc(event.clientX - containerLeft, containerWidth, defaultDecimals);
  dragStartY = getPerc(event.clientY - containerTop, containerHeight, defaultDecimals);
  elementCoordXAtMouseDown = element.x;
  elementCoordYAtMouseDown = element.y;

  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerEnd);
};

const onPointerMove = (event) => {
  preventDefault(event);
  const element = draggableElements.find(e => e.id === currentSelectedId);
  const dragDeltaX = getPerc(event.clientX - containerLeft, containerWidth, defaultDecimals) - dragStartX;
  const dragDeltaY = getPerc(event.clientY - containerTop, containerHeight, defaultDecimals) - dragStartY;
  let newElementX = elementCoordXAtMouseDown + dragDeltaX;
  let newElementY = elementCoordYAtMouseDown + dragDeltaY;
  let magnetisedCoordX, magnetisedCoordY;

  if (magnetismIsActive) {
    [newElementX, magnetisedCoordX] = findValueWithMagnetism(newElementX, magnetismCoords.x, tolerances.dragAndResize);
    [newElementY, magnetisedCoordY] = findValueWithMagnetism(newElementY, magnetismCoords.y, tolerances.dragAndResize);
  }

  if (canGoOutside) {
    newElementX = getNumberInBetween(0, newElementX, 100, defaultDecimals);
    newElementY = getNumberInBetween(0, newElementY, 100, defaultDecimals);
  } else {
    newElementX = getNumberInBetween(element.width / 2, newElementX, 100 - (element.width / 2), defaultDecimals);
    newElementY = getNumberInBetween(element.height / 2, newElementY, 100 - (element.height / 2), defaultDecimals);
  }

  element.x = newElementX;
  element.y = newElementY;
  currentSelectedElement.style.left = `${newElementX}%`;
  currentSelectedElement.style.top = `${newElementY}%`;

  if (magnetisedCoordX !== false) {
    magnetisedLineX.classList.remove('displayNone');
    magnetisedLineX.style.left = `${magnetisedCoordX}%`;
  } else {
    magnetisedLineX.classList.add('displayNone');
  }
  if (magnetisedCoordY !== false) {
    magnetisedLineY.classList.remove('displayNone');
    magnetisedLineY.style.top = `${magnetisedCoordY}%`;
  } else {
    magnetisedLineY.classList.add('displayNone');
  }
};

const onPointerEnd = (event) => {
  preventDefault(event);
  updateMagnetismCoordsIfNeeded();
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerEnd);
  magnetisedLineX.classList.add('displayNone');
  magnetisedLineY.classList.add('displayNone');
  magnetisedLineR.classList.add('displayNone');
};



// INIT
const createNewElementData = () => {
  const width = getRandomNumber(20, 15, 0);
  const height = getRandomNumber(20, 15, 0);
  return {
    id: randomString(10),
  	active: getRandomNumber(1) > activeElementsRate ? false : true,
  	x: getRandomNumber(100 - width / 2, width / 2, 0),
  	y: getRandomNumber(100 - height / 2, height / 2, 0),
  	width,
  	height,
  	rotation: 0,
  }
};

const appendNewElementDom = (newElementData, zIndex) => {
  const newElement = document.createElement('div');
  newElement.id = newElementData.id;
  newElement.style.cssText = `
    left: ${newElementData.x}%;
    top: ${newElementData.y}%;
    width: ${newElementData.width}%;
    height: ${newElementData.height}%;
    background-color: ${getRandomHexColor()};
    z-index: ${zIndex};
  `;
  newElement.classList.add('element');
  if (newElementData.active) {
    newElement.classList.add('active');
  }
  newElement.addEventListener('pointerdown', (event) => {
    onElementPointerDown(event, newElementData.id);
  });
  mainWrapper.append(newElement);
};

const initElements = () => {
  let i = 0;
  while (i < elementsCount) {
    i++;
    const newElement = createNewElementData();
    draggableElements.push(newElement);
    appendNewElementDom(newElement, i * 10);
  }
  console.log(draggableElements);
};

const initDom = () => {
  mainWrapper = document.querySelector('#mainWrapper');
  magnetisedLineX = document.querySelector('#magnetised-line-x');
  magnetisedLineY = document.querySelector('#magnetised-line-y');
  magnetisedLineR = document.querySelector('#magnetised-line-r');
  const width = 60 + getRandomNumber(30, 0);
  const height = 60 + getRandomNumber(30, 0);
  mainWrapper.style.cssText = `
    width: ${width}%;
    height: ${height}%;
  `;
  onResize()
};

const init = () => {
  initDom();
  initElements();
};

const onResize = () => {
  const rect = mainWrapper.getBoundingClientRect();
  containerWidth = round(rect.width, 0);
  containerHeight = round(rect.height, 0);
  containerLeft = round(rect.left, 0);
  containerTop = round(rect.top, 0);
};
const handleResize = debounce(onResize, 100);

window.addEventListener('resize', handleResize)
document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    init()
  }
};
