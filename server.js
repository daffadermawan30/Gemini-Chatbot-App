require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Konfigurasi Multer (Simpan file di Memory sementara agar cepat diproses ke AI)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // Batas file 10MB (bisa dinaikkan)
});

// Konfigurasi Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Fungsi Helper: Mengubah Buffer file menjadi format yang diterima Gemini
function fileToGenerativePart(buffer, mimeType) {
    return {
        inlineData: {
            data: buffer.toString("base64"),
            mimeType
        },
    };
}

// Endpoint Utama: /api/generate
// Menerima input: 
// 1. 'prompt' (Text)
// 2. 'file' (Image/PDF/Audio) - Opsional
app.post('/api/generate', upload.single('file'), async (req, res) => {
    try {
        // 1. Ambil data dari Request
        const promptText = req.body.prompt || "Jelaskan input ini";
        const file = req.file;

        console.log(`Request diterima. Prompt: "${promptText.substring(0, 50)}..."`);
        if (file) console.log(`File terdeteksi: ${file.mimetype}`);

        // 2. Pilih Model (Gunakan gemini-1.5-flash untuk multimodal cepat)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // 3. Siapkan Array Prompt untuk dikirim ke AI
        const promptParts = [promptText];

        // Jika ada file, masukkan ke dalam prompt
        if (file) {
            const filePart = fileToGenerativePart(file.buffer, file.mimetype);
            promptParts.push(filePart);
        }

        // 4. Kirim ke Gemini AI
        const result = await model.generateContent(promptParts);
        const response = await result.response;
        const text = response.text();

        // 5. Kirim Balasan ke Client (JSON)
        res.json({
            success: true,
            model: "gemini-2.5-flash",
            input_type: file ? file.mimetype : "text-only",
            response: text
        });

    } catch (error) {
        console.error("Error generating content:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Terjadi kesalahan pada server AI"
        });
    }
});

app.listen(port, () => {
    console.log(`Server RESTful API berjalan di http://localhost:${port}`);
});
