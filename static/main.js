const imageInput = document.getElementById('imageInput');
const pixelArtCanvas = document.getElementById('pixelArtCanvas');
const scaledCanvas = document.getElementById('scaledCanvas');
const pixelArtCtx = pixelArtCanvas.getContext('2d');
const scaledCtx = scaledCanvas.getContext('2d');
const legoBoard = document.getElementById('legoBoard');
const legoBoardColorButton = document.getElementById('legoBoardColorButton');
const colorKeyDiv = document.getElementById('colorKey');
const outputDiv = document.getElementById('output');
const heightInput = document.getElementById('customHeight');
const widthInput = document.getElementById('customWidth');
var colorKey = {};
var customWidth = 16;
var customHeight = 16;
var customColor = 'white';

function handleHeightWidthChange() {
	// remove the outdated width and height class
	legoBoard.classList.remove(`b-${customWidth}x${customHeight}`);

	// update with new height and width
	customHeight = heightInput.value;
	customWidth = widthInput.value;
	legoBoard.classList.add(`b-${customWidth}x${customHeight}`);
}

function setBoardColor(color) {
	// Remove 'active' class from all dropdown items
	let dropdownItems = document.querySelectorAll('.dropdown-item');
	dropdownItems.forEach(function (item) {
		item.classList.remove('active');
		item.removeAttribute('aria-current');
	});

	// Add 'active' class to the clicked button
	let clickedButton = document.querySelector('.dropdown-item[data-color="' + color + '"]');
	clickedButton.classList.add('active');
	clickedButton.setAttribute('aria-current', 'true');

	// update UI elements and lego brick board with target color
	legoBoard.classList.remove(`b-${customColor}`);
	customColor = color;
	legoBoard.classList.add(`b-${customColor}`);
	let buttonTextColor = (color == 'white') ? 't-black' : 't-white';
	legoBoardColorButton.className = `btn btn-secondary dropdown-toggle bg-${color} ${buttonTextColor}`

	let dropdownToggle = document.getElementById('legoBoardColorButton');
	let dropdown = new bootstrap.Dropdown(dropdownToggle);
	dropdown.hide();
}

function handleImageUpload() {
	var file = imageInput.files[0];
	if (file) {
		var reader = new FileReader();
		reader.onload = function (e) {
			let heightPixels = 27 * customHeight;
			let widthPixels = 27 * customWidth;

			pixelArtCanvas.width = widthPixels;
			pixelArtCanvas.height = heightPixels;
			colorKeyDiv.style.height = `${heightPixels}px`;

			var img = new Image();
			img.onload = function () {
				// Scale the image to fit within 432x432
				var scaleFactor = Math.max(widthPixels / img.width, heightPixels / img.height);
				var scaledWidth = img.width * scaleFactor;
				var scaledHeight = img.height * scaleFactor;

				scaledCanvas.width = scaledWidth;
				scaledCanvas.height = scaledHeight;

				// clear the canvas
				scaledCtx.clearRect(0, 0, scaledCanvas.width, scaledCanvas.height);
				pixelArtCtx.clearRect(0, 0, pixelArtCanvas.width, pixelArtCanvas.height);

				// Draw the scaled image on the scaledCanvas
				scaledCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

				// Draw pixel art
				drawPixelArt(scaledWidth, scaledHeight);
			};
			img.src = e.target.result;
		};
		reader.readAsDataURL(file);
	}
}

function drawPixelArt(width, height) {
	var circleRadius = 13.5; // Half of the circle's size
	var padding = 0;
	var offsetX = 0;
	var offsetY = 0;
	var colorKey = {};
	let colorNumber = 1;

	pixelArtCtx.clearRect(0, 0, width, height); // Clear the canvas before redrawing
	colorKeyDiv.innerHTML = ''; // Clear the color key

	for (let x = offsetX; x < width; x += (circleRadius * 2) + padding) {
		for (let y = offsetY; y < height; y += (circleRadius * 2) + padding) {
			let pixelColor = getAverageColor(x, y, circleRadius);

			// Check if the color is already in the color key
			var key = findColorKey(colorKey, pixelColor);
			if (key === null) {
				key = `color_${colorNumber}`;
				colorKey[`color_${colorNumber}`] = pixelColor;
				colorNumber++;
			}

			let color = colorKey[key];
			let label = key.split('_')[1];

			// Draw the numbered circle
			drawNumberedCircle(x, y, circleRadius, color, label);
		}
	}

	// Display the color key
	Object.entries(colorKey).forEach(([key, pixelColor]) => {
		let hexColor = rgbToHex(pixelColor.r, pixelColor.g, pixelColor.b);
		let label = key.split('_')[1];
		colorKeyDiv.innerHTML += `<span class="mr-2">${label}: <span style="color: ${hexColor};">■</span> ${hexColor}</span><br>`;
	});
}

function findColorKey(colorKey, pixelColor) {
	// Find the key for an existing color in the color key
	for (let [key, value] of Object.entries(colorKey)) {
		if (colorsMatch(value, pixelColor)) {
			return key;
		}
	}
	return null;
}

function drawNumberedCircle(x, y, radius, color, label) {
	// Draw the numbered circle
	pixelArtCtx.beginPath();
	pixelArtCtx.arc(x + radius, y + radius, radius, 0, 2 * Math.PI);
	pixelArtCtx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
	pixelArtCtx.fill();
	pixelArtCtx.closePath();

	// Draw the color number
	let textColor = getContrastColor(color.r, color.g, color.b);
	pixelArtCtx.fillStyle = textColor;
	pixelArtCtx.font = '10px Arial';
	pixelArtCtx.textAlign = 'center';
	pixelArtCtx.fillText(label, x + radius, y + radius + 3);
}

function getAverageColor(x, y, radius) {
	var imageData = scaledCtx.getImageData(x - radius, y - radius, radius * 2, radius * 2).data;
	let totalR = 0;
	let totalG = 0;
	let totalB = 0;
	let totalA = 0; // Alpha (transparency)
	var pixelCount = (radius * 2) * (radius * 2);

	for (let i = 0; i < pixelCount * 4; i += 4) {
		totalR += imageData[i];
		totalG += imageData[i + 1];
		totalB += imageData[i + 2];
		totalA += imageData[i + 3];
	}

	let avgR = Math.round(totalR / pixelCount);
	let avgG = Math.round(totalG / pixelCount);
	let avgB = Math.round(totalB / pixelCount);
	let avgA = Math.round(totalA / pixelCount);

	return { r: avgR, g: avgG, b: avgB, a: avgA };
}

function colorsMatch(color1, color2) {
	// Check if two colors are approximately the same
	let threshold = 15; // Adjust as needed
	return (
		Math.abs(color1.r - color2.r) <= threshold &&
		Math.abs(color1.g - color2.g) <= threshold &&
		Math.abs(color1.b - color2.b) <= threshold
	);
}

function rgbToHex(r, g, b) {
	return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

function getContrastColor(r, g, b) {
	// Calculate the luminance
	let luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

	// Use white or black text depending on the luminance
	return luminance > 0.5 ? 'black' : 'white';
}