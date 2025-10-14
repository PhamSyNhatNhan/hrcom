// Types for user-facing homepage data

import {LucideIcon} from "lucide-react";

export interface MentorSkill {
    id: string;
    name: string;
    description?: string;
}

export interface MentorFromDB {
    id: string;
    full_name: string;
    headline?: string;
    avatar?: string;
    skills?: MentorSkill[];
    description?: string;
    email: string;
    phone_number?: string;
    created_at: string;
    total_bookings?: number;
    completed_bookings?: number;
    average_rating?: number;
    total_reviews?: number;
}

export interface StatisticFromDB {
    id: string;
    name: string;
    icon: string;
    label: string;
    value: string;
    display_order: number;
}

export interface ActivityFromDB {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    display_order: number;
}

export interface PartnerFromDB {
    id: string;
    name: string;
    description?: string;
    logo_url: string;
    website_url?: string;
    display_order: number;
}

export interface BannerFromDB {
    id: string;
    name: string;
    image_url: string;
    link_url?: string;
    open_new_tab: boolean;
    display_order: number;
}

export interface HomepageData {
    statistics: StatisticFromDB[];
    activities: ActivityFromDB[];
    partners: PartnerFromDB[];
    banners: BannerFromDB[];
    mentors: MentorFromDB[];
}

// For component props
export interface ActivityCardProps {
    href: string;
    imageSrc: string;
    imageAlt: string;
    title: string;
    description: string;
}

export interface PartnerCardProps {
    imageSrc: string;
    href: string;
}

export interface StatCardProps {
    icon: LucideIcon;
    value: string;
    label: string;
}