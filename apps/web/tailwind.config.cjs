/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: "#f0f4ff",
                    100: "#e0e7ff",
                    500: "#667eea",
                    600: "#5a67d8",
                    700: "#4c51bf",
                },
                secondary: {
                    500: "#764ba2",
                    600: "#6b46c1",
                },
                success: "#10b981",
                danger: "#ef4444",
                warning: "#f59e0b",
            },
            fontFamily: {
                sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
            },
            backgroundImage: {
                "gradient-primary": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "gradient-success": "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                "gradient-danger": "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            },
        },
    },
    plugins: [],
};
