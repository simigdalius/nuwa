import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const db = new sqlite3.Database('./nuwa.sqlite', (err) => {
    if (err) console.error("Σφάλμα σύνδεσης SQLite:", err);
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, email TEXT UNIQUE, password TEXT, xp INTEGER DEFAULT 0, level INTEGER DEFAULT 1)`);
    db.run(`CREATE TABLE IF NOT EXISTS daily_stats (user_id INTEGER, date TEXT, activity TEXT, hours REAL)`);
    db.run(`CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, description TEXT, deadline TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS weekly_goals (user_id INTEGER, week_start TEXT, study_goal REAL, workout_goal REAL, hobby_goal REAL)`);

    // Νέος πίνακας για τα αποθηκευμένα Quizzes
    db.run(`CREATE TABLE IF NOT EXISTS saved_quizzes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, questions TEXT)`);
});


// --- AUTH, XP, STATS, TODOS, GOALS ---

app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!password || password.length < 8) return res.status(400).json({ error: 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες!' });

    db.run(`INSERT INTO users (username, email, password, xp, level) VALUES (?, ?, ?, 0, 1)`, [username, email, password], function (err) {
        if (err) return res.status(400).json({ error: 'Το Username ή το Email υπάρχει ήδη!' });
        res.json({ success: true, user: { id: this.lastID, username, email, xp: 0, level: 1 } });
    });
});

app.post('/api/login', (req, res) => {
    db.get(`SELECT id, username, email, xp, level FROM users WHERE username = ? AND password = ?`, [req.body.username, req.body.password], (err, row) => {
        if (err || !row) return res.status(401).json({ error: 'Λάθος στοιχεία!' });
        res.json({ success: true, user: row });
    });
});

// ΝΕΟ ENDPOINT: Αλλαγή Κωδικού
app.post('/api/reset-password', (req, res) => {
    const { email, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'Ο νέος κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες!' });

    db.run(`UPDATE users SET password = ? WHERE email = ?`, [newPassword, email], function (err) {
        if (err) return res.status(500).json({ error: 'Σφάλμα βάσης δεδομένων.' });
        if (this.changes === 0) return res.status(404).json({ error: 'Δεν βρέθηκε χρήστης με αυτό το email!' });
        res.json({ success: true });
    });
});
app.post('/api/xp', (req, res) => {
    db.get("SELECT xp, level FROM users WHERE id = ?", [req.body.userId], (err, row) => {
        if (row) {
            let newXp = row.xp + req.body.xpToAdd;
            let newLevel = Math.floor(newXp / 400) + 1;
            db.run("UPDATE users SET xp = ?, level = ? WHERE id = ?", [newXp, newLevel, req.body.userId], () => res.json({ success: true, xp: newXp, level: newLevel }));
        }
    });
});
app.get('/api/stats', (req, res) => {
    db.all("SELECT * FROM daily_stats WHERE user_id = ? AND date >= ? AND date <= ?", [req.query.userId, req.query.startDate, req.query.endDate], (err, rows) => {
        const statsObj = {}; rows?.forEach(row => { if (!statsObj[row.date]) statsObj[row.date] = {}; statsObj[row.date][row.activity] = row.hours; }); res.json(statsObj);
    });
});
app.post('/api/stats', (req, res) => {
    db.get("SELECT hours FROM daily_stats WHERE user_id = ? AND date = ? AND activity = ?", [req.body.userId, req.body.date, req.body.activity], (err, row) => {
        if (row) db.run("UPDATE daily_stats SET hours = hours + ? WHERE user_id = ? AND date = ? AND activity = ?", [req.body.hours, req.body.userId, req.body.date, req.body.activity]);
        else db.run("INSERT INTO daily_stats (user_id, date, activity, hours) VALUES (?, ?, ?, ?)", [req.body.userId, req.body.date, req.body.activity, req.body.hours]);
        res.json({ success: true });
    });
});
app.get('/api/todos', (req, res) => { db.all("SELECT * FROM todos WHERE user_id = ?", [req.query.userId], (err, rows) => res.json(rows)); });
app.post('/api/todos', (req, res) => { db.run("INSERT INTO todos (user_id, title, description, deadline) VALUES (?, ?, ?, ?)", [req.body.userId, req.body.title, req.body.description, req.body.deadline], function () { res.json({ success: true }); }); });
app.delete('/api/todos/:id', (req, res) => { db.run("DELETE FROM todos WHERE id = ?", [req.params.id], () => res.json({ success: true })); });
app.get('/api/goals', (req, res) => { db.get("SELECT * FROM weekly_goals WHERE user_id = ? AND week_start = ?", [req.query.userId, req.query.weekStart], (err, row) => res.json(row || { study_goal: 0, workout_goal: 0, hobby_goal: 0 })); });
app.post('/api/goals', (req, res) => {
    db.get("SELECT * FROM weekly_goals WHERE user_id = ? AND week_start = ?", [req.body.userId, req.body.weekStart], (err, row) => {
        if (row) db.run("UPDATE weekly_goals SET study_goal = ?, workout_goal = ?, hobby_goal = ? WHERE user_id = ? AND week_start = ?", [req.body.studyGoal, req.body.workoutGoal, req.body.hobbyGoal, req.body.userId, req.body.weekStart]);
        else db.run("INSERT INTO weekly_goals (user_id, week_start, study_goal, workout_goal, hobby_goal) VALUES (?, ?, ?, ?, ?)", [req.body.userId, req.body.weekStart, req.body.studyGoal, req.body.workoutGoal, req.body.hobbyGoal]);
        res.json({ success: true });
    });
});

// --- SAVED QUIZZES ENDPOINTS ---
app.get('/api/quizzes', (req, res) => {
    db.all("SELECT * FROM saved_quizzes WHERE user_id = ?", [req.query.userId], (err, rows) => res.json(rows || []));
});
app.post('/api/quizzes', (req, res) => {
    db.run("INSERT INTO saved_quizzes (user_id, title, questions) VALUES (?, ?, ?)", [req.body.userId, req.body.title, JSON.stringify(req.body.questions)], function () { res.json({ success: true, id: this.lastID }); });
});
app.delete('/api/quizzes/:id', (req, res) => {
    db.run("DELETE FROM saved_quizzes WHERE id = ?", [req.params.id], () => res.json({ success: true }));
});

// --- AI QUIZ ---
app.post('/api/create-quiz', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Δεν δόθηκε αρχείο' });

        let textContent = req.file.mimetype === 'application/pdf' ? (await pdfParse(req.file.buffer)).text : req.file.buffer.toString('utf-8');
        if (textContent.length > 30000) textContent = textContent.substring(0, 30000);

        // Χρησιμοποιούμε το σωστό μοντέλο που υποστηρίζει το κλειδί σου
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `Διάβασε το παρακάτω κείμενο και φτιάξε 5 ερωτήσεις Σωστό/Λάθος. ΠΡΕΠΕΙ ΝΑ ΕΠΙΣΤΡΕΨΕΙΣ ΜΟΝΟ ΕΝΑ JSON ARRAY, χωρίς καθόλου άλλο κείμενο. Δομή JSON: [ { "question": "ερώτηση...", "answer": true, "explanation": "εξήγηση γιατί..." } ] Κείμενο: ${textContent}`;

        const result = await model.generateContent(prompt);
        let aiResponse = result.response.text().trim();

        if (aiResponse.startsWith("```json")) aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        else if (aiResponse.startsWith("```")) aiResponse = aiResponse.replace(/```/g, '').trim();

        res.json({ success: true, questions: JSON.parse(aiResponse) });
    } catch (error) {
        // Τώρα θα τυπώνει πάντα το σφάλμα στο τερματικό για να ξέρουμε τι γίνεται!
        console.error("ΣΦΑΛΜΑ AI QUIZ:", error);
        res.status(500).json({ error: 'Σφάλμα κατά την παραγωγή του quiz.' });
    }
});

app.listen(3001, () => console.log('Ο server τρέχει στο http://localhost:3001'));
