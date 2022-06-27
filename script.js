// CONFIG
const defaultDecimals = 5;
const elementsCount = 2;
const rotationMagnetismStep = 45; // degrees
const tolerances = {
  dragAndResize: 1,  // % of the container
  rotation: 2.5,     // degrees
};
const activeElementsRate = 1;
const elementMinSize = 10; // side % of container
let containerWidth = 0, containerHeight = 0;
let containerLeft = 0, containerTop = 0;


// STATE
const draggableElements = {};
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
let dragBox;
let T, R, B, L, TL, TR, BR, BL, RT;


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
    const selectedElementData = draggableElements[currentSelectedId];
    if (selectedElementData && selectedElementData.active) {
      const elementHasRotation = !!selectedElementData.r;
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
  const draggedElementData = draggableElements[elementId];
  const draggedElementDataHasRotation = !!draggedElementData.r;

  const coords = [];
  coords.push([round(50, defaultDecimals), 50]); // dragged element centerX with container centerX

  if (!draggedElementDataHasRotation) { // this version does not support left right top bottom allignement for rotated elements
    coords.push([round(draggedElementData.w / 2, defaultDecimals), false]); // dragged element centerX with container left side
    coords.push([round(100 - draggedElementData.w / 2, defaultDecimals), false]); // dragged element centerX with container right side
    coords.push([round(50 + draggedElementData.w / 2, defaultDecimals), 50]); // dragged element left side with container centerX
    coords.push([round(50 - draggedElementData.w / 2, defaultDecimals),  50]); // dragged element right side with container centerX
  }

  Object.values(draggableElements)
    .filter(elementData => elementData.active && elementData.id !== elementId)
    .forEach(elementData => {
      const elementHasRotation = !!elementData.r;
      coords.push([elementData.x, elementData.x]); // dragged element centerX with others elements centerX
      if (!draggedElementDataHasRotation && !elementHasRotation) { // this version does not support left right top bottom allignement for rotated elements
        const elementLeft = round(elementData.x - (elementData.w / 2), defaultDecimals);
        const elementRight = round(elementData.x + (elementData.w / 2), defaultDecimals);
        if (elementLeft > 0) { // if element left side is currently visible
          coords.push([round(elementLeft + (draggedElementData.w / 2), 1), elementLeft]); // dragged element left side with others elements left side
          coords.push([round(elementLeft - (draggedElementData.w / 2), 1), elementLeft]); // dragged element right side with others elements left side
        }
        if (elementRight < 100) { // if element right side is currently visible
          coords.push([round(elementRight + (draggedElementData.w / 2), 1), elementRight]); // dragged element left side with others elements right side
          coords.push([round(elementRight - (draggedElementData.w / 2), 1), elementRight]); // dragged element right side with others elements right side
        }
      }
    })

  return coords;
};

const getMagnetismCoordsYForElement = (elementId) => {
  // Returns magnetism coords for element centerY position (during drag and drop).
  const draggedElementData = draggableElements[elementId];
  const draggedElementDataHasRotation = !!draggedElementData.r;

  const coords = [];
  coords.push([round(50, defaultDecimals), 50]); // dragged element centerY with container centerY

  if (!draggedElementDataHasRotation) { // this version does not support left right top bottom allignement for rotated elements
    coords.push([round(draggedElementData.h / 2, defaultDecimals), false]); // dragged element centerY with container top side
    coords.push([round(100 - draggedElementData.h / 2, defaultDecimals), false]); // dragged element centerY with container bottom side
    coords.push([round(50 + draggedElementData.h / 2, defaultDecimals), 50]); // dragged element left side with container centerY
    coords.push([round(50 - draggedElementData.h / 2, defaultDecimals),  50]); // dragged element right side with container centerY
  }

  Object.values(draggableElements)
    .filter(elementData => elementData.active && elementData.id !== elementId)
    .forEach(elementData => {
      const elementHasRotation = !!elementData.r;
      coords.push([elementData.y, elementData.y]); // dragged element centerY with others elements centerY
      if (!draggedElementDataHasRotation && !elementHasRotation) { // this version does not support left right top bottom allignement for rotated elements
        const elementTop = round(elementData.y - (elementData.h / 2), defaultDecimals);
        const elementBottom = round(elementData.y + (elementData.h / 2), defaultDecimals);
        if (elementTop > 0) { // if element top side is currently visible
          coords.push([round(elementTop + (draggedElementData.h / 2), 1), elementTop]); // dragged element top side with others elements top side
          coords.push([round(elementTop - (draggedElementData.h / 2), 1), elementTop]); // dragged element bottom side with others elements top side
        }
        if (elementBottom < 100) { // if element bottom side is currently visible
          coords.push([round(elementBottom + (draggedElementData.h / 2), 1), elementBottom]); // dragged element top side with others elements bottom side
          coords.push([round(elementBottom - (draggedElementData.h / 2), 1), elementBottom]); // dragged element bottom side with others elements bottom side
        }
      }
    })

  return coords;
};

const getMagnetismCoordsLeftForElement = (elementId) => {
  // Returns magnetism coords for dragged element left side (during resize)
  const coords = [];
  coords.push([0, false]); // dragged element left side with container left side
  coords.push([50, 50]); // dragged element left side with container centerX

  Object.values(draggableElements)
    .filter(elementData => elementData.active && elementData.id !== elementId)
    .forEach(elementData => {
      const elementLeft = round(elementData.x - (elementData.w / 2), defaultDecimals);
      const elementRight = round(elementData.x + (elementData.w / 2), defaultDecimals);
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
  coords.push([50, 50]); // dragged element right side with container centerX

  Object.values(draggableElements)
    .filter(elementData => elementData.active && elementData.id !== elementId)
    .forEach(elementData => {
  	  const elementLeft = round(elementData.x - (elementData.w / 2), defaultDecimals);
      const elementRight = round(elementData.x + (elementData.w / 2), defaultDecimals);
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
  coords.push([50, 50]); // dragged element top side with container centerY

  Object.values(draggableElements)
    .filter(elementData => elementData.active && elementData.id !== elementId)
    .forEach(elementData => {
      const elementTop = round(elementData.y - (elementData.h / 2), defaultDecimals);
      const elementBottom = round(elementData.y + (elementData.h / 2), defaultDecimals);
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
  coords.push([50, 50]); // dragged element bottom side with container centerY

  Object.values(draggableElements)
    .filter(elementData => elementData.active && elementData.id !== elementId)
    .forEach(elementData => {
      const elementTop = round(elementData.y - (elementData.h / 2), defaultDecimals);
      const elementBottom = round(elementData.y + (elementData.h / 2), defaultDecimals);
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

const updateDragBox = (element) => {
  dragBox.style.width = element.style.width;
  dragBox.style.height = element.style.height;
  dragBox.style.left = element.style.left;
  dragBox.style.top = element.style.top;
  dragBox.style.transform = element.style.transform;
  // dragBox.style.zIndex = `${parseInt(element.style.zIndex) + 1}`;
  dragBox.classList.remove('displayNone');
}

const onElementSelect = (element, elementId) => {
  currentSelectedElement = element;
  currentSelectedId = elementId;
  updateMagnetismCoordsIfNeeded();
  updateDragBox(element);
};

const deselectAll = (event) => {
  preventDefault(event);
  if (currentSelectedId) {
    currentSelectedId = false;
    currentSelectedId = false;
    dragBox.classList.add('displayNone');
  }
};

const onElementPointerDown = (event, elementId) => {
  preventDefault(event);

  if (elementId !== currentSelectedId) {
    const elementDom = document.querySelector(`#${elementId}`);
    if (!elementDom.classList.contains('active')) {
      return;
    }
    onElementSelect(elementDom, elementId);
  }

  const elementData = draggableElements[elementId];
  [dragStartX, dragStartY] = getEventRelativeCoords(event);
  elementCoordXAtMouseDown = elementData.x;
  elementCoordYAtMouseDown = elementData.y;

  document.addEventListener('pointermove', onDragPointerMove);
  document.addEventListener('pointerup', onDragPointerEnd);
};

const onDragPointerMove = (event) => {
  preventDefault(event);
  const elementData = draggableElements[currentSelectedId];
  let [dragDeltaX, dragDeltaY] = getEventRelativeCoords(event);
  dragDeltaX = round(dragDeltaX - dragStartX, defaultDecimals);
  dragDeltaY = round(dragDeltaY - dragStartY, defaultDecimals);
  let newElementX = round(elementCoordXAtMouseDown + dragDeltaX, defaultDecimals);
  let newElementY = round(elementCoordYAtMouseDown + dragDeltaY, defaultDecimals);
  let magnetisedCoordX, magnetisedCoordY;

  if (magnetismIsActive) {
    [newElementX, magnetisedCoordX] = findValueWithMagnetism(newElementX, magnetismCoords.x, tolerances.dragAndResize);
    [newElementY, magnetisedCoordY] = findValueWithMagnetism(newElementY, magnetismCoords.y, tolerances.dragAndResize);
  }

  if (canGoOutside) {
    newElementX = getNumberInBetween(0, newElementX, 100, defaultDecimals);
    newElementY = getNumberInBetween(0, newElementY, 100, defaultDecimals);
  } else {
    newElementX = getNumberInBetween(elementData.w / 2, newElementX, 100 - (elementData.w / 2), defaultDecimals);
    newElementY = getNumberInBetween(elementData.height / 2, newElementY, 100 - (elementData.height / 2), defaultDecimals);
  }

  elementData.x = newElementX;
  elementData.y = newElementY;
  currentSelectedElement.style.left = `${newElementX}%`;
  currentSelectedElement.style.top = `${newElementY}%`;
  updateDragBox(currentSelectedElement);

  magnetisedLineY.style.top = `${magnetisedCoordY}%`
  magnetisedLineX.style.left = `${magnetisedCoordX}%`
  magnetisedLineY.classList.toggle('displayNone', !magnetisedCoordY)
  magnetisedLineX.classList.toggle('displayNone', !magnetisedCoordX)
};

const onDragPointerEnd = (event) => {
  preventDefault(event);
  updateMagnetismCoordsIfNeeded();
  document.removeEventListener('pointermove', onDragPointerMove);
  document.removeEventListener('pointerup', onDragPointerEnd);
  magnetisedLineX.classList.add('displayNone');
  magnetisedLineY.classList.add('displayNone');
  magnetisedLineR.classList.add('displayNone');
};



// RESIZE
let resizeAngleCosFraction, resizeAngleSinFraction;
let startDotX, startDotY;
let oppositeX, oppositeY;
let touchStartX, touchStartY;
let contentCenterX, contentCenterY;
let onResizePointerMove;
let resizeEnabled = true;
let initialResizeState, lastResizeState;
const resizeWaitingTime = 0;

const getBulletCoords = (bulletDom) => {
  const bulletRect = getDomRect(bulletDom);
  return [
    getPerc(bulletRect.centerX - containerLeft, containerWidth, defaultDecimals),
    getPerc(bulletRect.centerY - containerTop, containerHeight, defaultDecimals),
  ];
}

const handleResizeStart = (event, oppositeBullet, selectedResize) => {
  preventDefault(event);
  initialResizeState = JSON.parse(JSON.stringify(draggableElements[currentSelectedId]));
  const bulletRect = getDomRect(event.target);
  resizeAngleCosFraction = round(Math.cos(convertAngleDegToRad(draggableElements[currentSelectedId].r)), defaultDecimals);
  resizeAngleSinFraction = round(Math.sin(convertAngleDegToRad(draggableElements[currentSelectedId].r)), defaultDecimals);
  const [touchX, touchY] = getEventRelativeCoords(event);
  [startDotX, startDotY] = getBulletCoords(event.target);
  [oppositeX, oppositeY] = getBulletCoords(oppositeBullet);
  [touchStartX, touchStartY] = getPointProjectionOnLine(startDotX, startDotY, oppositeX, oppositeY, touchX, touchY);
  if (touchStartX === false || touchStartY === false) {
    touchStartX = touchX;
    touchStartY = touchY;
  }
  onResizePointerMove = selectedResize;
  document.addEventListener('pointermove', onResizePointerMove);
  document.addEventListener('pointerup', onResizePointerEnd);
}
const handleResizeChange = (left, top, xResize, yResize, ratioResize, event) => {
  preventDefault(event);
  if (!resizeEnabled) return;
  let [touchX, touchY] = getEventRelativeCoords(event);
  if (ratioResize) {
    [touchX, touchY] = getPointProjectionOnLine(startDotX, startDotY, oppositeX, oppositeY, touchX, touchY);
    if (touchX === false || touchY === false) return;
  }

  const wDiff = (touchX - touchStartX);
  const hDiff = (touchY - touchStartY);
  const rotatedWDiff = resizeAngleCosFraction * wDiff + resizeAngleSinFraction * hDiff;
  const rotatedHDiff = resizeAngleCosFraction * hDiff - resizeAngleSinFraction * wDiff;
  let newW = draggableElements[currentSelectedId].w;
  let newH = draggableElements[currentSelectedId].h;
  let newX = draggableElements[currentSelectedId].x;
  let newY = draggableElements[currentSelectedId].y

  if (xResize) {
    if (left) {
      newW = initialResizeState.w - rotatedWDiff;
    } else {
      newW = initialResizeState.w + rotatedWDiff;
    }
    newX += 0.5 * rotatedWDiff * resizeAngleCosFraction;
    newY += 0.5 * rotatedWDiff * resizeAngleSinFraction;
  }

  if (yResize) {
    if (top) {
      newH = initialResizeState.h - rotatedHDiff;
    } else {
      newH = initialResizeState.h + rotatedHDiff;
    }
    newX -= 0.5 * rotatedHDiff * resizeAngleSinFraction;
    newY += 0.5 * rotatedHDiff * resizeAngleCosFraction;
  }
  updateResize({ x: newX, y: newY, w: newW, h: newH }, left, top, xResize && !left, yResize && !top, false)
}
const onResizePointerEnd = (event) => {
  preventDefault(event);
  if (lastResizeState) {
    draggableElements[currentSelectedId].x = lastResizeState.x;
    draggableElements[currentSelectedId].y = lastResizeState.y;
    draggableElements[currentSelectedId].w = lastResizeState.w;
    draggableElements[currentSelectedId].h = lastResizeState.h;
    draggableElements[currentSelectedId].r = lastResizeState.r;
  }
  updateMagnetismCoordsIfNeeded();
  document.removeEventListener('pointermove', onResizePointerMove);
  document.removeEventListener('pointerup', onResizePointerEnd);
  magnetisedLineX.classList.add('displayNone');
  magnetisedLineY.classList.add('displayNone');
  magnetisedLineR.classList.add('displayNone');
  lastResizeState, initialResizeState = onResizePointerMove = startDotX = startDotY = oppositeX = oppositeY = touchStartX = touchStartY = contentCenterX = contentCenterY = resizeAngleCosFraction = resizeAngleSinFraction = undefined;
  resizeEnabled = true;
};

const handleRotationStart = (event) => {
  preventDefault(event);
  initialResizeState = JSON.parse(JSON.stringify(draggableElements[currentSelectedId]));
  const [tlX, tlY] = getBulletCoords(TL);
  const [brX, brY] = getBulletCoords(BR);
  [contentCenterX, contentCenterY] = getMiddlePointCoords(tlX, tlY, brX, brY);
  const [touchX, touchY] = getEventRelativeCoords(event);
  initialRotation = getAngleDegBetweenTwoPoints(contentCenterX, contentCenterY, touchX, touchY);
  onResizePointerMove = handleRotationChange;
  document.addEventListener('pointermove', onResizePointerMove);
  document.addEventListener('pointerup', onResizePointerEnd);
}
const handleRotationChange = (event) => {
  preventDefault(event);
  if (!resizeEnabled) return;
  const [touchX, touchY] = getEventRelativeCoords(event)
  const deltaRotation = initialRotation - getAngleDegBetweenTwoPoints(contentCenterX, contentCenterY, touchX, touchY)
  updateResize({ r: round(initialResizeState.r - deltaRotation, 2) }, false, false, false, false, true)
}

const enableResize = () => resizeEnabled = true
const updateResize = (updatedStateKeys, leftChanged, topChanged, rightChanged, bottomChanged, rotationChanged) => {
  let newResizeState = {
    ...initialResizeState,
    ...updatedStateKeys,
  };
  if (newResizeState.w < elementMinSize || newResizeState.h < elementMinSize) return;
  newResizeState.x = round(newResizeState.x, defaultDecimals);
  newResizeState.y = round(newResizeState.y, defaultDecimals);
  newResizeState.w = round(newResizeState.w, defaultDecimals);
  newResizeState.h = round(newResizeState.h, defaultDecimals);
  newResizeState.r = round(newResizeState.r, defaultDecimals);
  resizeEnabled = (resizeWaitingTime === 0);
  if (!isEqual(newResizeState, lastResizeState)) {
    lastResizeState = newResizeState;
    if (magnetismIsActive) {
      if (rotationChanged) { // if I'm dragging the rotation bullet, I'm sure there is no resize at the same time
        const newRotation = roundAngleForSteps(newResizeState.r, tolerances.rotation, rotationMagnetismStep); // show the line on values multiples of 45 degrees
        if (Math.abs(newRotation) % rotationMagnetismStep === 0) {
          magnetisedLineR.classList.remove('displayNone');
          magnetisedLineR.style.cssText = `
            left: ${newResizeState.x || 0}%;
            top: ${newResizeState.y || 0}%;
            transform: translate3d(-50%, -50%, 0px) rotate3d(0, 0, 1, ${newRotation}deg);
          `;
        } else {
          magnetisedLineR.classList.add('displayNone');
        }
        newResizeState.r = newRotation;
      } else {
        let magnetisedCoordX = 0, magnetisedCoordY = 0;
        [newResizeState, magnetisedCoordX, magnetisedCoordY] = applyRatioResizeMagnetism(newResizeState, magnetismCoords, leftChanged, topChanged, rightChanged, bottomChanged);
        magnetisedLineY.style.top = `${magnetisedCoordY}%`;
        magnetisedLineX.style.left = `${magnetisedCoordX}%`;
        magnetisedLineY.classList.toggle('displayNone', !magnetisedCoordY);
        magnetisedLineX.classList.toggle('displayNone', !magnetisedCoordX);
      }
    }

    currentSelectedElement.style.left = `${newResizeState.x}%`;
    currentSelectedElement.style.top = `${newResizeState.y}%`;
    currentSelectedElement.style.width = `${newResizeState.w}%`;
    currentSelectedElement.style.height = `${newResizeState.h}%`;
    currentSelectedElement.style.transform = `translate3d(-50%, -50%, 0px) rotate3d(0, 0, 1, ${newResizeState.r}deg)`;
    updateDragBox(currentSelectedElement);
  }
  resizeEnabled === false && setTimeout(enableResize, resizeWaitingTime);
}

const applyRatioResizeMagnetism = (resizeState, magnetismCoords, leftChanged, topChanged, rightChanged, bottomChanged) => {
  const ratio = resizeState.w / resizeState.h;
  const draggedSides = {};
  let lineXCoord = 0, lineYCoord = 0;

  if (leftChanged) {
    const dragValue = resizeState.x - resizeState.w / 2;
    const [newValue, magnetismLineCoord, magnetised] = findValueWithMagnetism(dragValue, magnetismCoords.l, tolerances.dragAndResize);
    if (magnetised) {
      draggedSides.left = {
        dragValue,
        newValue,
        magnetismLineCoord,
        diff: newValue - dragValue,
      };
    }
  } else if (rightChanged) {
    const dragValue = resizeState.x + resizeState.w / 2;
    const [newValue, magnetismLineCoord, magnetised] = findValueWithMagnetism(dragValue, magnetismCoords.r, tolerances.dragAndResize);
    if (magnetised) {
      draggedSides.right = {
        dragValue,
        newValue,
        magnetismLineCoord,
        diff: newValue - dragValue,
      };
    }
  }
  if (topChanged) {
    const dragValue = resizeState.y - resizeState.h / 2;
    const [newValue, magnetismLineCoord, magnetised] = findValueWithMagnetism(dragValue, magnetismCoords.t, tolerances.dragAndResize);
    if (magnetised) {
      draggedSides.top = {
        dragValue,
        newValue,
        magnetismLineCoord,
        diff: newValue - dragValue,
      };
    }
  } else if (bottomChanged) {
    const dragValue = resizeState.y + resizeState.h / 2;
    const [newValue, magnetismLineCoord, magnetised] = findValueWithMagnetism(dragValue, magnetismCoords.b, tolerances.dragAndResize);
    if (magnetised) {
      draggedSides.bottom = {
        dragValue,
        newValue,
        magnetismLineCoord,
        diff: newValue - dragValue,
      };
    }
  }

  if (Object.keys(draggedSides).length) {
    const maxDiff = Math.max(...Object.values(draggedSides).map(side => side.diff));
    const maxMagnetisedSide = Object.keys(draggedSides).find(key => draggedSides[key].diff === maxDiff);
    if (maxMagnetisedSide === 'left') {
      resizeState.x = round(resizeState.x + (draggedSides.left.diff / 2), 1);
      resizeState.w = round((resizeState.x - draggedSides.left.newValue) * 2, 1);
      lineXCoord = round(draggedSides.left.magnetismLineCoord, 0);
      if (topChanged || bottomChanged) {
        const newHeight = round(resizeState.w / ratio, 1);
        const heightDiff = newHeight - resizeState.h;
        resizeState.h = newHeight;
        if (topChanged) {
          resizeState.y = round(resizeState.y - heightDiff / 2, 1);
        } else {
          resizeState.y = round(resizeState.y + heightDiff / 2, 1);
        }
      }
    } else if (maxMagnetisedSide === 'right') {
      resizeState.x = round(resizeState.x + (draggedSides.right.diff / 2), 1);
      resizeState.w = round((draggedSides.right.newValue - resizeState.x) * 2, 1);
      lineXCoord = round(draggedSides.right.magnetismLineCoord, 0);
      if (topChanged || bottomChanged) {
        const newHeight = round(resizeState.w / ratio, 1);
        const heightDiff = newHeight - resizeState.h;
        resizeState.h = newHeight;
        if (topChanged) {
          resizeState.y = round(resizeState.y - heightDiff / 2, 1);
        } else {
          resizeState.y = round(resizeState.y + heightDiff / 2, 1);
        }
      }
    } else if (maxMagnetisedSide === 'top') {
      resizeState.y = round(resizeState.y + (draggedSides.top.diff / 2), 1);
      resizeState.h = round((resizeState.y - draggedSides.top.newValue) * 2, 1);
      lineYCoord = round(draggedSides.top.magnetismLineCoord, 0);
      if (leftChanged || rightChanged) {
        const newWidth = round(resizeState.h * ratio, 1);
        const widthDiff = newWidth - resizeState.w;
        resizeState.w = newWidth;
        if (leftChanged) {
          resizeState.x = round(resizeState.x - widthDiff / 2, 1);
        } else {
          resizeState.x = round(resizeState.x + widthDiff / 2, 1);
        }
      }
    } else if (maxMagnetisedSide === 'bottom') {
      resizeState.y = round(resizeState.y + (draggedSides.bottom.diff / 2), 1);
      resizeState.h = round((draggedSides.bottom.newValue - resizeState.y) * 2, 1);
      lineYCoord = round(draggedSides.bottom.magnetismLineCoord, 0);
      if (leftChanged || rightChanged) {
        const newWidth = round(resizeState.h * ratio, 1);
        const widthDiff = newWidth - resizeState.w;
        resizeState.w = newWidth;
        if (leftChanged) {
          resizeState.x = round(resizeState.x - widthDiff / 2, 1);
        } else {
          resizeState.x = round(resizeState.x + widthDiff / 2, 1);
        }
      }
    }
  }

  return [resizeState, lineXCoord, lineYCoord];
}



// INIT
const getEventRelativeCoords = (event) => ([
  getPerc(event.clientX - containerLeft, containerWidth, defaultDecimals),
  getPerc(event.clientY - containerTop, containerHeight, defaultDecimals),
]);

const createNewElementData = () => {
  const width = getRandomNumber(25, 10, 0);
  const height = getRandomNumber(25, 10, 0);
  return {
    id: randomString(10),
  	active: getRandomNumber(1) > activeElementsRate ? false : true,
  	x: getRandomNumber(100 - width / 2, width / 2, 0),
  	y: getRandomNumber(100 - height / 2, height / 2, 0),
  	w: width,
  	h: height,
  	r: 0,
  }
};

const appendNewElementDom = (newElementData, zIndex) => {
  const newElement = document.createElement('div');
  newElement.id = newElementData.id;
  newElement.style.cssText = `
    left: ${newElementData.x}%;
    top: ${newElementData.y}%;
    width: ${newElementData.w}%;
    height: ${newElementData.h}%;
    background-color: ${getRandomHexColor()};
    transform: translate3d(-50%, -50%, 0px);
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
    draggableElements[newElement.id] = newElement;
    appendNewElementDom(newElement, i * 10);
  }
};

const initDom = () => {
  mainWrapper = document.querySelector('#mainWrapper');
  dragBox = document.querySelector('.drag-border-box');
  magnetisedLineX = document.querySelector('#magnetised-line-x');
  magnetisedLineY = document.querySelector('#magnetised-line-y');
  magnetisedLineR = document.querySelector('#magnetised-line-r');
  R = document.querySelector('#dragBulletR');
  L = document.querySelector('#dragBulletL');
  T = document.querySelector('#dragBulletT');
  B = document.querySelector('#dragBulletB');
  TL = document.querySelector('#dragBulletTL');
  BR = document.querySelector('#dragBulletBR');
  BL = document.querySelector('#dragBulletBL');
  TR = document.querySelector('#dragBulletTR');
  RT = document.querySelector('#dragBulletRT');

  mainWrapper.addEventListener('pointerdown', deselectAll);
  dragBox.addEventListener('pointerdown', (event) => {
    onElementPointerDown(event, currentSelectedId);
  });
  R.addEventListener('pointerdown', e => handleResizeStart(e, L, handleResizeChange.bind({}, false, false, true, false, false)));
  L.addEventListener('pointerdown', e => handleResizeStart(e, R, handleResizeChange.bind({}, true, false, true, false, false)));
  T.addEventListener('pointerdown', e => handleResizeStart(e, B, handleResizeChange.bind({}, false, true, false, true, false)));
  B.addEventListener('pointerdown', e => handleResizeStart(e, T, handleResizeChange.bind({}, false, false, false, true, false)));
  TL.addEventListener('pointerdown', e => handleResizeStart(e, BR, handleResizeChange.bind({}, true, true, true, true, true)));
  TR.addEventListener('pointerdown', e => handleResizeStart(e, BL, handleResizeChange.bind({}, false, true, true, true, true)));
  BR.addEventListener('pointerdown', e => handleResizeStart(e, TL, handleResizeChange.bind({}, false, false, true, true, true)));
  BL.addEventListener('pointerdown', e => handleResizeStart(e, TR, handleResizeChange.bind({}, true, false, true, true, true)));
  RT.addEventListener('pointerdown', handleRotationStart);

  const width = 60 + getRandomNumber(30, 0);
  const height = 60 + getRandomNumber(30, 0);
  mainWrapper.style.cssText = `
    width: ${width}vw;
    height: ${height}vh;
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
