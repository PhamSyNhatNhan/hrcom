import { LucideIcon } from 'lucide-react';
import { ReactNode, ButtonHTMLAttributes } from 'react';

export interface LayoutProps {
    children: ReactNode;
}

export interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string;
}

export interface Mentor {
    id: number;
    name: string;
    role: string;
    company: string;
    rating: number;
    sessions: number;
    price: string;
    image: string;
    specialties: string[];
}

export interface MentorCardProps {
    mentor: Mentor;
}

export interface Feature {
    icon: LucideIcon;
    title: string;
    description: string;
}

export interface FeatureCardProps {
    feature: Feature;
}

export interface SectionHeaderProps {
    title: string;
    subtitle: string;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}