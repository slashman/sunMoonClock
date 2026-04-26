const radiansPerHour = (2 * Math.PI) / 24;
const radius = 288 / 2;
const iconHalfWidth = 48;
const frameOffsetX = 48;
const frameOffsetY = 84;
const backgroundsTileWidth = 288;
const minstrelTileWidth = 96;

// From http://www.krazydad.com/makecolors.php
function RGB2Color(r, g, b) {
	return '#' + byte2Hex(r) + byte2Hex(g) + byte2Hex(b);
}

function RGB2Hexa(r, g, b) {
	return parseInt(byte2Hex(r) + byte2Hex(g) + byte2Hex(b), 16);
}

// From http://www.krazydad.com/makecolors.php
function byte2Hex(n) {
	var nybHexString = "0123456789ABCDEF";
	return String(nybHexString.substr((n >> 4) & 0x0F, 1)) + nybHexString.substr(n & 0x0F, 1);
}

function getSunStrength(hour) {
	if (hour < 0)
		hour = 0;
	if (hour > 2359)
		hour = 2359;
	if (hour > 1200)
		hour = 2400 - hour;
	return 1.0007721047271 * (1 - Math.pow(1 + Math.pow(hour / 439.73631426292, 7.8143467692704), -0.913569795416587));
}

const skyColor = {
	setup(atmosphereDiffraction, atmosphereBase, sunColor, moonColor) {
		this.atmosphereDiffraction = atmosphereDiffraction;
		this.atmosphereBase = atmosphereBase;
		this.sunColor = sunColor;
		this.moonColor = moonColor;
	},

	/**
	 * @param hourOfDay, number from 0000 to 2359
	 */
	getColor(hourOfDay) {
		const sunStrength = getSunStrength(hourOfDay);
		const moonStrength = 1 - sunStrength;

		let skyr = this.atmosphereBase.r;
		let skyg = this.atmosphereBase.g;
		let skyb = this.atmosphereBase.b;

		skyr += this.sunColor.r * sunStrength * this.atmosphereDiffraction.r;
		skyg += this.sunColor.g * sunStrength * this.atmosphereDiffraction.g;
		skyb += this.sunColor.b * sunStrength * this.atmosphereDiffraction.b;

		skyr += this.moonColor.r * moonStrength * this.atmosphereDiffraction.r;
		skyg += this.moonColor.g * moonStrength * this.atmosphereDiffraction.g;
		skyb += this.moonColor.b * moonStrength * this.atmosphereDiffraction.b;

		if (skyr > 255) {
			skyr = 255;
		}
		if (skyg > 255) {
			skyg = 255;
		}
		if (skyb > 255) {
			skyb = 255;
		}
		return RGB2Color(skyr, skyg, skyb);
	}
}

const EARTH = {
	atmosphereBase: {
		r: 0, g: 0, b: 0
	},
	atmosphereDiffraction: {
		r: 0.15, g: 0.48, b: 0.84
	},
};

const SUNLIGHT = { r: 255, g: 255, b: 255 };
const MOONLIGHT = { r: 80, g: 80, b: 80 };

skyColor.setup(EARTH.atmosphereDiffraction, EARTH.atmosphereBase, SUNLIGHT, MOONLIGHT);

window.smc = {
	init (anchorElementId) {
		this.anchorElement = document.getElementById(anchorElementId);
		
		// Create elements
		this.sunImg = document.createElement("img");
		this.moonImg = document.createElement("img");
		this.cloudImg = document.createElement("img");
		this.frameImg = document.createElement("img");
		this.starsImg = document.createElement("img");
		this.backgroundsDiv = document.createElement("div");
		this.minstrel = document.createElement("div");

		// Add classes
		this.anchorElement.classList.add('smc_container');
		this.sunImg.classList.add('smc_sprite');
		this.moonImg.classList.add('smc_sprite');
		this.cloudImg.classList.add('smc_sprite');
		this.frameImg.classList.add('smc_sprite');
		this.backgroundsDiv.classList.add('smc_backgrounds');
		this.minstrel.classList.add('smc_minstrel');
		this.starsImg.classList.add('smc_stars');

		// Set image sources
		this.sunImg.src = "sun.png";
		this.moonImg.src = "moon.png";
		this.frameImg.src = "frame.png";
		this.cloudImg.src = "cloud.png";
		this.starsImg.src = "stars.png";

		// Append all elements
		this.anchorElement.appendChild(this.starsImg);
		this.anchorElement.appendChild(this.sunImg);
		this.anchorElement.appendChild(this.moonImg);
		this.anchorElement.appendChild(this.cloudImg);
		this.anchorElement.appendChild(this.backgroundsDiv);
		this.anchorElement.appendChild(this.frameImg);
		this.anchorElement.appendChild(this.minstrel);

		// Initialize control variables
		this.currentMinstrelFrame = 0;
		this.cloudPositionX = -1000;

		// Setup ticks
		setInterval(() => this.secondsTick(), 1000);
		setInterval(() => this.minstrelFrameTick(), 1000 / 4);
		setInterval(() => this.frameTick(), 1000 / 24);

		this.secondsTick();
	},
	getCurrentHourOfDay () {
		const currentDate = new Date();
		return currentDate.getHours() + currentDate.getMinutes() / 60;
		// return new Date().getSeconds() % 24; // Used for quick testing
	},
	getCurrentMinuteOfTheHourOfDay () {
		return new Date().getMinutes();
	},
	secondsTick () {
		this.updateCelestialBodies();
		this.updateSkyColor();
		this.updateLandscape();
		this.updateStars();
	},
	updateCelestialBodies() {
		const hours = this.getCurrentHourOfDay();
		let sunAngle = (Math.PI * 1.5) -(hours * radiansPerHour);
		let moonAngle = sunAngle + Math.PI;
		const moonX = radius + Math.cos(moonAngle) * radius - iconHalfWidth + frameOffsetX;
		const moonY = radius - Math.sin(moonAngle) * radius - iconHalfWidth + frameOffsetY;
		this.moonImg.style.top = moonY + "px";
		this.moonImg.style.left = moonX + "px";
		const sunX = radius + Math.cos(sunAngle) * radius - iconHalfWidth + frameOffsetX;
		const sunY = radius - Math.sin(sunAngle) * radius - iconHalfWidth + frameOffsetY;
		this.sunImg.style.top = sunY + "px";
		this.sunImg.style.left = sunX + "px";
	},
	updateSkyColor() {
		const currentHourOfDay = this.getCurrentHourOfDay();
		const currentMinuteOfHour = this.getCurrentMinuteOfTheHourOfDay();
		const currentHHMM = Math.floor(currentHourOfDay) * 100 + currentMinuteOfHour;
		this.anchorElement.style.backgroundColor = skyColor.getColor(currentHHMM);
	},
	updateLandscape() {
		const currentHourOfDay = Math.floor(this.getCurrentHourOfDay());
		// 18 backgrounds in total
		const backgroundToUse = currentHourOfDay % 18;
		// TODO: Improve background selection
		this.backgroundsDiv.style.backgroundPositionX = (backgroundToUse * -backgroundsTileWidth) + "px";
	},
	minstrelFrameTick () {
		this.currentMinstrelFrame++;
		this.minstrel.style.backgroundPositionX = (this.currentMinstrelFrame * -minstrelTileWidth) + "px";
		if (this.currentMinstrelFrame > 4) {
			this.currentMinstrelFrame = 0;
		}
	},
	frameTick () {
		this.cloudPositionX -= (1000 / 24) / 40;
		if (this.cloudPositionX < -200) {
			this.cloudPositionX = 390;
			this.cloudPositionY = 64 + Math.floor(Math.random() * (100 - 64));
		}
		this.cloudImg.style.top = Math.floor(this.cloudPositionY) + "px";
		this.cloudImg.style.left = Math.floor(this.cloudPositionX) + "px";
	},
	updateStars () {
		const currentHourOfDay = this.getCurrentHourOfDay();
		if (currentHourOfDay > 8 && currentHourOfDay < 18) {
			this.starsImg.style.opacity = 0;
		} else if (currentHourOfDay < 7 || currentHourOfDay > 19) {
			this.starsImg.style.opacity = 1;
		} else {
			// TODO: Lerp opacity from 7 to 8 am and 6 to 7pm
			this.starsImg.style.opacity = 0.5;
		}
	}
}
