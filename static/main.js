const imageInput = document.getElementById('imageInput');
const pixelArtCanvas = document.getElementById('pixelArtCanvas');
const scaledCanvas = document.getElementById('scaledCanvas');
const thumbnailCanvas = document.getElementById('thumbnailCanvas');
const pixelArtCtx = pixelArtCanvas.getContext('2d');
const scaledCtx = scaledCanvas.getContext('2d');
const thumbnailCtx = thumbnailCanvas.getContext('2d');
const legoBoardColorButton = document.getElementById('legoBoardColorButton');
const colorKeyDiv = document.getElementById('colorKey');
const instructionsDiv = document.getElementById('instructions');
const heightInput = document.getElementById('customHeight');
const widthInput = document.getElementById('customWidth');
const piecesCount = document.getElementById('piecesCount');
const generateButtonSpinner = document.getElementById('generateButtonSpinner');
const generateButtonText = document.getElementById('generateButtonText');
const mosaicTitle = document.getElementById('mosaicTitle');
var colorKey = {};
var colorKeyCount = {};
var customWidth = 16;
var customHeight = 16;
var customColor = 'white';

const bricks = {
	'6284070': '#7f7f7f',
	'6284071': '#b3b3b3',
	'6284572': '#ffffff',
	'6284573': '#d9c58a',
	'6284574': '#ff2928',
	'6284575': '#4d95fb',
	'6284577': '#ffed02',
	'6284582': '#ff9634',
	'6284583': '#b9e74f',
	'6284584': '#506c9d',
	'6284585': '#88323f',
	'6284586': '#835138',
	'6284587': '#feb5f0',
	'6284589': '#9c734f',
	'6284592': '#fffbe0',
	'6284595': '#7a803a',
	'6284596': '#7e7e7e',
	'6284598': '#ddec9b',
	'6284602': '#90bbf7',
	'6311436': '#ff719d',
	'6311437': '#1fa6a0',
	'6315196': '#ffddb9',
	'6322813': '#503b16',
	'6322818': '#d8f9f0',
	'6322819': '#71bddc',
	'6322820': '#d0a7e3',
	'6322821': '#fc44bf',
	'6322822': '#ffbf31',
	'6322823': '#c1e0fe',
	'6322824': '#3f99cc',
	'6322840': '#ac603d',
	'6322841': '#a69579',
	'6322842': '#99a6af',
	'6343472': '#e79f71',
	'6343806': '#fffe88',
	'6353793': '#6cd554',
	'6376825': '#fffd04',
	'6396247': '#38c764',
}

function getBrickLink(uuid) {
	let url = `https://www.lego.com/en-gb/pick-and-build/pick-a-brick?designNumber=35381&query=${uuid}`;
	return url;
}

function handleHeightWidthChange() {
	// remove the outdated width and height class
	pixelArtCanvas.classList.remove(`b-${customWidth}x${customHeight}`);

	// update with new height and width
	customHeight = heightInput.value;
	customWidth = widthInput.value;
	pixelArtCanvas.classList.add(`b-${customWidth}x${customHeight}`);
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
	pixelArtCanvas.classList.remove(`b-${customColor}`);
	customColor = color;
	pixelArtCanvas.classList.add(`b-${customColor}`);
	let buttonTextColor = (color == 'white') ? 't-black' : 't-white';
	legoBoardColorButton.className = `btn btn-secondary dropdown-toggle pt-sans bg-${color} ${buttonTextColor}`

	let dropdownToggle = document.getElementById('legoBoardColorButton');
	let dropdown = new bootstrap.Dropdown(dropdownToggle);
	dropdown.hide();
}

async function handleImageUpload() {
	// set button to loading text
	generateButtonSpinner.classList.remove('d-none');
	generateButtonSpinner.classList.add('d-block');
	generateButtonText.innerText = 'Loading..';

	let processImagePromise;
	try {
		processImagePromise = processImage();
	}
	catch (ex) {
		console.error(`Something went wrong during processImage(): ${ex}`);
	}

	// reset button text
	generateButtonSpinner.classList.remove('d-block');
	generateButtonSpinner.classList.add('d-none');
	generateButtonText.innerText = 'Generate Instructions';
}

function processImage() {
	return new Promise((resolve, reject) => {
		var file = imageInput.files[0];
		if (file) {
			var reader = new FileReader();
			reader.onload = function (e) {
				let heightPixels = 27 * customHeight;
				let widthPixels = 27 * customWidth;

				pixelArtCanvas.width = widthPixels;
				pixelArtCanvas.height = heightPixels;

				scaledCanvas.height = customHeight;
				scaledCanvas.width = customWidth;

				var img = new Image();
				img.onload = function () {
					// Scale the image to fit
					var scaleFactor = Math.max(widthPixels / img.width, heightPixels / img.height);
					var scaledWidth = img.width * scaleFactor;
					var scaledHeight = img.height * scaleFactor;

					thumbnailCanvas.width = scaledWidth;
					thumbnailCanvas.height = scaledHeight;

					// clear the canvas
					scaledCtx.clearRect(0, 0, scaledCanvas.width, scaledCanvas.height);
					pixelArtCtx.clearRect(0, 0, pixelArtCanvas.width, pixelArtCanvas.height);
					thumbnailCtx.clearRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height);

					// Draw the scaled image on the scaledCanvas
					scaledCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, customWidth, customHeight);
					
					// Draw thumbnail on thumbnailCanvas
					thumbnailCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight)

					// Draw pixel art on pixelArtCanvas
					drawPixelArt(customWidth, customHeight);
				};
				img.src = e.target.result;
			};
			reader.readAsDataURL(file);
		}
	})

}

function drawPixelArt(width, height) {
	var circleRadius = 13.5; // Half of the circle's size
	var colorKey = {};
	var colorKeyCount = {};
	let colorNumber = 1;

	pixelArtCtx.clearRect(0, 0, width, height); // Clear the canvas before redrawing
	colorKeyDiv.innerHTML = ''; // Clear the color key

	for (let x = 0; x < width; x += 1) {
		for (let y = 0; y < height; y += 1) {
			let pixelRGBA = getPixelColor(x, y);

			// skip if pixel is transparent
			if (pixelRGBA.a != 0) {
				// Find the closest color in the bricks object
				let closestColorKey = findClosestColor(pixelRGBA.r, pixelRGBA.g, pixelRGBA.b);
				let pixelColor = hexToRgb(bricks[closestColorKey]);

				// Check if the color is already in the color key
				var key = findColorKey(colorKey, pixelColor);
				if (key === null) {
					key = `color_${colorNumber}`;
					colorKey[key] = pixelColor;
					colorKeyCount[key] = 1;
					colorNumber++;
				} else {
					colorKeyCount[key]++;
				}

				let color = colorKey[key];
				let label = key.split('_')[1];

				// Draw the numbered circle
				drawNumberedCircle(x * (circleRadius * 2), y * (circleRadius * 2), circleRadius, color, label);
			}
		}
	}

	// Display the color key as a table with 5 items per row
	let colorKeyTable = "<table>";
	let count = 0;
	let piecesCountTotal = 0;

	Object.entries(colorKey).forEach(([key, pixelColor]) => {
		let hexColor = rgbToHex(pixelColor.r, pixelColor.g, pixelColor.b);
		let label = key.split('_')[1];
		let brickCount = colorKeyCount[key];
		piecesCountTotal += brickCount;

		if (count % 5 === 0) {
			colorKeyTable += "<tr>";
		}

		let uuid = reverseLookup(hexColor, bricks);

		colorKeyTable += `<td class="mr-2">${label}: <a target="_blank" rel="noopener noreferrer" href="${getBrickLink(uuid)}">${uuid}</a> <img class="img-sm" src="static/images/${uuid}.jpg"><span>x ${brickCount}</span></td>`;

		count++;

		if (count % 5 === 0) {
			colorKeyTable += "</tr>";
		}
	});

	// If the last row is not complete, close it
	if (count % 5 !== 0) {
		colorKeyTable += "</tr>";
	}

	colorKeyTable += "</table>";

	colorKeyDiv.innerHTML = colorKeyTable;

	piecesCount.innerText = piecesCountTotal;
}

function reverseLookup(hexColor, bricksObject) {
	for (const [id, color] of Object.entries(bricksObject)) {
		if (color === hexColor) {
			return id;
		}
	}
	return null; // Return null if no matching id is found
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

function getPixelColor(x, y) {
	var imageData = scaledCtx.getImageData(x, y, 1, 1).data;

	let r = imageData[0];
	let g = imageData[1];
	let b = imageData[2];
	let a = imageData[3];

	return { r, g, b, a };
}

function findClosestColor(r, g, b) {
	let closestKey = null;
	let closestDistance = Infinity;

	for (let key in bricks) {
		let brickColor = bricks[key];
		let brickRgb = hexToRgb(brickColor);
		let distance = colorDistance(r, g, b, brickRgb.r, brickRgb.g, brickRgb.b);

		if (distance < closestDistance) {
			closestDistance = distance;
			closestKey = key;
		}
	}

	return closestKey;
}

function hexToRgb(hex) {
	// Convert hex color code to RGB
	let bigint = parseInt(hex.slice(1), 16);
	let r = (bigint >> 16) & 255;
	let g = (bigint >> 8) & 255;
	let b = bigint & 255;
	return { r, g, b };
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
	// Calculate the Euclidean distance between two RGB colors
	return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
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

function capture() {
	// Get the scrollable div
	var captureDiv = document.getElementById('instructions');

	// Create a canvas with dimensions equal to the scrollable content
	html2canvas(captureDiv, { height: captureDiv.scrollHeight, width: captureDiv.scrollWidth }).then(function (canvas) {
		// Convert canvas to PNG image data
		var imageData = canvas.toDataURL('image/png');

		// Optionally, you can download the image
		var link = document.createElement('a');
		link.href = imageData;
		link.download = `${mosaicTitle.innerText}.png`
		link.click();
	});
}
