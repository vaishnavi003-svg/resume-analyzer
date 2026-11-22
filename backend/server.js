// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*' // Abhi testing ke liye sabko allow kar rahe hain
}));
app.use(express.json());

// Multer: in-memory file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

// ---------------------------------------------------------
// GEMINI SETUP (API Version explicitly set to v1beta)
// ---------------------------------------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel(
  {
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
  },
  {
    apiVersion: 'v1beta', 
  }
);

function buildPrompt(resumeText, jobDescription) {
  return `
You are an expert technical recruiter and ATS analyst.
Compare the RESUME against the JOB DESCRIPTION below.

Return ONLY raw JSON. No markdown, no backticks, no extra text.
{
  "matchScore": <integer 0-100>,
  "summary": "<2-4 sentences>",
  "missingSkills": ["<skill>"],
  "suggestions": ["<suggestion>"]
}

===== RESUME START =====
${resumeText}
===== RESUME END =====

===== JOB DESCRIPTION START =====
${jobDescription}
===== JOB DESCRIPTION END =====
`;
}

function cleanAndParseJson(rawText) {
  const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

function normalizeReport(report) {
  const score = Math.round(Number(report.matchScore));
  return {
    matchScore: Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0,
    summary: String(report.summary || 'No summary provided.'),
    missingSkills: Array.isArray(report.missingSkills) ? report.missingSkills.map(String) : [],
    suggestions: Array.isArray(report.suggestions) ? report.suggestions.map(String) : [],
  };
}

app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF resume.' });
    }
    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({ error: 'Please provide a job description.' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.trim();

    if (!resumeText) {
      return res.status(422).json({ error: 'Could not extract text from this PDF.' });
    }

    const prompt = buildPrompt(resumeText, jobDescription.trim());
    
    // ---------------------------------------------------------
    // RETRY LOGIC FOR GEMINI 503 ERRORS
    // ---------------------------------------------------------
    let result;
    let retries = 3; 
    
    while (retries > 0) {
      try {
        result = await model.generateContent(prompt);
        break; // Success, exit loop
      } catch (error) {
        if (error.status === 503 && retries > 1) {
          console.log(`⚠️ Gemini server busy (503). Retrying in 2 seconds... (${retries - 1} attempts left)`);
          retries--;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        } else {
          throw error; // If not 503, or out of retries, throw error
        }
      }
    }

    const rawText = result.response.text();

    let report;
    try {
      report = normalizeReport(cleanAndParseJson(rawText));
    } catch (parseErr) {
      console.error('Failed to parse AI response:', rawText);
      return res.status(502).json({ error: 'AI returned invalid JSON. Try again.' });
    }

    const insertQuery = `
      INSERT INTO analyses (filename, match_score, report)
      VALUES ($1, $2, $3)
      RETURNING id, created_at;
    `;
    const dbResult = await pool.query(insertQuery, [
      req.file.originalname,
      report.matchScore,
      JSON.stringify(report),
    ]);

    res.status(200).json({
      id: dbResult.rows[0].id,
      createdAt: dbResult.rows[0].created_at,
      filename: req.file.originalname,
      ...report,
    });
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Failed to init DB:', err);
    process.exit(1);
  });