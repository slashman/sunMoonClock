import http from 'node:http';
import { stat, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { renderClock, shutdown } from './render.js';

const PORT = Number(process.env.PORT ?? 3000);
const URL_TO_RENDER = process.env.SMC_URL ?? 'http://localhost:8000';
const CACHE_DIR = process.env.SMC_CACHE_DIR ?? 'cache';
const TZ_RE = /^[A-Za-z][A-Za-z0-9+_-]*(\/[A-Za-z0-9+_-]+)*$/;

await mkdir(CACHE_DIR, { recursive: true });

const inflight = new Map();

function validateTz(raw) {
	if (raw === null || raw === '') return 'UTC';
	return TZ_RE.test(raw) ? raw : null;
}

function cachePath(tz) {
	return path.join(CACHE_DIR, tz.replace(/\//g, '~') + '.png');
}

async function isFreshForCurrentMinute(file) {
	try {
		const s = await stat(file);
		return Math.floor(s.mtimeMs / 60000) === Math.floor(Date.now() / 60000);
	} catch {
		return false;
	}
}

async function ensureFresh(tz) {
	const file = cachePath(tz);
	if (await isFreshForCurrentMinute(file)) return file;
	let p = inflight.get(tz);
	if (!p) {
		p = renderClock(file, URL_TO_RENDER, tz).finally(() => inflight.delete(tz));
		inflight.set(tz, p);
	}
	await p;
	return file;
}

const server = http.createServer(async (req, res) => {
	if (req.method !== 'GET') {
		res.statusCode = 405;
		res.end();
		return;
	}
	const reqUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
	if (reqUrl.pathname !== '/current') {
		res.statusCode = 404;
		res.end();
		return;
	}
	const tz = validateTz(reqUrl.searchParams.get('tz'));
	if (tz === null) {
		res.statusCode = 400;
		res.setHeader('Content-Type', 'text/plain');
		res.end('invalid tz\n');
		return;
	}
	try {
		const file = await ensureFresh(tz);
		const buffer = await readFile(file);
		res.statusCode = 200;
		res.setHeader('Content-Type', 'image/png');
		res.setHeader('Cache-Control', 'public, max-age=60');
		res.setHeader('Content-Length', buffer.length);
		res.end(buffer);
	} catch (e) {
		console.error(`render failed (tz=${tz}):`, e);
		res.statusCode = 500;
		res.setHeader('Content-Type', 'text/plain');
		res.end('render failed');
	}
});

server.listen(PORT, () => console.log(`smc-renderer listening on :${PORT}`));

const close = async () => {
	server.close();
	await shutdown();
	process.exit(0);
};
process.on('SIGINT', close);
process.on('SIGTERM', close);
