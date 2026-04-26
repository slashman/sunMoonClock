<?php
// Reverse-proxy / per-minute cache for the sun-moon clock PNG.
// Drop this index.php into a directory on the shared host that serves the
// clock; the directory's public URL becomes the endpoint the widgets hit.
// Set UPSTREAM_URL to the public URL of your Node renderer's /current endpoint.

const UPSTREAM_URL      = 'https://your-renderer-host.example/current';
const CACHE_FILE        = __DIR__ . '/current.png';
const TIMEOUT_SECONDS   = 8;
const CONNECT_TIMEOUT_S = 4;

function fresh_for_current_minute(string $path): bool {
	if (!is_file($path)) return false;
	$mtime = filemtime($path);
	return $mtime !== false && intdiv($mtime, 60) === intdiv(time(), 60);
}

function fetch_upstream(string $url): ?string {
	$ch = curl_init($url);
	curl_setopt_array($ch, [
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_FOLLOWLOCATION => true,
		CURLOPT_TIMEOUT        => TIMEOUT_SECONDS,
		CURLOPT_CONNECTTIMEOUT => CONNECT_TIMEOUT_S,
	]);
	$body = curl_exec($ch);
	$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	curl_close($ch);
	return ($body !== false && $code === 200) ? $body : null;
}

function write_atomic(string $path, string $body): bool {
	$tmp = $path . '.tmp.' . getmypid();
	if (file_put_contents($tmp, $body) === false) return false;
	return rename($tmp, $path);
}

function serve(string $path): void {
	header('Content-Type: image/png');
	header('Cache-Control: public, max-age=60');
	header('Content-Length: ' . filesize($path));
	readfile($path);
}

if (fresh_for_current_minute(CACHE_FILE)) {
	serve(CACHE_FILE);
	exit;
}

$body = fetch_upstream(UPSTREAM_URL);
if ($body !== null) {
	write_atomic(CACHE_FILE, $body);
	serve(CACHE_FILE);
	exit;
}

// Upstream failed — fall back to stale cache if any
if (is_file(CACHE_FILE)) {
	serve(CACHE_FILE);
	exit;
}

http_response_code(503);
header('Content-Type: text/plain');
echo "renderer unavailable\n";
