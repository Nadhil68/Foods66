import { Router, Request, Response } from 'express';
import upload from '../middlewares/upload';
import { protect, authorize, AuthRequest } from '../middlewares/auth';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '../../../uploads/foods');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * @desc    Upload and process food image
 * @route   POST /api/upload
 * @access  Private (Admin, Restaurant)
 * 
 * SECURITY:
 * - Requires authentication and admin/restaurant role
 * - Validates actual image format via Sharp (not just MIME type)
 * - Uses UUID for filenames (never uses original user-provided filenames)
 * - Converts all images to WebP format
 * - Generates three sizes: original, medium, thumbnail
 */
router.post('/', protect, authorize('admin', 'restaurant'), upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image uploaded', code: 'NO_IMAGE' });
      return;
    }

    // SECURITY: Validate actual image format using Sharp metadata
    // This catches cases where a non-image file has a spoofed MIME type
    let metadata;
    try {
      metadata = await sharp(req.file.buffer).metadata();
    } catch (sharpErr) {
      res.status(400).json({ success: false, message: 'Invalid image file — could not read image data', code: 'INVALID_IMAGE_DATA' });
      return;
    }

    // Reject non-image formats and potentially dangerous formats
    const allowedFormats = ['jpeg', 'png', 'webp', 'jpg', 'tiff', 'avif'];
    if (!metadata.format || !allowedFormats.includes(metadata.format)) {
      res.status(400).json({ 
        success: false, 
        message: `Unsupported image format: ${metadata.format}. Allowed: JPEG, PNG, WebP`,
        code: 'UNSUPPORTED_FORMAT'
      });
      return;
    }

    // Reject SVG (potential script injection vector)
    if (metadata.format === 'svg') {
      res.status(400).json({ success: false, message: 'SVG format is not allowed', code: 'SVG_NOT_ALLOWED' });
      return;
    }

    // Reject excessively large dimensions (potential decompression bomb)
    if ((metadata.width && metadata.width > 10000) || (metadata.height && metadata.height > 10000)) {
      res.status(400).json({ success: false, message: 'Image dimensions too large (max 10000x10000)', code: 'IMAGE_TOO_LARGE' });
      return;
    }

    // Generate safe UUID-based filename (never use original filename)
    const baseFilename = uuid();
    
    // Primary / Large
    const filename = `${baseFilename}.webp`;
    const filepath = path.join(uploadsDir, filename);
    await sharp(req.file.buffer)
      .resize({ width: 1200, height: 800, fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(filepath);

    // Medium
    const filenameMedium = `${baseFilename}-medium.webp`;
    const filepathMedium = path.join(uploadsDir, filenameMedium);
    await sharp(req.file.buffer)
      .resize({ width: 600, height: 400, fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(filepathMedium);

    // Thumb
    const filenameThumb = `${baseFilename}-thumb.webp`;
    const filepathThumb = path.join(uploadsDir, filenameThumb);
    await sharp(req.file.buffer)
      .resize({ width: 300, height: 300, fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(filepathThumb);

    res.json({
      success: true,
      image: `/uploads/foods/${filename}`,
      imageMedium: `/uploads/foods/${filenameMedium}`,
      imageThumb: `/uploads/foods/${filenameThumb}`,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: 'Failed to process image', code: 'UPLOAD_ERROR' });
  }
});

export default router;
