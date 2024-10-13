// public/script.js
const socket = io('http://localhost:3001' ); // Connect to the backend server
let currentBoardId;
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

let usersBoards = {};

let userId;

let auth0Client;

async function configureAuth0() {
    try {
        // Re-initialize the Auth0 client
        auth0Client = await createAuth0Client({
            domain: "dev-c64uddi44r8sy6bb.us.auth0.com",  // Replace with your Auth0 domain
            client_id: "lQsAe1JJ9anKD9oFtjrItojIboqI31B0",  // Replace with your Auth0 client ID
            redirect_uri: window.location.origin + "/board.html",  // Callback URL
            cacheLocation: 'localstorage'  // Ensure session persists across page reloads
        });

        // Handle the redirect callback and authenticate the user
        await handleAuthentication();
    } catch (error) {
        console.error("Error configuring Auth0:", error);
    }
}

async function handleAuthentication() {
    try {
        // Handle the redirect from Auth0 (if there are tokens in the URL)
        const queryParams = window.location.search;
        if (queryParams.includes("code=") && queryParams.includes("state=")) {
            console.log("Handling redirect callback...");
            await auth0Client.handleRedirectCallback();  // Process login and tokens
            window.history.replaceState({}, document.title, window.location.pathname);  // Clean URL
        }

        // Check if the user is authenticated
        const isAuthenticated = await auth0Client.isAuthenticated();
        console.log("Is user authenticated?", isAuthenticated);

        if (isAuthenticated) {
            // Fetch and display the user's profile
            const user = await auth0Client.getUser();
            console.log('User profile:', user);
            userId = user.sub;

            // const formData = new FormData();
            // formData.append('_id', user.sub);
            // Use fetch to send a POST request
            let response = await fetch('http://localhost:3001/api/users/auth', {
                headers: {
                    'Content-Type': 'application/json'  // Set content type to JSON
                },
                  method: 'POST',
                  body: JSON.stringify({ _id: user.sub }),

              })
            if (response.ok) {
              response = await response.json();
              console.log(response);
              for (let i = 0; i < response.rooms.length; i++) {
                usersBoards[response.rooms[i]] = response.titles[i];
                addGalleryItem(response.titles[i], response.rooms[i]);
              }
            }

        } else {
            console.log("User is not authenticated, redirecting to login...");
            // Redirect to the login page if the user is not authenticated
            window.location.href = "/index.html";
        }
    } catch (error) {
        console.error("Error during authentication:", error);
        window.location.href = '/index.html';  // Redirect to login if there's an error
    }
}

function addGalleryItem(title, id) {
  // Create a new div element for the gallery item
  const newGalleryItem = document.createElement('div');
  newGalleryItem.classList.add('galleryItem'); // Add a class if needed for styling

  // Create a new p element for the title
  const titleElement = document.createElement('p');
  titleElement.innerText = title;
// Create the share icon using an <img> element
const shareIcon = document.createElement('img');
shareIcon.classList.add('icon', 'icon-share', 'tooltip'); // Add classes for styling
shareIcon.setAttribute('src', 'share.png'); // Path to your share.png file
shareIcon.setAttribute('alt', 'Share'); // Accessibility attribute
shareIcon.setAttribute('aria-label', 'Share'); // Accessibility label
shareIcon.setAttribute('role', 'button'); // Accessibility role
shareIcon.tabIndex = 0; // Make it focusable for keyboard users
shareIcon.setAttribute('title', 'Copy join code'); // Tooltip text

const tooltip = document.createElement('span');
tooltip.classList.add('tooltiptext'); // Add a class for styling
tooltip.innerText = 'Copy join code'; // Tooltip text

shareIcon.appendChild(tooltip); // Append the tooltip to the share icon

// Optionally, add a click event to the share icon
shareIcon.addEventListener('click', async () => {
  await navigator.clipboard.writeText(id);
});

  // Append the p element (title) to the new gallery item div
  newGalleryItem.appendChild(titleElement);

  newGalleryItem.appendChild(shareIcon);

  // Append the new gallery item to the #gallery div
  const gallery = document.getElementById('gallery');
  gallery.appendChild(newGalleryItem);

  titleElement.addEventListener('click', async () => {
    console.log("clicked on " + title);
    currentBoardId = Object.keys(usersBoards).find(key => usersBoards[key] === title);
    console.log("clicked on " + currentBoardId);
    socket.emit('roomJoin', currentBoardId);
  });
}

// Initialize Auth0 and handle the session on page load
window.onload = configureAuth0;

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
  currentBoardId = id;
  titleContainer.innerText = title;
  console.log(title);
  draw();
});

socket.on('pixelUpdated', ({ x, y, color }) => {
  pixels[y][x] = color; // Update the pixel color in the local array
  draw();
});

// socket.on('joinSuccess', (boardId) => {
//   currentBoardId = boardId;
// });

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
let ulsrc = "/users/" + GLOBAL_BOARD_ID + "/";
let PIXEL_VAL = 10; // remaining pixels that can be placed.
const CREATE_BOARD = document.getElementById("create");
console.log("HELPPPPPPPPPPPPPP!!!!")
console.log(CREATE_BOARD);
const JOIN_BOARD = document.getElementById("join");

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

// Create new Board

CREATE_BOARD.addEventListener("click", createNewBoard);
JOIN_BOARD.addEventListener("click", joinNewBoard);
let newTask = document.getElementById("new-task");
newTask.addEventListener("click", createNewTask);

function createNewTask() {
  console.log("entering");
  // Get input values for the task name and task value
  let taskName = document.getElementById("taskInput").value;
  let taskValue = document.getElementById("taskValue").value;

  // Create a new taskItem div
  let newTaskItem = document.createElement("div");
  newTaskItem.classList.add("taskItem");

  // Set a dynamic id based on the current number of tasks
  let taskCount = document.getElementsByClassName("taskItem").length + 1;
  newTaskItem.id = `taskItem${taskCount}`;

  // Create the task text with a span for the task value
  let taskText = document.createElement("p");
  taskText.innerHTML = `${taskName} (<span id="value${taskCount}">${taskValue}</span>)`;

  // Create the icon container div
  let iconContainer = document.createElement("div");
  iconContainer.classList.add("icon-container");

  // Create the checkbox icon SVG
  let checkboxIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  checkboxIcon.classList.add("icon", "icon-checkbox");
  checkboxIcon.setAttribute("viewBox", "0 0 24 24");
  let checkboxPolyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  checkboxPolyline.setAttribute("points", "6 12 10 16 18 8");
  checkboxPolyline.setAttribute("style", "fill:none;stroke-width:2");
  checkboxIcon.appendChild(checkboxPolyline);

  // Create the X icon SVG
  let xIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  xIcon.classList.add("icon", "icon-x");
  xIcon.setAttribute("viewBox", "0 0 24 24");
  let xLine1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  xLine1.setAttribute("x1", "8");
  xLine1.setAttribute("y1", "8");
  xLine1.setAttribute("x2", "16");
  xLine1.setAttribute("y2", "16");
  let xLine2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  xLine2.setAttribute("x1", "16");
  xLine2.setAttribute("y1", "8");
  xLine2.setAttribute("x2", "8");
  xLine2.setAttribute("y2", "16");
  xIcon.appendChild(xLine1);
  xIcon.appendChild(xLine2);

  // Append the icons to the icon container
  iconContainer.appendChild(checkboxIcon);
  iconContainer.appendChild(xIcon);

  // Append the task text and icon container to the new taskItem div
  newTaskItem.appendChild(taskText);
  newTaskItem.appendChild(iconContainer);

  // Append the new taskItem to the taskList div
  document.getElementById("taskList").appendChild(newTaskItem);

  // Clear the input fields after adding the task
  document.getElementById("taskInput").value = '';
  document.getElementById("taskValue").value = '';
}


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

function createNewBoard() {
  console.log("entering");
  document.getElementById("formWrapper").classList.remove("hidden");
  let createForm = document.getElementById("createForm");
  console.log(createForm)
  createForm.classList.remove("hidden");
  createForm.classList.add("boardForm");
  createForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    let boardTitle = document.querySelector("#createForm input").value;
    console.log(boardTitle);

    let response1 = await fetch('http://localhost:3001/api/boards/', {
      headers: {
          'Content-Type': 'application/json'  // Set content type to JSON
      },
        method: 'POST',
        body: JSON.stringify({ title: boardTitle }),
    });
    response1 = await response1.json();
    let response2 = await fetch('http://localhost:3001/api/users/board/', {
      headers: {
          'Content-Type': 'application/json'  // Set content type to JSON
      },
        method: 'POST',
        body: JSON.stringify({ boardId: response1.boardId , userId}),
    });
    usersBoards[response1.boardId] = boardTitle;
    addGalleryItem(boardTitle, response1.boardId);
    document.getElementById("formWrapper").classList.add("hidden");
    document.getElementById("createForm").classList.remove("boardForm");
    document.getElementById("createForm").classList.add("hidden");
  })
}

function joinNewBoard() {
  document.getElementById("formWrapper").classList.remove("hidden");
  let joinForm = document.getElementById("joinForm");
  console.log(joinForm)
  joinForm.classList.remove("hidden");
  joinForm.classList.add("boardForm");
  joinForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    let boardId = document.querySelector("#joinForm input").value;
    console.log(boardId);

    let request = await fetch('http://localhost:3001/api/users/board', {
      headers: {
          'Content-Type': 'application/json'  // Set content type to JSON
      },
        method: 'POST',
        body: JSON.stringify({ boardId, userId }),
    })
    requestJson = await request.json();
    if (request.status === 201) {
      usersBoards[boardId] = requestJson.board.title;
      addGalleryItem(boardTitle, boardId);
    } else {
      // TODO display error message (invalid join code)
    }
    document.getElementById("formWrapper").classList.add("hidden");
    document.getElementById("joinForm").classList.remove("boardForm");
    document.getElementById("joinForm").classList.add("hidden");
  })
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
    socket.emit('updatePixel', {boardId: currentBoardId, x: gridX, y: gridY, color: hsvToHex(
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
  if (keysPressed.hasOwnProperty(key) && document.activeElement.classList.contains('textbox') === false) {
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
