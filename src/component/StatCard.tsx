'use client'
import React from 'react';
import { LucideIcon } from 'lucide-react';

// Stat Card Component
interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string;
}

export const StatCard = ({icon: Icon, label, value}: StatCardProps) => (
    <div className="text-center group">
        <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-8 h-8 text-white" />
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
        <div className="text-gray-600 font-medium">{label}</div>
    </div>
);