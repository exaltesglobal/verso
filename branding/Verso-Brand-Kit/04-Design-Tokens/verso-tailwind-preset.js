// Verso Tailwind preset (tailwind.config.js -> presets: [require('./verso-tailwind-preset.js')])
module.exports = { theme: { extend: {
  colors: {
  "ember": {
    "ember": "#FF4A2B",
    "ember-hover": "#FF5F43",
    "ember-pressed": "#E23A1D",
    "glow": "#FF9466",
    "ember-tint": "#FF4A2B1F"
  },
  "ink": {
    "950": "#0B0B0F",
    "900": "#111116",
    "850": "#16161C",
    "800": "#1D1D24",
    "700": "#2A2A33",
    "600": "#3A3A45",
    "500": "#5C5B66",
    "400": "#8E8C96",
    "300": "#B9B7BF",
    "200": "#DAD8DD",
    "100": "#F5F4F0",
    "0": "#FFFFFF"
  },
  "track": {
    "video": "#5B8CFF",
    "audio": "#2FD4A3",
    "text": "#FFB547",
    "effects": "#C084FC",
    "captions": "#F472B6"
  },
  "success": "#34D399",
  "warning": "#FBBF24",
  "danger": "#F87171",
  "info": "#60A5FA"
},
  fontFamily: { sans: ["Manrope","Segoe UI Variable","Segoe UI","-apple-system","sans-serif"] },
  borderRadius: {"xs": "4px", "sm": "6px", "md": "10px", "lg": "14px", "xl": "20px", "pill": "999px"},
  boxShadow: {"sm": "0 1px 2px rgba(0,0,0,.4)", "md": "0 8px 24px rgba(0,0,0,.45)", "lg": "0 24px 60px rgba(0,0,0,.55)", "glow": "0 0 0 1px rgba(255,74,43,.4), 0 8px 28px rgba(255,74,43,.28)"},
} } };
