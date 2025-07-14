'use client'
import React from 'react';

interface SectionHeaderProps {
    title: string;
    subtitle: string;
}

export const SectionHeader = ({ title, subtitle }: SectionHeaderProps) => (
    <div className="text-center mb-16 px-4 sm:px-0">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {title}
        </h2>
        <p className="text-base sm:text-xl text-gray-600 max-w-5xl mx-auto text-center">
            {subtitle}
        </p>
    </div>
);
