import styled, { css } from "styled-components";

// Theme colors
export const theme = {
    colors: {
        primary: {
            500: "#667eea",
            600: "#5a67d8",
        },
        secondary: {
            500: "#764ba2",
        },
        success: "#10b981",
        danger: "#ef4444",
        gray: {
            100: "#f7fafc",
            200: "#e5e7eb",
            300: "#d1d5db",
            600: "#6b7280",
            700: "#374151",
        },
    },
    gradients: {
        primary: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        success: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        danger: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    },
};

// Base button styles
const buttonBase = css`
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
    font-size: 0.95rem;

    &:hover {
        transform: translateY(-2px);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
`;

// Button variants
export const Button = styled.button<{ variant?: "primary" | "secondary" | "success" | "danger" }>`
    ${buttonBase}

    ${(props) => {
        switch (props.variant) {
            case "secondary":
                return css`
                    background: rgba(255, 255, 255, 0.2);
                    color: ${theme.colors.gray[700]};
                    border: 2px solid ${theme.colors.gray[200]};

                    &:hover {
                        background: rgba(255, 255, 255, 0.3);
                    }
                `;
            case "success":
                return css`
                    background: ${theme.gradients.success};
                    color: white;

                    &:hover {
                        box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
                    }
                `;
            case "danger":
                return css`
                    background: ${theme.gradients.danger};
                    color: white;

                    &:hover {
                        box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
                    }
                `;
            default:
                return css`
                    background: ${theme.gradients.primary};
                    color: white;

                    &:hover {
                        box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
                    }
                `;
        }
    }}
`;

// Card component
export const Card = styled.div`
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
`;

// Input component
export const Input = styled.input`
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid ${theme.colors.gray[200]};
    border-radius: 8px;
    outline: none;
    font-family: inherit;
    transition: all 0.2s ease;

    &:focus {
        border-color: ${theme.colors.primary[500]};
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
`;

// Layout components
export const PageContainer = styled.main`
    min-height: 100vh;
    background: ${theme.gradients.primary};
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
`;

export const ContentWrapper = styled.div`
    max-width: 1200px;
    margin: 0 auto;
`;

// Grid layout
export const Grid = styled.div<{ cols?: number; gap?: string }>`
    display: grid;
    grid-template-columns: repeat(${(props) => props.cols || 1}, 1fr);
    gap: ${(props) => props.gap || "1rem"};

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

// Typography
export const Title = styled.h1`
    font-size: 2.5rem;
    font-weight: 700;
    background: ${theme.gradients.primary};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 0.5rem 0;
`;

export const Subtitle = styled.p`
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    font-size: 1.1rem;
`;

// Utility styled components
export const Flex = styled.div<{
    direction?: "row" | "column";
    justify?: string;
    align?: string;
    gap?: string;
}>`
    display: flex;
    flex-direction: ${(props) => props.direction || "row"};
    justify-content: ${(props) => props.justify || "flex-start"};
    align-items: ${(props) => props.align || "flex-start"};
    gap: ${(props) => props.gap || "0"};
`;

export const criticalStyles = {
    success: css`
        color: #155724;
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
    `,
    failure: css`
        color: #721c24;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
    `,
};
