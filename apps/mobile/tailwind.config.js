/**
 * Mirrors apps/web/src/app/globals.css exactly — same token names, same values (converted
 * from oklch to sRGB since React Native can't resolve oklch() at style-application time).
 * Don't add colors here that don't exist on web; add them to globals.css first, then port.
 */
const withOpacity = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind's web runtime manages a `dark` class from the OS appearance itself and throws
  // if configured for 'media' — see color-scheme.js in react-native-css-interop.
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: withOpacity("--background"),
        foreground: withOpacity("--foreground"),
        card: withOpacity("--card"),
        "card-foreground": withOpacity("--card-foreground"),
        primary: withOpacity("--primary"),
        "primary-foreground": withOpacity("--primary-foreground"),
        secondary: withOpacity("--secondary"),
        "secondary-foreground": withOpacity("--secondary-foreground"),
        muted: withOpacity("--muted"),
        "muted-foreground": withOpacity("--muted-foreground"),
        accent: withOpacity("--accent"),
        "accent-foreground": withOpacity("--accent-foreground"),
        accent2: withOpacity("--accent2"),
        "accent2-foreground": withOpacity("--accent2-foreground"),
        "accent2-subtle": withOpacity("--accent2-subtle"),
        destructive: withOpacity("--destructive"),
        "destructive-subtle": withOpacity("--destructive-subtle"),
        success: withOpacity("--success"),
        "success-foreground": withOpacity("--success-foreground"),
        "success-subtle": withOpacity("--success-subtle"),
        warning: withOpacity("--warning"),
        "warning-foreground": withOpacity("--warning-foreground"),
        "warning-subtle": withOpacity("--warning-subtle"),
        info: withOpacity("--info"),
        "info-foreground": withOpacity("--info-foreground"),
        "info-subtle": withOpacity("--info-subtle"),
        border: withOpacity("--border"),
        "chart-1": withOpacity("--chart1"),
        "chart-2": withOpacity("--chart2"),
        "chart-3": withOpacity("--chart3"),
        "chart-4": withOpacity("--chart4"),
        "chart-5": withOpacity("--chart5"),
      },
      // Fixed 16px on 2xl per design spec §5A — cards/buttons/inputs all use rounded-2xl.
      borderRadius: {
        sm: "8px",
        md: "10px",
        lg: "12px",
        xl: "14px",
        "2xl": "16px",
        "3xl": "20px",
      },
    },
  },
  plugins: [],
};
