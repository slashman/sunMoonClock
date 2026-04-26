import http from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import { renderClock, shutdown } from './render.js';

const PORT = Number(process.env.PORT ?? 3000);
const URL_TO_RENDER = process.env.SMC_URL ?? 'http://localhost:8000';
const OUTPUT_FILE = process.env.SMC_OUTPUT ?? 'current.png';

let inflight = null;

async function isFreshForCurrentMinute() {
	try {
		const s = await stat(OUTPUT_FILE);
		return Math.floor(s.mtimeMs / 60000) === Math.floor(Date.now() / 60000);
	} catch {
		return false;
	}
}

async function ensureFresh() {
	if (await isFreshForCurrentMinute()) return;
	if (!inflight) {
		inflight = renderClock(OUTPUT_FILE, URL_TO_RENDER).finally(() => {
			inflight = null;
		});
	}
	await inflight;
}

const server = http.createServer(async (req, res) => {
	if (req.method !== 'GET') {
		res.statusCode = 405;
		res.end();
		return;
	}
	if (req.url === '/current') {
		try {
			await ensureFresh();
			const buffer = await readFile(OUTPUT_FILE);
			res.statusCode = 200;
			res.setHeader('Content-Type', 'image/png');
			res.setHeader('Cache-Control', 'public, max-age=60');
			res.setHeader('Content-Length', buffer.length);
			res.end(buffer);
		} catch (e) {
			console.error('render failed:', e);
			res.statusCode = 500;
			res.setHeader('Content-Type', 'text/plain');
			res.end('render failed');
		}
		return;
	}
	res.statusCode = 404;
	res.end();
});

server.listen(PORT, () => console.log(`smc-renderer listening on :${PORT}`));

const close = async () => {
	server.close();
	await shutdown();
	process.exit(0);
};
process.on('SIGINT', close);
process.on('SIGTERM', close);
