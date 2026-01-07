export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
console.log("-----------------------------------------");
console.log("🚀 FRONTEND CONFIG LOADED");
console.log("Environment:", import.meta.env.MODE);
console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("Effective API_BASE_URL:", API_BASE_URL);
console.log("-----------------------------------------");
