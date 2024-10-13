// public/script.js
const socket = io('http://localhost:3001' ); // Connect to the backend server
let GLOBAL_BOARD_ID;
console.log('io is', io);

const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const colorPickerPanel = document.getElementById('colorPickerPanel');
const presetColorsContainer = document.getElementById('presetColors');
const titleContainer = document.getElementById('boardTitle');
const hueSlider = document.getElementById('hueSlider');
const saturationSlider = document.getElementById('saturationSlider');
const valueSlider = document.getElementById('valueSlider');

const SIDEBAR_WIDTH = 300;
let width = window.innerWidth - SIDEBAR_WIDTH;
let height = window.innerHeight;

canvas.width = width;
canvas.height = height;

// Pixel grid settings
const GRID_SIZE = 100;
const BASE_PIXEL_SIZE = Math.min(width, height) / GRID_SIZE; // Base pixel size without scaling

// // Initialize pixel grid with white color
let pixels = [];
for (let y = 0; y < GRID_SIZE; y++) {
  const row = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    row.push('#FFFFFF');
  }
  pixels.push(row);
}

// Current selected color in HSV
let currentColorHSV = { h: 0, s: 1, v: 1 };

socket.on('gameBoard', (data, id, title) => {
  pixels = data;
  GLOBAL_BOARD_ID = id;
  titleContainer.innerText = title;
  draw();
});

socket.on('pixelUpdated', ({ x, y, color }) => {
  pixels[y][x] = color; // Update the pixel color in the local array
  draw();
});

// Transformation variables
let scale = 1;
const SCALE_FACTOR = 1.1;
const MIN_SCALE = 0.1;
const MAX_SCALE = 10;

// To track translation (panning)
let translatePos = {
  x: (width - GRID_SIZE * BASE_PIXEL_SIZE * scale) / 2,
  y: (height - GRID_SIZE * BASE_PIXEL_SIZE * scale) / 2,
};

// Mouse position
let mouseX = 0;
let mouseY = 0;

// Panning state for right-click drag
let isRightDragging = false;
let lastMousePos = { x: 0, y: 0 };

// Panning state for WASD keys
const keysPressed = {
  w: false,
  a: false,
  s: false,
  d: false,
};
const PAN_SPEED = 20; // Pixels per frame
let PIXEL_VAL = 10; // remaining pixels that can be placed.

// Preset Colors (12 colors)
const presetColors = [
  { h: 0, s: 1, v: 1 },     // Red
  { h: 30, s: 1, v: 1 },    // Orange
  { h: 60, s: 1, v: 1 },    // Yellow
  { h: 120, s: 1, v: 1 },   // Green
  { h: 180, s: 1, v: 1 },   // Cyan
  { h: 240, s: 1, v: 1 },   // Blue
  { h: 300, s: 1, v: 1 },   // Magenta
  { h: 330, s: 1, v: 1 },   // Pink
  { h: 45, s: 1, v: 0.5 },  // Brown
  { h: 0, s: 0, v: 0 },     // Black
  { h: 0, s: 0, v: 1 },     // White
  { h: 0, s: 0, v: 0.5 },   // Grey
];

// Variables to keep track of selected preset color element
let selectedPresetElement = null;

// Event listeners
window.addEventListener('resize', onResize);
canvas.addEventListener('wheel', onZoom, { passive: false });
canvas.addEventListener('mousemove', onMouseMove);
canvas.addEventListener('click', onClick);

// Right-click panning event listeners
canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent context menu
canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mouseup', onMouseUp);
canvas.addEventListener('mouseleave', onMouseUp);

// Keyboard panning event listeners
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);

// Start the WASD panning loop
requestAnimationFrame(updateWASDPanning);

// Color Picker Events
hueSlider.addEventListener('input', onHueChange);
saturationSlider.addEventListener('input', onSaturationChange);
valueSlider.addEventListener('input', onValueChange);

// Initial setup
createPresetColorSquares();
updateSliders();
updateCurrentColor();
draw();


// checkbox
console.log("ENTERING");
let check = document.querySelectorAll("svg.icon-checkbox");
for (let i = 0; i < check.length; i++) {
  console.log(check[i]);
  check[i].addEventListener("click", doTaskComplete);
}
let cross = document.querySelectorAll("svg.icon-x");
for (let i = 0; i < cross.length; i++) {
  console.log(cross[i]);
  cross[i].addEventListener("click", doTaskCross);
}

function doTaskComplete(event) {
  console.log(event);
  console.log(event.currentTarget);
}

function onResize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  // Recalculate translation to keep grid centered
  translatePos.x = (width - GRID_SIZE * BASE_PIXEL_SIZE * scale) / 2;
  translatePos.y = (height - GRID_SIZE * BASE_PIXEL_SIZE * scale) / 2;

  draw();
}

function onZoom(event) {
  event.preventDefault();
  const { offsetX: mx, offsetY: my, deltaY } = event;

  // Determine zoom direction
  let zoom = 1;
  if (deltaY < 0) {
    zoom = SCALE_FACTOR;
  } else {
    zoom = 1 / SCALE_FACTOR;
  }

  // Calculate new scale and clamp
  let newScale = scale * zoom;
  newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

  // Calculate the world coordinates before scaling
  const wx = ((mx - SIDEBAR_WIDTH) - translatePos.x) / scale;
  const wy = (my - translatePos.y) / scale;

  // Update scale
  scale = newScale;

  // Calculate new translation to keep the zoom centered on the mouse
  translatePos.x = (mx - SIDEBAR_WIDTH) - wx * scale;
  translatePos.y = my - wy * scale;

  draw();
}

function onMouseMove(event) {
  mouseX = event.offsetX - SIDEBAR_WIDTH;
  mouseY = event.offsetY;

  if (isRightDragging) {
    const dx = event.clientX - lastMousePos.x;
    const dy = event.clientY - lastMousePos.y;
    translatePos.x += dx;
    translatePos.y += dy;
    lastMousePos = { x: event.clientX, y: event.clientY };
    draw();
  } else {
    draw(); // Redraw to show hover effect
  }
}

function onMouseDown(event) {
  if (event.button === 2) { // Right mouse button
    isRightDragging = true;
    lastMousePos = { x: event.clientX, y: event.clientY };
  }
}

function onMouseUp(event) {
  if (event.button === 2) { // Right mouse button
    isRightDragging = false;
  }
}

function onClick(event) {
  // Ignore clicks from right mouse button
  if (event.button !== 0) return;

  if (PIXEL_VAL === 0) return;

  // Check if the click is within the color picker panel
  const rect = colorPickerPanel.getBoundingClientRect();
  if (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  ) {
    return; // Ignore clicks on the color picker panel
  }

  const { offsetX: mx, offsetY: my } = event;

  // Transform mouse coordinates to grid coordinates
  const gridX = Math.floor(
    ((mx - SIDEBAR_WIDTH) - translatePos.x) / (BASE_PIXEL_SIZE * scale)
  );
  const gridY = Math.floor(
    (my - translatePos.y) / (BASE_PIXEL_SIZE * scale)
  );

  if (
    gridX >= 0 &&
    gridX < GRID_SIZE &&
    gridY >= 0 &&
    gridY < GRID_SIZE
  ) {
    pixels[gridY][gridX] = hsvToHex(
      currentColorHSV.h,
      currentColorHSV.s,
      currentColorHSV.v
    );
    socket.emit('updatePixel', {boardId: GLOBAL_BOARD_ID, x: gridX, y: gridY, color: hsvToHex(
      currentColorHSV.h,
      currentColorHSV.s,
      currentColorHSV.v
    ) }); // Send pixel update to the server
    PIXEL_VAL--;
    document.getElementById("pixel-val").textContent = "" + PIXEL_VAL;
    draw();
    console.log(pixels[gridY][gridX] + " added at (" + gridX + ", " + gridY + ")");
  }
}

function onKeyDown(event) {
  const key = event.key.toLowerCase();
  if (keysPressed.hasOwnProperty(key)) {
    keysPressed[key] = true;
    event.preventDefault(); // Prevent default scrolling behavior
  }
}

function onKeyUp(event) {
  const key = event.key.toLowerCase();
  if (keysPressed.hasOwnProperty(key)) {
    keysPressed[key] = false;
    event.preventDefault(); // Prevent default scrolling behavior
  }
}

function updateWASDPanning() {
  let needsRedraw = false;

  if (keysPressed.w) {
    translatePos.y += PAN_SPEED;
    needsRedraw = true;
  }
  if (keysPressed.a) {
    translatePos.x += PAN_SPEED;
    needsRedraw = true;
  }
  if (keysPressed.s) {
    translatePos.y -= PAN_SPEED;
    needsRedraw = true;
  }
  if (keysPressed.d) {
    translatePos.x -= PAN_SPEED;
    needsRedraw = true;
  }

  if (needsRedraw) {
    draw();
  }

  requestAnimationFrame(updateWASDPanning);
}

function draw() {
  // Clear the canvas with lighter grey background
  ctx.fillStyle = '#f0f0f0'; // Ensure consistency with CSS
  ctx.fillRect(0, 0, width, height);

  // Save the current context state
  ctx.save();

  // Apply transformations
  ctx.translate(translatePos.x, translatePos.y);
  ctx.scale(scale, scale);

  // Draw pixels
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      ctx.fillStyle = pixels[y][x];
      ctx.fillRect(
        x * BASE_PIXEL_SIZE,
        y * BASE_PIXEL_SIZE,
        BASE_PIXEL_SIZE,
        BASE_PIXEL_SIZE
      );
    }
  }

  // Restore the context to its original state
  ctx.restore();

  // Draw hover effect
  // Transform mouse coordinates to grid coordinates
  const gridX = Math.floor(
    (mouseX - translatePos.x) / (BASE_PIXEL_SIZE * scale)
  );
  const gridY = Math.floor(
    (mouseY - translatePos.y) / (BASE_PIXEL_SIZE * scale)
  );

  if (
    gridX >= 0 &&
    gridX < GRID_SIZE &&
    gridY >= 0 &&
    gridY < GRID_SIZE
  ) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(
      translatePos.x + gridX * BASE_PIXEL_SIZE * scale,
      translatePos.y + gridY * BASE_PIXEL_SIZE * scale,
      BASE_PIXEL_SIZE * scale,
      BASE_PIXEL_SIZE * scale
    );
  }
}

function createPresetColorSquares() {
  presetColors.forEach((colorHSV) => {
    const colorDiv = document.createElement('div');
    colorDiv.classList.add('preset-color');
    colorDiv.style.backgroundColor = hsvToHex(
      colorHSV.h,
      colorHSV.s,
      colorHSV.v
    );
    colorDiv.addEventListener('click', () => {
      // Remove 'selected' class from previous selection
      if (selectedPresetElement) {
        selectedPresetElement.classList.remove('selected');
      }
      // Set the new selected element
      selectedPresetElement = colorDiv;
      colorDiv.classList.add('selected');

      currentColorHSV = { ...colorHSV };
      updateSliders();
      updateCurrentColor();
    });
    presetColorsContainer.appendChild(colorDiv);
  });
  selectedPresetElement = presetColorsContainer.children[0];
  presetColorsContainer.children[0].classList.add('selected');
}

function updateSliders() {
  hueSlider.value = currentColorHSV.h;
  saturationSlider.value = currentColorHSV.s * 100;
  valueSlider.value = currentColorHSV.v * 100;
  updateSaturationSliderBackground();
  updateValueSliderBackground();
}

function onHueChange(event) {
  currentColorHSV.h = parseInt(event.target.value);
  updateCurrentColor();
  updateSaturationSliderBackground();
  updateValueSliderBackground();
  deselectPresetColor();
}

function onSaturationChange(event) {
  currentColorHSV.s = parseInt(event.target.value) / 100;
  updateCurrentColor();
  updateValueSliderBackground();
  deselectPresetColor();
}

function onValueChange(event) {
  currentColorHSV.v = parseInt(event.target.value) / 100;
  updateCurrentColor();
  deselectPresetColor();
}

function updateCurrentColor() {
  // Optional: Update the border color of the color picker panel
  // colorPickerPanel.style.borderColor = hsvToHex(
  //   currentColorHSV.h,
  //   currentColorHSV.s,
  //   currentColorHSV.v
  // );
}

function updateSaturationSliderBackground() {
  const hue = currentColorHSV.h;
  const colorAtFullSaturation = hsvToHex(hue, 1, currentColorHSV.v);
  // Set the CSS variable for the saturation slider
  document.documentElement.style.setProperty('--saturation-slider-color', colorAtFullSaturation);
}

function updateValueSliderBackground() {
  const hue = currentColorHSV.h;
  const saturation = currentColorHSV.s;
  const colorAtFullValue = hsvToHex(hue, saturation, 1);
  // Set the CSS variable for the value slider
  document.documentElement.style.setProperty('--value-slider-color', colorAtFullValue);
}

function deselectPresetColor() {
  if (selectedPresetElement) {
    selectedPresetElement.classList.remove('selected');
    selectedPresetElement = null;
  }
}

// Utility functions

function hsvToHex(h, s, v) {
  const rgb = hsvToRgb(h, s, v);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function hsvToRgb(h, s, v) {
  let r, g, b;

  const i = Math.floor(h / 60) % 6;
  const f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}
