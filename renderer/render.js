import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

let browserPromise = null;

async function getBrowser() {
	if (!browserPromise) {
		browserPromise = chromium.launch();
	}
	return browserPromise;
}

export async function renderClock(outputPath, url = 'https://slashie.net/time') {
	const browser = await getBrowser();
	const context = await browser.newContext({
		viewport: { width: 480, height: 360 },
		deviceScaleFactor: 1,
	});
	try {
		const page = await context.newPage();
		await page.goto(url, { waitUntil: 'load' });
		await page.waitForFunction(
			() => {
				const anchor = document.getElementById('clockAnchor');
				if (!anchor) return false;
				const imgs = anchor.querySelectorAll('img');
				if (imgs.length === 0) return false;
				return Array.from(imgs).every((img) => img.complete && img.naturalWidth > 0);
			},
			null,
			{ timeout: 10000 }
		);
		await page.locator('#clockAnchor').screenshot({
			path: outputPath,
			omitBackground: true,
			type: 'png',
		});
	} finally {
		await context.close();
	}
}

export async function shutdown() {
	if (browserPromise) {
		const browser = await browserPromise;
		browserPromise = null;
		await browser.close();
	}
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
	const url = process.env.SMC_URL ?? 'https://slashie.net/time';
	const output = process.argv[2] ?? 'current.png';
	try {
		await renderClock(output, url);
		console.log(`Wrote ${output}`);
	} finally {
		await shutdown();
	}
}
