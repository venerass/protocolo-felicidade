# Protocolo Felicidade 🌿

**Protocolo Felicidade** is a science-based well-being, habit tracking, and social accountability application. It focuses on a holistic approach to happiness, tracking body, mind, connection, and discipline.

## 🚀 Key Features

*   **Personalized Onboarding**: Generates a custom habit protocol based on sleep quality, stress levels, and social battery.
*   **Weighted Daily Scoring**: Not all habits are equal. The app calculates a daily score based on habit priority (Low/Medium/High) and includes bonuses for completing weekly tasks.
*   **AI Mentoring**: Integrated with **Google Gemini 2.5 Flash** to analyze user logs and provide personalized, empathetic coaching advice.
*   **Social Leaderboard**: A competitive, gamified community view using Firebase to track friends' scores and streaks in real-time.
*   **Advanced Analytics**: Radar charts for life balance, consistency heatmaps, and trend analysis.

---

## 🛠 Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS (Glassmorphism aesthetic)
*   **Icons**: Lucide React
*   **Charts**: Recharts
*   **AI**: Google GenAI SDK (`@google/genai`)
*   **Backend**: Firebase Authentication & Cloud Firestore
*   **Build Tool**: Vite / React Scripts compatible

---

## ⚙️ Configuration & Setup

This project relies on **Firebase** for data persistence and **Google AI Studio** for the coaching feature.

### 1. Environment Variables
To keep the application secure, create a `.env` (or `.env.local` if using Vite) file in the root directory.

**Do not commit this file.**

```env
# Firebase Configuration (From Firebase Console -> Project Settings)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456...
VITE_FIREBASE_APP_ID=1:123456...

# Google Gemini API (From aistudio.google.com)
VITE_GEMINI_API_KEY=AIzaSy...
```

> **Note**: The application handles configuration in `src/config.ts`. If you cannot use environment variables (e.g., a simple drag-and-drop deploy), you can verify `src/config.ts` manually, but be careful not to commit secrets.

### 2. Firebase Setup
1.  Go to [Firebase Console](https://console.firebase.google.com/).
2.  Create a new project.
3.  **Authentication**: Enable **Email/Password** provider.
4.  **Firestore Database**: Create a database (Start in **Test Mode** for development, or set appropriate rules for production).
5.  **Web App**: Register a web app to generate the configuration keys needed above.

### 3. Google AI Setup
1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Create an API Key.
3.  Ensure the key has access to `gemini-2.5-flash`.

---

## 📂 Project Structure

```
src/
├── components/
│   ├── Onboarding.tsx    # Multi-step survey & protocol generation
│   ├── Dashboard.tsx     # Main daily view, habit toggling
│   ├── HabitManager.tsx  # Inline editing, library, custom habits
│   ├── Social.tsx        # Leaderboard & Friend search logic
│   ├── Analytics.tsx     # Charts & Graphs
│   ├── AIAssistant.tsx   # Gemini integration UI
│   └── Auth.tsx          # Login/Register forms
├── services/
│   ├── firebase.ts       # Auth & Firestore logic (Singleton)
│   ├── geminiService.ts  # AI prompt engineering & API call
│   └── storageService.ts # Backup/Export logic (JSON)
├── constants.ts          # The "Habit Library" and default data
├── types.ts              # TypeScript interfaces (Habit, UserProfile, Logs)
├── config.ts             # Env var loader
└── App.tsx               # Routing & Initialization
```

---

## 🧠 Core Logic Explained

### The Scoring Algorithm (`Dashboard.tsx`)
The "Daily Score" is **not** a simple percentage of checked boxes.
1.  **Denominator**: Sum of weights of all *Daily* habits.
2.  **Numerator**: Sum of weights of completed *Daily* habits + Sum of weights of completed *Weekly* habits.
    *   *Why?* This allows a user to "make up" for a missed daily habit by performing a high-value weekly workout, sometimes resulting in a >100% score (Super Day).

### Social Logic (`Social.tsx` & `firebase.ts`)
*   Friends are connected via **Email Search**.
*   When User A adds User B, User B's ID is added to User A's `friends` array in Firestore.
*   The leaderboard fetches the public `stats` object (score, streak, lastActive) from every friend ID.
*   **Privacy**: Users can only see the *stats* of people they add; they cannot see specific logs or private journal entries.

### AI Context (`geminiService.ts`)
The prompt sent to Gemini includes:
1.  The user's name.
2.  Active habits list.
3.  The simplified log history of the last 7 days.
4.  A strict instruction to be empathetic, concise, and speak Portuguese.

---

## 🚨 Troubleshooting

**"Firebase Auth not initialized"**
*   Check `src/config.ts`.
*   Ensure your API Key in `.env` does not contain extra spaces or quotes.
*   Ensure you enabled "Email/Password" in the Firebase Console.

**"API Key not valid"**
*   Verify that the API key corresponds to the correct Firebase Project ID.

**AI Coach says "Erro"**
*   Check if the `VITE_GEMINI_API_KEY` is valid.
*   Ensure you have quota available on Google AI Studio (Free tier has limits).

---

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add AmazingFeature'`).
4.  Push to the branch.
5.  Open a Pull Request.