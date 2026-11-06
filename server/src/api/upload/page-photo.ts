import {
	InvalidPageUploadError,
	PageUploadTooLargeError,
} from "../../core/errors/page-ingestion.error.js";

export const MAX_PAGE_PHOTO_BYTES = 10_000_000;

export type PagePhotoMediaType = "image/jpeg" | "image/png";

export interface ValidatedPagePhoto {
	bytes: Buffer;
	mediaType: PagePhotoMediaType;
}

export function validatePagePhoto(
	bytes: Buffer,
	declaredMediaType: string,
): ValidatedPagePhoto {
	if (bytes.length > MAX_PAGE_PHOTO_BYTES) {
		throw new PageUploadTooLargeError();
	}

	const detectedMediaType = detectImageType(bytes);
	const normalizedDeclaredMediaType = declaredMediaType.toLowerCase() === "image/jpg"
		? "image/jpeg"
		: declaredMediaType.toLowerCase();

	if (!detectedMediaType || normalizedDeclaredMediaType !== detectedMediaType) {
		throw new InvalidPageUploadError("The photo content must be a valid JPEG or PNG matching its media type");
	}

	return { bytes, mediaType: detectedMediaType };
}

function detectImageType(bytes: Buffer): PagePhotoMediaType | null {
	if (isValidPng(bytes)) return "image/png";
	if (isValidJpeg(bytes)) return "image/jpeg";
	return null;
}

function isValidPng(bytes: Buffer): boolean {
	const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	if (bytes.length < 45 || !bytes.subarray(0, 8).equals(signature)) return false;

	let offset = 8;
	let sawHeader = false;
	let sawImageData = false;
	while (offset + 12 <= bytes.length) {
		const length = bytes.readUInt32BE(offset);
		const chunkEnd = offset + 12 + length;
		if (chunkEnd > bytes.length) return false;
		const expectedCrc = bytes.readUInt32BE(offset + 8 + length);
		const actualCrc = crc32(bytes.subarray(offset + 4, offset + 8 + length));
		if (actualCrc !== expectedCrc) return false;

		const type = bytes.toString("ascii", offset + 4, offset + 8);
		if (!sawHeader) {
			if (type !== "IHDR" || length !== 13) return false;
			const width = bytes.readUInt32BE(offset + 8);
			const height = bytes.readUInt32BE(offset + 12);
			if (width === 0 || height === 0) return false;
			sawHeader = true;
		} else if (type === "IHDR") {
			return false;
		}

		if (type === "IDAT") sawImageData = true;
		if (type === "IEND") {
			return length === 0 && sawHeader && sawImageData && chunkEnd === bytes.length;
		}
		offset = chunkEnd;
	}

	return false;
}

function crc32(bytes: Uint8Array): number {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit += 1) {
			crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
		}
	}
	return (crc ^ 0xffffffff) >>> 0;
}

const JPEG_START_OF_FRAME_MARKERS = new Set([
	0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
	0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function isValidJpeg(bytes: Buffer): boolean {
	if (bytes.length < 12 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return false;

	let offset = 2;
	let sawFrame = false;
	let sawScan = false;
	while (offset < bytes.length) {
		if (bytes[offset] !== 0xff) return false;
		while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
		if (offset >= bytes.length) return false;

		const marker = bytes[offset] ?? 0;
		offset += 1;
		if (marker === 0xd9) return sawFrame && sawScan;
		if (marker === 0x00 || marker === 0xd8) return false;
		if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
		if (offset + 2 > bytes.length) return false;

		const segmentLength = bytes.readUInt16BE(offset);
		if (segmentLength < 2 || offset + segmentLength > bytes.length) return false;
		if (JPEG_START_OF_FRAME_MARKERS.has(marker)) {
			if (segmentLength < 8) return false;
			const height = bytes.readUInt16BE(offset + 3);
			const width = bytes.readUInt16BE(offset + 5);
			if (width === 0 || height === 0) return false;
			sawFrame = true;
		}

		offset += segmentLength;
		if (marker !== 0xda) continue;
		sawScan = true;

		while (offset < bytes.length) {
			if (bytes[offset] !== 0xff) {
				offset += 1;
				continue;
			}
			const markerStart = offset;
			while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
			if (offset >= bytes.length) return false;
			const scanMarker = bytes[offset] ?? 0;
			if (scanMarker === 0x00 || (scanMarker >= 0xd0 && scanMarker <= 0xd7)) {
				offset += 1;
				continue;
			}
			offset = markerStart;
			break;
		}
	}

	return false;
}
