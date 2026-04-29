#!/bin/bash
# Builds the 1024x1024 opaque app icon from web/src/sun.png.
#
# - Nearest-neighbor upscale 96 -> 1024 (pixel-art preserving).
# - Composite over an opaque sky-blue background (App Store rejects alpha).
# - Output: ios/App/Assets.xcassets/AppIcon.appiconset/AppIcon.png
#
# Re-run this whenever web/src/sun.png changes.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$REPO_ROOT/web/src/sun.png"
DEST_DIR="$REPO_ROOT/ios/App/Assets.xcassets/AppIcon.appiconset"
DEST="$DEST_DIR/AppIcon.png"
BG_HEX="6FB7E8"  # daytime sky blue

mkdir -p "$DEST_DIR"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

cat > "$WORK/compose.swift" <<'SWIFT'
import AppKit
import CoreGraphics
import ImageIO

let args = CommandLine.arguments
guard args.count == 4 else {
	FileHandle.standardError.write("usage: compose <fg.png> <bg-hex> <out.png>\n".data(using: .utf8)!)
	exit(2)
}
let fgPath = args[1]
let hex = args[2]
let outPath = args[3]

func color(fromHex hex: String) -> CGColor {
	var s = hex
	if s.hasPrefix("#") { s.removeFirst() }
	let v = UInt32(s, radix: 16) ?? 0
	let r = CGFloat((v >> 16) & 0xFF) / 255.0
	let g = CGFloat((v >> 8) & 0xFF) / 255.0
	let b = CGFloat(v & 0xFF) / 255.0
	return CGColor(red: r, green: g, blue: b, alpha: 1.0)
}

guard let fgImage = NSImage(contentsOfFile: fgPath)?.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
	FileHandle.standardError.write("failed to load \(fgPath)\n".data(using: .utf8)!)
	exit(1)
}

let canvas = 1024
// Source is 96x96. Largest integer multiple that fits is 10x -> 960; leaves
// 32px of padding on each axis, which feels right for an icon. Center it.
let scale = canvas / fgImage.width
let drawSize = fgImage.width * scale
let originX = (canvas - drawSize) / 2
let originY = (canvas - drawSize) / 2

let cs = CGColorSpaceCreateDeviceRGB()
guard let ctx = CGContext(data: nil, width: canvas, height: canvas, bitsPerComponent: 8, bytesPerRow: 0, space: cs, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else {
	exit(1)
}
ctx.setFillColor(color(fromHex: hex))
ctx.fill(CGRect(x: 0, y: 0, width: canvas, height: canvas))
ctx.interpolationQuality = .none
ctx.draw(fgImage, in: CGRect(x: originX, y: originY, width: drawSize, height: drawSize))

guard let out = ctx.makeImage() else { exit(1) }
let url = URL(fileURLWithPath: outPath)
guard let dest = CGImageDestinationCreateWithURL(url as CFURL, "public.png" as CFString, 1, nil) else { exit(1) }
CGImageDestinationAddImage(dest, out, nil)
CGImageDestinationFinalize(dest)
SWIFT

swift "$WORK/compose.swift" "$SRC" "$BG_HEX" "$DEST"

echo "Wrote $DEST"
