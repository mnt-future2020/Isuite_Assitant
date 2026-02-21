import fs from 'fs';
import path from 'path';
import os from 'os';

// Config - Conservative limits to protect user's API tokens
const STORAGE_DIR = path.join(os.homedir(), 'Documents', 'ISuite_Images');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB total per request
const MAX_FILES = 3; // Maximum 3 files per request

// Blocked file extensions (executable/dangerous types)
const BLOCKED_EXTENSIONS = new Set([
    'exe', 'bat', 'cmd', 'sh', 'ps1', 'msi', 'dll', 'sys',
    'com', 'scr', 'vbs', 'vbe', 'wsf', 'wsh', 'cpl', 'inf',
    'reg', 'rgs', 'lnk', 'pif',
]);

// Sanitize filename to prevent path traversal and other attacks
function sanitizeFilename(name) {
    // Remove any path separators and null bytes
    let safe = name.replace(/[\\/:\0]/g, '_');
    // Remove any leading dots (hidden files) or double-dots (traversal)
    safe = safe.replace(/^\.+/, '');
    // Collapse multiple underscores and trim
    safe = safe.replace(/_+/g, '_').trim();
    return safe || 'unnamed_file';
}

// Ensure storage dir exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Handle file upload (images and other files) with size validation
 */
export async function uploadImage(req, res) {
    try {
        const { images } = req.body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }

        // Validate file count
        if (images.length > MAX_FILES) {
            return res.status(400).json({ 
                error: `Too many files. Maximum ${MAX_FILES} files allowed per upload.` 
            });
        }

        const uploadedImages = [];
        let totalSize = 0;

        for (const img of images) {
            const { name, type, data } = img;
            
            // Validate data
            if (!data || !name) {
                console.warn(`[UPLOAD] Skipping invalid file: ${name}`);
                continue;
            }

            // Sanitize filename
            const safeName = sanitizeFilename(name);

            // Get and validate extension
            const ext = (safeName.split('.').pop() || 'bin').toLowerCase();
            if (BLOCKED_EXTENSIONS.has(ext)) {
                return res.status(400).json({
                    error: `File type ".${ext}" is not allowed for security reasons.`
                });
            }

            // Decode base64 to get actual file size
            const buffer = Buffer.from(data, 'base64');
            const fileSize = buffer.length;

            // Validate individual file size
            if (fileSize > MAX_FILE_SIZE) {
                return res.status(400).json({ 
                    error: `File "${safeName}" is too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB per file.` 
                });
            }

            // Track total size
            totalSize += fileSize;
            if (totalSize > MAX_TOTAL_SIZE) {
                return res.status(400).json({ 
                    error: `Total upload size exceeds ${Math.round(MAX_TOTAL_SIZE / 1024 / 1024)}MB limit.` 
                });
            }

            // Generate safe, randomized filename
            const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
            const filepath = path.join(STORAGE_DIR, filename);
            
            // Write file
            fs.writeFileSync(filepath, buffer);

            // Determine if it's an image
            const isImage = type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(name);

            // Construct response object
            uploadedImages.push({
                originalName: name,
                filename: filename,
                path: filepath, // Absolute path for AI to read
                url: `/images/${filename}`, // Relative URL for frontend to display
                type: type || 'application/octet-stream',
                isImage: isImage,
                size: fileSize
            });
            
            console.log(`[UPLOAD] Saved ${isImage ? 'image' : 'file'}: ${filepath} (${Math.round(fileSize / 1024)}KB)`);
        }

        if (uploadedImages.length === 0) {
            return res.status(400).json({ error: 'No valid files to upload' });
        }

        res.json({ 
            success: true, 
            uploadedImages,
            totalSize: totalSize,
            count: uploadedImages.length
        });
    } catch (error) {
        console.error('[UPLOAD ERROR]', error);
        res.status(500).json({ error: 'Failed to upload files', message: error.message });
    }
}
