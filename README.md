# AI Resume Analyzer & Job Match Platform

A full-stack web app that compares a PDF resume against a job description and returns a match score (0-100), a short summary, a list of missing skills, and suggestions to improve the resume. Every analysis is saved to a PostgreSQL database.

Live demo: https://resume-analyzer-yuj5.vercel.app
API: https://resume-analyzer-api-9rj3.onrender.com

The backend runs on a free hosting plan that sleeps when idle. The first request after a break can take 30-60 seconds.

Features
Upload a PDF resume and paste a job description
Text extraction from the PDF on the server (in memory, nothing is written to disk)
AI analysis with the Google Gemini API using a strict JSON prompt
Defensive parsing: markdown fences are stripped and the result is validated before use
Results stored in PostgreSQL (JSONB report plus an integer score column)
Clean report card showing score, summary, missing skills and suggestions

Tech Stack
Layer	Technology
Frontend	React.js, Axios
Backend	Node.js, Express, Multer, pdf-parse
Database	PostgreSQL on Neon (@neondatabase/serverless)
AI	Google Gemini API (@google/generative-ai)
Hosting	Vercel (frontend), Render (backend)

Deployment

Backend (Render, Web Service)

Setting	Value
Root Directory	backend
Build Command	npm install
Start Command	npm start
Environment variables	DATABASE_URL, GEMINI_API_KEY, GEMINI_MODEL, NODE_VERSION=20

Frontend (Vercel)

Setting	Value
Root Directory	frontend-app
Framework Preset	Create React App
Environment variable	REACT_APP_API_URL = your Render backend URL (no trailing slash)
