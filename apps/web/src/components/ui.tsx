import React from "react";

// Button Components
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "success" | "danger";
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = "primary",
    className = "",
    children,
    ...props
}) => {
    const baseClasses =
        "px-6 py-3 border-none rounded-xl cursor-pointer font-semibold transition-all duration-200 text-sm hover:transform hover:-translate-y-0.5";

    const variantClasses = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg",
        secondary: "bg-gray-200 hover:bg-gray-300 text-gray-700 border-2 border-gray-300",
        success: "bg-green-600 hover:bg-green-700 text-white hover:shadow-lg",
        danger: "bg-red-600 hover:bg-red-700 text-white hover:shadow-lg",
    };

    return (
        <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

// Card Components
interface CardProps {
    children: React.ReactNode;
    className?: string;
    transition?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = "", transition = false }) => {
    const baseClasses =
        "p-6 rounded-xl backdrop-blur-md border border-white/10 shadow-lg bg-white/5";
    const transitionClasses = transition
        ? "hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-1"
        : "";

    return <div className={`${baseClasses} ${transitionClasses} ${className}`}>{children}</div>;
};

// Input Components
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = "", ...props }) => {
    return (
        <div className="space-y-2">
            {label && <label className="block text-sm font-medium text-white/80">{label}</label>}
            <input
                className={`w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none transition-all duration-200 ${className}`}
                {...props}
            />
        </div>
    );
};

// Page Layout Components
export const PageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {children}
        </div>
    );
};

export const ContentWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <div className="container mx-auto px-4 py-8">{children}</div>;
};
