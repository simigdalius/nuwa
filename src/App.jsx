import React, { useState, useEffect } from 'react';
import TinderCard from 'react-tinder-card';
import './index.css';

const getStartOfWeek = (date) => { const d = new Date(date); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.setDate(diff)); };
const formatDateStr = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const getWeekDays = (startDate) => Array.from({ length: 7 }).map((_, i) => { const d = new Date(startDate); d.setDate(d.getDate() + i); return d; });
const monthNames = ["ΙΑΝ", "ΦΕΒ", "ΜΑΡ", "ΑΠΡ", "ΜΑΙ", "ΙΟΥΝ", "ΙΟΥΛ", "ΑΥΓ", "ΣΕΠ", "ΟΚΤ", "ΝΟΕ", "ΔΕΚ"];
const dayNamesGreek = ['Κυρ', 'Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ'];

function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'reset'
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerMode, setTimerMode] = useState('setup');
  const [inputMinutes, setInputMinutes] = useState(10);
  const [activity, setActivity] = useState('Study');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalSessionTime, setTotalSessionTime] = useState(0);

  const [showStatsModal, setShowStatsModal] = useState(false);
  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));
  const [stats, setStats] = useState({});

  const [showTodoModal, setShowTodoModal] = useState(false);
  const [todoMode, setTodoMode] = useState('menu');
  const [todos, setTodos] = useState([]);
  const [todoForm, setTodoForm] = useState({ title: '', description: '', deadline: '' });

  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [goalsForm, setGoalsForm] = useState({ Study: '', Workout: '', Hobby: '' });
  const [savedGoals, setSavedGoals] = useState({ Study: 0, Workout: 0, Hobby: 0 });
  const [animateGoals, setAnimateGoals] = useState(false);
  const [claimedGoals, setClaimedGoals] = useState([]);

  // --- QUIZ STATES ---
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizState, setQuizState] = useState('menu'); // 'menu', 'upload', 'loading', 'playing', 'results', 'saved_list'
  const [quizFile, setQuizFile] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizResults, setQuizResults] = useState({ correct: 0, mistakes: [] });
  const [cardsLeft, setCardsLeft] = useState(0);

  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [currentQuizId, setCurrentQuizId] = useState(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const weekDays = getWeekDays(weekStart);
  const currentMonth = monthNames[weekStart.getMonth()];
  const currentYear = weekStart.getFullYear();
  const startStr = formatDateStr(weekDays[0]);
  const endStr = formatDateStr(weekDays[6]);

  const addXP = async (amount) => {
    if (!user) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/xp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, xpToAdd: amount }) });
      const data = await res.json();
      if (data.success) { setXp(data.xp); setLevel(data.level); }
    } catch (err) { }
  };

  const fetchStats = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stats?userId=${user.id}&startDate=${startStr}&endDate=${endStr}`);
      setStats(await response.json());
    } catch (error) { }
  };

  useEffect(() => { if (user && (showStatsModal || showGoalsModal)) fetchStats(); }, [weekStart, showStatsModal, showGoalsModal, user]);

  const fetchGoals = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/goals?userId=${user.id}&weekStart=${startStr}`);
      const data = await response.json();
      setSavedGoals({ Study: data.study_goal, Workout: data.workout_goal, Hobby: data.hobby_goal });
      setGoalsForm({ Study: data.study_goal || '', Workout: data.workout_goal || '', Hobby: data.hobby_goal || '' });
    } catch (err) { }
  };

  useEffect(() => {
    if (user && showGoalsModal) { setAnimateGoals(false); fetchGoals(); setTimeout(() => setAnimateGoals(true), 150); }
  }, [weekStart, showGoalsModal, user]);

  const handleSaveGoals = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/goals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, weekStart: startStr, studyGoal: parseFloat(goalsForm.Study) || 0, workoutGoal: parseFloat(goalsForm.Workout) || 0, hobbyGoal: parseFloat(goalsForm.Hobby) || 0 }) });
      alert('Οι στόχοι αποθηκεύτηκαν!'); fetchGoals();
    } catch (err) { }
  };

  const recordSession = async () => {
    if (!user) return;
    const elapsedSeconds = totalSessionTime - timeLeft;
    if (elapsedSeconds <= 0) return;
    const elapsedHours = elapsedSeconds / 3600;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/stats`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, date: formatDateStr(new Date()), activity, hours: elapsedHours }) });
      if (showStatsModal || showGoalsModal) fetchStats();
    } catch (error) { }
  };

  useEffect(() => {
    let interval = null;
    if (timerMode === 'running' && timeLeft > 0) interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    else if (timerMode === 'running' && timeLeft === 0) {
      const earnedXP = Math.floor(totalSessionTime / 60);
      if (earnedXP > 0) addXP(earnedXP);
      recordSession(); setTimerMode('setup'); alert(`Μπράβο! Ολοκλήρωσες το session. Κέρδισες ${earnedXP} XP!`);
    }
    return () => clearInterval(interval);
  }, [timerMode, timeLeft, activity, user]);

  const fetchTodos = async () => {
    if (!user) return;
    try { const response = await fetch(`${import.meta.env.VITE_API_URL}/api/todos?userId=${user.id}`); setTodos(await response.json()); } catch (err) { }
  };

  const handleAddTodo = async () => {
    if (!todoForm.title) return alert("Βάλε τίτλο!");
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/todos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, ...todoForm }) });
      setTodoForm({ title: '', description: '', deadline: '' }); await fetchTodos(); setTodoMode('list');
    } catch (err) { }
  };

  const handleCompleteTodo = async (id) => {
    try { await fetch(`${import.meta.env.VITE_API_URL}/api/todos/${id}`, { method: 'DELETE' }); addXP(50); fetchTodos(); } catch (err) { }
  };

  // --- QUIZ LOGIC ---
  const fetchQuizzes = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/quizzes?userId=${user.id}`);
      setSavedQuizzes(await response.json());
    } catch (err) { }
  };

  const handleQuizUpload = async () => {
    if (!quizFile) return alert('Διάλεξε ένα αρχείο πρώτα (.txt ή .pdf)');
    setQuizState('loading');
    const formData = new FormData();
    formData.append('document', quizFile);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/create-quiz`, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setQuizQuestions(data.questions.reverse());
      setCardsLeft(data.questions.length);
      setQuizResults({ correct: 0, mistakes: [] });
      setCurrentQuizId(null); // Νέο quiz, άρα δεν έχει ID ακόμα
      setQuizTitle('');
      setQuizState('playing');
    } catch (err) { alert('Σφάλμα: ' + err.message); setQuizState('upload'); }
  };

  const handleSaveQuiz = async () => {
    if (!quizTitle) return alert("Βάλε ένα όνομα για να το αποθηκεύσεις!");
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, title: quizTitle, questions: quizQuestions })
      });
      alert('Το Quiz αποθηκεύτηκε επιτυχώς!');
      setCurrentQuizId(true); // Απλά για να κρύψει το κουμπί αποθήκευσης
    } catch (err) { console.error(err); }
  };

  const playSavedQuiz = (quiz) => {
    const parsedQuestions = JSON.parse(quiz.questions);
    setQuizQuestions(parsedQuestions);
    setCardsLeft(parsedQuestions.length);
    setQuizResults({ correct: 0, mistakes: [] });
    setCurrentQuizId(quiz.id);
    setQuizState('playing');
  };

  const deleteSavedQuiz = async (id) => {
    try { await fetch(`${import.meta.env.VITE_API_URL}/api/quizzes/${id}`, { method: 'DELETE' }); fetchQuizzes(); } catch (err) { }
  };

  const handleSwipe = (direction, questionObj) => {
    const userAnswer = direction === 'right' ? true : false;
    const isCorrect = userAnswer === questionObj.answer;
    setQuizResults(prev => {
      const newResults = { ...prev };
      if (isCorrect) newResults.correct += 1;
      else newResults.mistakes.push({ question: questionObj.question, userAnswer, correctAnswer: questionObj.answer, explanation: questionObj.explanation });
      return newResults;
    });
    setCardsLeft(prev => {
      if (prev - 1 === 0) setTimeout(() => setQuizState('results'), 500);
      return prev - 1;
    });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    // Λογική για το Reset Password
    if (authMode === 'reset') {
      if (authForm.password.length < 8) return setAuthError('Ο νέος κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.');
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: authForm.email, newPassword: authForm.password }) });
        const data = await response.json();
        if (data.error) setAuthError(data.error);
        else { alert('Ο κωδικός άλλαξε επιτυχώς!'); setAuthMode('login'); setAuthForm({ username: '', email: '', password: '' }); }
      } catch (err) { setAuthError('Πρόβλημα σύνδεσης.'); }
      return;
    }

    // Λογική για το Register / Login
    if (authMode === 'register' && authForm.password.length < 8) return setAuthError('Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.');

    const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(authForm) });
      const data = await response.json();
      if (data.error) setAuthError(data.error);
      else { setUser(data.user); setXp(data.user.xp || 0); setLevel(data.user.level || 1); setAuthForm({ username: '', email: '', password: '' }); }
    } catch (err) { setAuthError('Πρόβλημα σύνδεσης.'); }
  };

  const handleLogout = () => { setUser(null); setStats({}); setTodos([]); setIsMenuOpen(false); };
  const startTimer = () => { if (inputMinutes > 0) { setTimeLeft(inputMinutes * 60); setTotalSessionTime(inputMinutes * 60); setTimerMode('running'); } };
  const stopTimer = () => { const earnedXP = Math.floor((totalSessionTime - timeLeft) / 60); if (earnedXP > 0) addXP(earnedXP); recordSession(); setTimerMode('setup'); setTimeLeft(0); };
  const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const currentWeeklyTotals = { Study: 0, Workout: 0, Hobby: 0 };
  Object.values(stats).forEach(dayData => { currentWeeklyTotals.Study += dayData.Study || 0; currentWeeklyTotals.Workout += dayData.Workout || 0; currentWeeklyTotals.Hobby += dayData.Hobby || 0; });
  const getProgressPercentage = (current, target) => { if (target === 0) return 0; const perc = (current / target) * 100; return perc > 100 ? 100 : perc; };

  if (!user) {
    return (
      <div className="app-container auth-container">
        <div className="retro-modal auth-modal">
          <div className="modal-header">
            <span>{authMode === 'login' ? 'LOGIN' : authMode === 'register' ? 'REGISTER' : 'RESET PASSWORD'}</span>
          </div>
          <form className="modal-body" onSubmit={handleAuthSubmit}>
            {authError && <div className="auth-error">{authError}</div>}

            {authMode !== 'reset' && (
              <div className="setup-group">
                <label>USERNAME:</label>
                <input type="text" className="retro-input" value={authForm.username} onChange={e => setAuthForm({ ...authForm, username: e.target.value })} required={authMode !== 'reset'} />
              </div>
            )}

            {authMode !== 'login' && (
              <div className="setup-group">
                <label>EMAIL:</label>
                <input type="email" className="retro-input" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} required />
              </div>
            )}

            <div className="setup-group">
              <label>{authMode === 'reset' ? 'NEW PASSWORD:' : 'PASSWORD:'}</label>
              <input type="password" minLength="8" className="retro-input" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} required />
              {(authMode === 'register' || authMode === 'reset') && <span style={{ fontSize: '8px', color: 'var(--pastel-blue)' }}>Μίνιμουμ 8 χαρακτήρες</span>}
            </div>

            <button type="submit" className="action-btn start-btn" style={{ marginTop: '10px' }}>
              {authMode === 'login' ? 'ENTER' : authMode === 'register' ? 'CREATE ACCOUNT' : 'UPDATE PASSWORD'}
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '15px', alignItems: 'center' }}>
              {authMode === 'login' && (
                <>
                  <p className="auth-toggle" onClick={() => { setAuthMode('register'); setAuthError(''); setAuthForm({ username: '', email: '', password: '' }); }}>Δεν έχεις λογαριασμό; Register</p>
                  <p className="auth-toggle" style={{ color: 'var(--pastel-pink)' }} onClick={() => { setAuthMode('reset'); setAuthError(''); setAuthForm({ username: '', email: '', password: '' }); }}>Ξέχασες τον κωδικό σου;</p>
                </>
              )}
              {authMode !== 'login' && (
                <p className="auth-toggle" onClick={() => { setAuthMode('login'); setAuthError(''); setAuthForm({ username: '', email: '', password: '' }); }}>Πίσω στο Login</p>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  const xpPercentage = (xp % 400) / 400 * 100;

  return (
    <div className="app-container">
      <header className="header">
        <div className="level-container">
          <div className="level-icon">{level}</div>
          <div className="level-bar-container"><div className="level-bar-fill" style={{ width: `${xpPercentage}%` }}></div></div>
          <span className="level-text">LVL {level}</span>
        </div>
        <button className="menu-btn" onClick={toggleMenu}>☰</button>
      </header>

      <main className="main-content">
        <div className="character-container">
          <svg width="150" height="200" viewBox="0 0 100 150" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" style={{ shapeRendering: 'crispEdges' }}>
            <ellipse cx="50" cy="70" rx="40" ry="35" />
            <rect x="25" y="20" width="10" height="20" rx="2" />
            <rect x="65" y="20" width="10" height="20" rx="2" />
            <circle cx="40" cy="65" r="5" />
            <circle cx="60" cy="65" r="5" />
            <path d="M 45 80 Q 50 90 55 80" fill="none" strokeWidth="3" />
            <path d="M 35 100 L 40 140 L 50 120 L 60 140 L 65 100" fill="none" strokeWidth="3" />
          </svg>
        </div>

        {isMenuOpen && (
          <div className="menu-stack">
            <button className="menu-item" onClick={() => setShowTimerModal(true)}>timer</button>
            <button className="menu-item" onClick={() => setShowStatsModal(true)}>Stats</button>
            <button className="menu-item" onClick={() => { setShowTodoModal(true); setTodoMode('menu'); }}>to do</button>
            <button className="menu-item" onClick={() => setShowGoalsModal(true)}>Week goals</button>
            <button className="menu-item" onClick={() => { setShowQuizModal(true); setQuizState('menu'); }} style={{ borderColor: '#ffcc00', color: '#ffcc00' }}>AI Quiz</button>

            <button className="menu-item" onClick={handleLogout} style={{ borderColor: '#ff6bb3', color: '#ff6bb3' }}>Logout</button>
          </div>
        )}
      </main>

      {/* --- AI QUIZ MODAL --- */}
      {showQuizModal && (
        <div className="modal-overlay">
          <div className="retro-modal quiz-modal">
            <div className="modal-header"><span>AI QUIZ</span><button className="close-btn" onClick={() => setShowQuizModal(false)}>X</button></div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>

              {quizState === 'menu' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <button className="action-btn" onClick={() => setQuizState('upload')} style={{ borderColor: 'var(--pastel-blue)', color: 'var(--pastel-blue)' }}>CREATE NEW</button>
                  <button className="action-btn" onClick={() => { setQuizState('saved_list'); fetchQuizzes(); }} style={{ borderColor: 'var(--pastel-pink)', color: 'var(--pastel-pink)' }}>SAVED QUIZZES</button>
                </div>
              )}

              {quizState === 'saved_list' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {savedQuizzes.length === 0 ? (
                    <p style={{ textAlign: 'center', fontSize: '10px', color: 'var(--pastel-blue)' }}>Δεν έχεις αποθηκευμένα quiz!</p>
                  ) : (
                    <div className="todo-list">
                      {savedQuizzes.map(quiz => (
                        <div key={quiz.id} className="todo-item">
                          <div className="todo-content"><span className="todo-title">{quiz.title}</span><span className="todo-desc">{JSON.parse(quiz.questions).length} Ερωτήσεις</span></div>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button className="nav-btn" style={{ borderColor: '#ffcc00', color: '#ffcc00' }} onClick={() => playSavedQuiz(quiz)}>PLAY</button>
                            <button className="nav-btn" style={{ borderColor: 'var(--action-close)', color: 'var(--action-close)' }} onClick={() => deleteSavedQuiz(quiz.id)}>X</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="action-btn" onClick={() => setQuizState('menu')} style={{ marginTop: '10px' }}>BACK</button>
                </div>
              )}

              {quizState === 'upload' && (
                <div className="setup-group" style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '10px', marginBottom: '20px' }}>Ανέβασε τις σημειώσεις σου (.txt, .pdf) και το AI θα φτιάξει ένα τεστ για εσένα!</p>
                  <input type="file" accept=".txt,.pdf" onChange={(e) => setQuizFile(e.target.files[0])} className="retro-input" style={{ marginBottom: '20px' }} />
                  <button className="action-btn start-btn" onClick={handleQuizUpload}>CREATE QUIZ</button>
                  <button className="action-btn" onClick={() => setQuizState('menu')} style={{ marginTop: '10px' }}>BACK</button>
                </div>
              )}

              {quizState === 'loading' && <div style={{ textAlign: 'center', padding: '40px' }}><p className="loading-text" style={{ color: 'var(--pastel-blue)' }}>Το AI διαβάζει το αρχείο σου...</p></div>}

              {quizState === 'playing' && (
                <div className="tinder-container">
                  <p style={{ fontSize: '8px', textAlign: 'center', marginBottom: '10px' }}>Swipe Δεξιά για ΣΩΣΤΟ, Αριστερά για ΛΑΘΟΣ</p>
                  <div className="card-stack">
                    {quizQuestions.map((q, index) => (
                      <TinderCard key={index} className="swipe-card" onSwipe={(dir) => handleSwipe(dir, q)} preventSwipe={['up', 'down']}>
                        <div className="quiz-card-content"><h3>{q.question}</h3></div>
                      </TinderCard>
                    ))}
                  </div>
                </div>
              )}

              {quizState === 'results' && (
                <div className="results-container">
                  <h2 style={{ color: '#00ff00', textAlign: 'center' }}>Αποτέλεσμα: {quizResults.correct} / {quizQuestions.length}</h2>
                  {quizResults.mistakes.length > 0 ? (
                    <div style={{ marginTop: '20px' }}>
                      <h3 style={{ color: 'var(--action-close)', fontSize: '12px' }}>Λάθη & Επεξηγήσεις:</h3>
                      {quizResults.mistakes.map((m, i) => (
                        <div key={i} className="mistake-item">
                          <p style={{ color: 'var(--pastel-pink)', fontSize: '10px' }}>{m.question}</p>
                          <p style={{ fontSize: '8px' }}>Η απάντησή σου: {m.userAnswer ? 'Σωστό' : 'Λάθος'}</p>
                          <p style={{ fontSize: '8px', color: 'var(--pastel-blue)' }}>{m.explanation}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p style={{ textAlign: 'center', color: '#00ff00', marginTop: '20px' }}>Απόλυτο Άριστα!</p>}

                  {/* Μόνο αν το Quiz δεν είναι ήδη αποθηκευμένο, εμφανίζεται η επιλογή αποθήκευσης */}
                  {!currentQuizId && (
                    <div className="setup-group" style={{ marginTop: '20px' }}>
                      <input type="text" className="retro-input" placeholder="Όνομα Quiz (π.χ. Ιστορία Κεφ 1)" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} />
                      <button className="action-btn start-btn" onClick={handleSaveQuiz}>SAVE QUIZ</button>
                    </div>
                  )}

                  <button className="action-btn" onClick={() => setQuizState('menu')} style={{ marginTop: '20px', width: '100%' }}>BACK TO MENU</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- ΥΠΟΛΟΙΠΑ MODALS (TIMER, TODO, STATS, GOALS ΠΑΡΑΜΕΝΟΥΝ ΙΔΙΑ) --- */}
      {showTodoModal && (
        <div className="modal-overlay">
          <div className="retro-modal">
            <div className="modal-header"><span>TO DO LIST</span><button className="close-btn" onClick={() => { setShowTodoModal(false); setTodoMode('menu'); }}>X</button></div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {todoMode === 'menu' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <button className="action-btn" onClick={() => setTodoMode('add')} style={{ borderColor: 'var(--pastel-blue)', color: 'var(--pastel-blue)' }}>ADD NEW</button>
                  <button className="action-btn" onClick={() => { setTodoMode('list'); fetchTodos(); }} style={{ borderColor: 'var(--pastel-pink)', color: 'var(--pastel-pink)' }}>SEE LIST</button>
                </div>
              )}
              {todoMode === 'add' && (
                <div className="setup-group">
                  <input type="text" placeholder="Τίτλος..." className="retro-input" value={todoForm.title} onChange={e => setTodoForm({ ...todoForm, title: e.target.value })} />
                  <input type="text" placeholder="Υποσημείωση..." className="retro-input" value={todoForm.description} onChange={e => setTodoForm({ ...todoForm, description: e.target.value })} />
                  <label style={{ fontSize: '8px', color: 'var(--pastel-pink)' }}>Deadline:</label>
                  <input type="date" className="retro-input" value={todoForm.deadline} onChange={e => setTodoForm({ ...todoForm, deadline: e.target.value })} />
                  <button className="action-btn start-btn" onClick={handleAddTodo}>SAVE TASK</button>
                  <button className="action-btn" onClick={() => setTodoMode('menu')} style={{ marginTop: '10px' }}>BACK</button>
                </div>
              )}
              {todoMode === 'list' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {todos.length === 0 ? <p style={{ textAlign: 'center', fontSize: '10px', color: 'var(--pastel-blue)' }}>Δεν έχεις εργασίες!</p> : (
                    <div className="todo-list">{todos.map(todo => (<div key={todo.id} className="todo-item"><div className="todo-content"><span className="todo-title">{todo.title}</span>{todo.description && <span className="todo-desc">{todo.description}</span>}{todo.deadline && <span className="todo-date">ΕΩΣ: {todo.deadline}</span>}</div><button className="nav-btn" style={{ borderColor: '#00ff00', color: '#00ff00' }} onClick={() => handleCompleteTodo(todo.id)}>V</button></div>))}</div>
                  )}
                  <button className="action-btn" onClick={() => setTodoMode('menu')} style={{ marginTop: '10px' }}>BACK</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showGoalsModal && (
        <div className="modal-overlay">
          <div className="retro-modal">
            <div className="modal-header">
              <div className="month-nav"><button className="nav-btn" onClick={() => setWeekStart(new Date(weekStart.setDate(weekStart.getDate() - 7)))}>&lt;</button><span style={{ fontSize: '8px' }}>{weekDays[0].getDate()}-{weekDays[6].getDate()} {currentMonth}</span><button className="nav-btn" onClick={() => setWeekStart(new Date(weekStart.setDate(weekStart.getDate() + 7)))}>&gt;</button></div>
              <button className="close-btn" onClick={() => setShowGoalsModal(false)}>X</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="setup-group">
                <label style={{ color: 'var(--pastel-blue)' }}>STUDY HOURS:</label><input type="number" min="0" className="retro-input" value={goalsForm.Study} onChange={e => setGoalsForm({ ...goalsForm, Study: e.target.value })} />
                <label style={{ color: 'var(--pastel-pink)' }}>WORKOUT HOURS:</label><input type="number" min="0" className="retro-input" value={goalsForm.Workout} onChange={e => setGoalsForm({ ...goalsForm, Workout: e.target.value })} />
                <label style={{ color: 'var(--pastel-purple)' }}>HOBBY HOURS:</label><input type="number" min="0" className="retro-input" value={goalsForm.Hobby} onChange={e => setGoalsForm({ ...goalsForm, Hobby: e.target.value })} />
                <button className="action-btn start-btn" onClick={handleSaveGoals} style={{ marginTop: '10px' }}>SAVE GOALS</button>
              </div>
              <hr style={{ borderColor: 'var(--border-color)', margin: '20px 0', width: '100%' }} />
              <div className="goals-progress-list">
                {['Study', 'Workout', 'Hobby'].map(act => {
                  const target = savedGoals[act] || 0; const current = currentWeeklyTotals[act] || 0; const perc = getProgressPercentage(current, target); const isCompleted = target > 0 && current >= target;
                  return (
                    <div key={act} className="goal-progress-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginBottom: '5px' }}><span>{act}</span><span>{current.toFixed(1)} / {target}h</span></div>
                      <div className="level-bar-container" style={{ width: '100%', height: '15px' }}><div className={`goal-progress-fill bg-${act.toLowerCase()}`} style={{ width: `${animateGoals ? perc : 0}%` }}></div></div>
                      {isCompleted && (
                        <div style={{ textAlign: 'center', marginTop: '5px' }}><p style={{ color: '#00ff00', fontSize: '8px', animation: 'retroSlideIn 0.5s' }}>ΜΠΡΑΒΟ! Ξεπέρασες τον στόχο σου!</p>
                          {!claimedGoals.includes(act) && <button className="nav-btn" style={{ borderColor: '#ffcc00', color: '#ffcc00', fontSize: '7px', marginTop: '5px' }} onClick={() => { addXP(50); setClaimedGoals(prev => [...prev, act]); }}>CLAIM 50 XP</button>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {showTimerModal && (
        <div className="modal-overlay">
          <div className="retro-modal">
            <div className="modal-header"><span>TIMER</span><button className="close-btn" onClick={() => setShowTimerModal(false)}>X</button></div>
            <div className="modal-body">
              {timerMode === 'setup' ? (
                <>
                  <div className="setup-group"><label>MINUTES:</label><input type="number" value={inputMinutes} onChange={(e) => setInputMinutes(e.target.value)} min="1" className="retro-input" /></div>
                  <div className="setup-group"><label>ACTIVITY:</label><div className="activity-buttons">{['Study', 'Workout', 'Hobby'].map(act => (<button key={act} className={`act-btn ${activity === act ? 'active' : ''}`} onClick={() => setActivity(act)}>{act}</button>))}</div></div>
                  <button className="action-btn start-btn" onClick={startTimer}>START</button>
                </>
              ) : (
                <div className="active-timer">
                  <div className="current-activity">{activity}</div><div className="time-display">{formatTime(timeLeft)}</div>
                  <div className="timer-controls">
                    <button className="action-btn" onClick={() => setTimerMode(prev => prev === 'running' ? 'paused' : 'running')}>{timerMode === 'paused' ? 'RESUME' : 'PAUSE'}</button>
                    <button className="action-btn stop-btn" onClick={stopTimer}>STOP</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showStatsModal && (
        <div className="modal-overlay">
          <div className="retro-modal stats-modal">
            <div className="modal-header">
              <div className="month-nav"><button className="nav-btn" onClick={() => setWeekStart(new Date(weekStart.setDate(weekStart.getDate() - 7)))}>&lt;</button><span style={{ fontSize: '10px' }}>{currentMonth} {currentYear}</span><button className="nav-btn" onClick={() => setWeekStart(new Date(weekStart.setDate(weekStart.getDate() + 7)))}>&gt;</button></div>
              <button className="close-btn" onClick={() => setShowStatsModal(false)}>X</button>
            </div>
            <div className="modal-body">
              <div className="chart-legend"><span className="legend-item"><div className="color-box bg-study"></div>Study</span><span className="legend-item"><div className="color-box bg-workout"></div>Workout</span><span className="legend-item"><div className="color-box bg-hobby"></div>Hobby</span></div>
              <div className="chart-container">
                <div className="y-axis"><span>8h</span><span>6h</span><span>4h</span><span>2h</span><span>0h</span></div>
                <div className="bars-area">
                  {weekDays.map((dateObj) => {
                    const dateStr = formatDateStr(dateObj); const dayData = stats[dateStr] || { Study: 0, Workout: 0, Hobby: 0 }; const MAX_HOURS = 8;
                    const studyHeight = (dayData.Study / MAX_HOURS) * 100; const workoutHeight = (dayData.Workout / MAX_HOURS) * 100; const hobbyHeight = (dayData.Hobby / MAX_HOURS) * 100;
                    return (
                      <div className="bar-column" key={dateStr}>
                        <div className="bar-wrapper tooltip-container">
                          <div className="bar segment-hobby" style={{ height: `${hobbyHeight}%` }}></div><div className="bar segment-workout" style={{ height: `${workoutHeight}%` }}></div><div className="bar segment-study" style={{ height: `${studyHeight}%` }}></div>
                          <div className="retro-tooltip"><div className="t-study">S: {dayData.Study > 0 ? dayData.Study.toFixed(1) + 'h' : '0'}</div><div className="t-workout">W: {dayData.Workout > 0 ? dayData.Workout.toFixed(1) + 'h' : '0'}</div><div className="t-hobby">H: {dayData.Hobby > 0 ? dayData.Hobby.toFixed(1) + 'h' : '0'}</div></div>
                        </div>
                        <span className="day-label" style={{ textAlign: 'center', lineHeight: '1.2' }}>{dayNamesGreek[dateObj.getDay()]}<br />{dateObj.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;