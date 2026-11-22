# AI Resume Analyzer & Job Match Platform

## Backend
cd backend
npm install
cp .env.example .env     # fill in DATABASE_URL and GEMINI_API_KEY
psql -U postgres -c "CREATE DATABASE resume_analyzer;"
npm run dev              # http://localhost:5000

## Frontend
npx create-react-app frontend   # skip if you already have it
cd frontend
npm install axios
# replace src/App.js with the provided file
npm start                # http://localhost:3000
