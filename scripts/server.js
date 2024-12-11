const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const cors = require('cors');

const app = express();
const port = 8000;

// Middleware
app.use(cors());

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// OCR endpoint
app.post('/api/extract-text-from-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file || !req.body.lang) {
            return res.status(400).json({ error: 'Image and language are required.' });
        }

        const { buffer } = req.file;
        const { lang } = req.body;

        // Perform OCR using Tesseract.js
        const result = await Tesseract.recognize(buffer, lang);
        const extractedText = result.data.text;

        res.json({ extractedText });
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ error: 'Failed to extract text from image.' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
