/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./src/**/*.purs",
    "./output/**/*.js",
    "./src/Config/Themes.purs", // Explicitly include themes file
    "./safelist.html", // Safelist file for dynamic theme classes
  ],
  safelist: [
    // Gradient utilities
    'bg-gradient-to-br',
    'bg-gradient-to-r',
    'backdrop-blur-xl',
    'text-transparent',
    'bg-clip-text',
    // Modern theme
    'from-gray-950', 'via-gray-900', 'to-black',
    'from-blue-900/50', 'to-gray-900/60',
    'border-blue-400/50', 'border-blue-600/20',
    'from-blue-400', 'to-purple-600',
    'text-white', 'text-gray-300', 'text-blue-400',
    'text-green-400', 'text-red-400', 'text-gray-400',
    'hover:bg-blue-800/20',
    'shadow-blue-400/10',
    // Scrabble theme
    'from-amber-100', 'via-orange-100', 'to-yellow-100',
    'from-amber-50/90', 'to-orange-50/80',
    'border-amber-900/80', 'border-amber-800/40',
    'from-amber-900', 'via-amber-700', 'to-yellow-700',
    'text-amber-900', 'text-amber-700', 'text-amber-800',
    'text-green-700', 'text-red-700',
    'hover:bg-amber-900/10',
    'shadow-amber-900/20',
    // July4 theme
    'from-slate-900', 'via-blue-950', 'to-slate-800',
    'from-white/95', 'to-blue-50/90',
    'border-blue-800/80', 'border-slate-600/70',
    'from-blue-600', 'via-red-600', 'to-blue-600',
    'text-slate-900', 'text-slate-600', 'text-blue-800',
    'text-blue-700', 'text-slate-800',
    'hover:bg-blue-100/30',
    'shadow-blue-900/20',
    // Original theme
    'bg-white',
    'border-black', 'border-gray-300',
    'text-black', 'text-gray-600',
    'text-red-600', 'text-blue-600',
    'hover:bg-gray-50',
    'shadow-gray-200',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
