import fs from 'fs';
import path from 'path';
import os from 'os';

// Config
const STORAGE_DIR = path.join(os.homedir(), 'Documents', 'ISuite_Images');

// Ensure storage dir exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Handle image upload
 */
export async function uploadImage(req, res) {
    try {
        const { images } = req.body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ error: 'No images provided' });
        }

        const uploadedImages = [];

        for (const img of images) {
            const { name, type, data } = img;
            
            // Validate data
            if (!data || !name) continue;

            // Simple validation of type
            const ext = name.split('.').pop() || 'png';
            const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
            const filepath = path.join(STORAGE_DIR, filename);
            
            // Write file
            const buffer = Buffer.from(data, 'base64');
            fs.writeFileSync(filepath, buffer);

            // Construct response object
            uploadedImages.push({
                originalName: name,
                filename: filename,
                path: filepath, // Absolute path for AI to read
                url: `/images/${filename}` // Relative URL for frontend to display (if served locally)
            });
            
            console.log(`[UPLOAD] Saved image: ${filepath}`);
        }

        res.json({ success: true, uploadedImages });
    } catch (error) {
        console.error('[UPLOAD ERROR]', error);
        res.status(500).json({ error: 'Failed to upload images', message: error.message });
    }
}
