'use client'
import React, { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const Button = ({
                           children,
                           variant = 'primary',
                           size = 'md',
                           className = '',
                           ...props
                       }: ButtonProps) => {
    const baseClasses = 'font-medium transition-all duration-300 rounded-xl';

    const variants = {
        primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 shadow-lg',
        secondary: 'bg-white text-cyan-600 border-2 border-cyan-600 hover:bg-cyan-600 hover:text-white',
        outline: 'border-2 border-white text-white hover:bg-white hover:text-cyan-600'
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg'
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};