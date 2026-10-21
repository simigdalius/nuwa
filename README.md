# Nuwa - Gamified Productivity & Study App 🚀

Το **Nuwa** είναι μια ολοκληρωμένη διαδικτυακή εφαρμογή παραγωγικότητας και μελέτης που μετατρέπει την καθημερινή προσπάθεια σε παιχνίδι (gamification). Οι χρήστες μπορούν να χρονομετρούν τις δραστηριότητές τους, να θέτουν στόχους, να διαχειρίζονται τις εργασίες τους και να δημιουργούν αυτόματα flashcard quizzes μέσω Τεχνητής Νοημοσύνης (AI) από τις σημειώσεις τους.

## Βασικά Χαρακτηριστικά ✨
*   **Σύστημα XP & Leveling:** Κέρδισε πόντους εμπειρίας (XP) και ανέβα επίπεδα (Levels) ολοκληρώνοντας sessions και εργασίες.
*   **Activity Timer & Στατιστικά:** Χρονόμετρο για Study, Workout και Hobby, με αυτόματη καταγραφή και οπτικοποίηση δεδομένων ανά εβδομάδα.
*   **To-Do List & Weekly Goals:** Θέσε εβδομαδιαίους στόχους σε ώρες και διαχειρίσου τις εργασίες σου με προθεσμίες.
*   **AI Quiz Generator:** Ανέβασε τις σημειώσεις σου (PDF ή TXT) και η εφαρμογή (μέσω Google Gemini API) δημιουργεί αυτόματα ένα διαδραστικό "Tinder-style" swipe quiz ερωτήσεων Σωστού/Λάθους.
*   **Αποθήκευση Quizzes:** Αποθήκευσε τα αγαπημένα σου AI Quizzes για μελλοντική επανάληψη.

## Τεχνολογίες που χρησιμοποιήθηκαν 🛠️
*   **Frontend:** React, Vite, CSS, React-Tinder-Card
*   **Backend:** Node.js, Express.js
*   **Βάση Δεδομένων:** SQLite
*   **AI Integration:** Google Gemini API (`gemini-flash-latest`)
*   **Άλλα Εργαλεία:** Multer, pdf-parse, Dotenv

## Οδηγίες Εγκατάστασης (Τοπικά) 💻

1. **Κλωνοποίηση του αποθετηρίου:**
   ```bash
   git clone [https://github.com/simigdalius/nuwa.git](https://github.com/simigdalius/nuwa.git)
   cd nuwa/vite-project
