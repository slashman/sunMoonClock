import { chromium } from 'playwright';

const URL = process.env.SMC_URL ?? 'https://slashie.net/time';
const OUTPUT = process.argv[2] ?? 'current.png';

const browser = await chromium.launch();
try {
	const context = await browser.newContext({
		viewport: { width: 480, height: 360 },
		deviceScaleFactor: 1,
	});
	const page = await context.newPage();
	await page.goto(URL, { waitUntil: 'load' });

	await page.waitForFunction(() => {
		const anchor = document.getElementById('clockAnchor');
		if (!anchor) return false;
		const imgs = anchor.querySelectorAll('img');
		if (imgs.length === 0) return false;
		return Array.from(imgs).every((img) => img.complete && img.naturalWidth > 0);
	});

	await page.locator('#clockAnchor').screenshot({
		path: OUTPUT,
		omitBackground: true,
		type: 'png',
	});

	console.log(`Wrote ${OUTPUT}`);
} finally {
	await browser.close();
}
