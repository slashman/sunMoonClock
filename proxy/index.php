<?php
// Reverse-proxy / per-minute-per-tz cache for the sun-moon clock PNG.
// Drop this index.php into a directory on the shared host that serves the
// clock; the directory's public URL becomes the endpoint the widgets hit.
// Set UPSTREAM_URL to the public URL of your Node renderer's /current endpoint.

const UPSTREAM_URL      = 'https://smc-renderer.onrender.com/current';
const CACHE_DIR         = __DIR__ . '/cache';
const TIMEOUT_SECONDS   = 8;
const CONNECT_TIMEOUT_S = 4;
const TZ_RE             = '#^[A-Za-z][A-Za-z0-9+_-]*(/[A-Za-z0-9+_-]+)*$#';

function validate_tz(?string $raw): ?string {
	if ($raw === null || $raw === '') return 'UTC';
	return preg_match(TZ_RE, $raw) ? $raw : null;
}

function cache_path(string $tz): string {
	return CACHE_DIR . '/' . str_replace('/', '~', $tz) . '.png';
}

function fresh_for_current_minute(string $path): bool {
	if (!is_file($path)) return false;
	$mtime = filemtime($path);
	return $mtime !== false && intdiv($mtime, 60) === intdiv(time(), 60);
}

function fetch_upstream(string $tz): ?string {
	$url = UPSTREAM_URL . '?tz=' . rawurlencode($tz);
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

$tz = validate_tz($_GET['tz'] ?? null);
if ($tz === null) {
	http_response_code(400);
	header('Content-Type: text/plain');
	echo "invalid tz\n";
	exit;
}

if (!is_dir(CACHE_DIR)) @mkdir(CACHE_DIR, 0755, true);
$cache = cache_path($tz);

if (fresh_for_current_minute($cache)) {
	serve($cache);
	exit;
}

$body = fetch_upstream($tz);
if ($body !== null) {
	write_atomic($cache, $body);
	serve($cache);
	exit;
}

if (is_file($cache)) {
	serve($cache);
	exit;
}

http_response_code(503);
header('Content-Type: text/plain');
echo "renderer unavailable\n";
