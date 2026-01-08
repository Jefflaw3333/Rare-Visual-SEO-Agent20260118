/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}", // Added root for files like App.tsx if they stay there
        "./components/**/*.{js,ts,jsx,tsx}" // Explicitly add components dir since it's in root
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
