
// This file manages your API Keys.
// Best Practice: Use Environment Variables (process.env or import.meta.env) so secrets aren't in code.
// Alternative: Paste your keys directly in the strings below (Do not commit this file if you do this).

// Helper to check multiple environment variable formats (Vite, CRA, etc)
const getEnv = (key: string, viteKey: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
       // @ts-ignore
       return import.meta.env[viteKey] || import.meta.env[key];
    }
  } catch (e) {}
  
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {}

  return undefined;
};

export const APP_CONFIG = {
  firebase: {
    apiKey: getEnv('REACT_APP_FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY') || "PASTE_YOUR_FIREBASE_API_KEY_HERE",
    authDomain: getEnv('REACT_APP_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN') || "PASTE_YOUR_FIREBASE_AUTH_DOMAIN_HERE",
    projectId: getEnv('REACT_APP_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID') || "PASTE_YOUR_FIREBASE_PROJECT_ID_HERE",
    storageBucket: getEnv('REACT_APP_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE_BUCKET') || "PASTE_YOUR_FIREBASE_STORAGE_BUCKET_HERE",
    messagingSenderId: getEnv('REACT_APP_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_MESSAGING_SENDER_ID') || "PASTE_YOUR_FIREBASE_MESSAGING_SENDER_ID_HERE",
    appId: getEnv('REACT_APP_FIREBASE_APP_ID', 'VITE_FIREBASE_APP_ID') || "PASTE_YOUR_FIREBASE_APP_ID_HERE"
  },
  // Google Gemini (AI Studio) API Key
  geminiApiKey: getEnv('API_KEY', 'VITE_GEMINI_API_KEY') || "PASTE_YOUR_GEMINI_API_KEY_HERE"
};
