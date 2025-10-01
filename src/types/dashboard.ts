// Shared types for dashboard management

export type DataSourceType = 'manual' | 'mentors' | 'posts' | 'users' | 'activities' | 'partners' | 'banners' | 'bookings';

export interface Statistic {
    id: string;
    name: string;
    icon: string;
    label: string;
    value: string;
    data_source: DataSourceType;
    data_filter?: Record<string, any>;
    display_order: number;
    published: boolean;
    created_at: string;
    updated_at: string;
}

// Danh sách icon có sẵn - mở rộng từ 4 lên nhiều hơn
export const AVAILABLE_ICONS = [
    'UserCheck',
    'Users',
    'BookOpen',
    'BookOpenCheck',
    'FileText',
    'Mic',
    'Building',
    'Award',
    'Briefcase',
    'GraduationCap',
    'Heart',
    'Star',
    'TrendingUp',
    'Target',
    'Activity',
    'CheckCircle'
] as const;

export type IconType = typeof AVAILABLE_ICONS[number];

export interface Activity {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    display_order: number;
    published: boolean;
    created_at: string;
    updated_at: string;
}

export interface Partner {
    id: string;
    name: string;
    description: string;
    logo_url: string;
    website_url: string;
    display_order: number;
    published: boolean;
    created_at: string;
    updated_at: string;
}

export interface Banner {
    id: string;
    name: string;
    image_url: string;
    link_url: string;
    open_new_tab: boolean;
    display_order: number;
    published: boolean;
    created_at: string;
    updated_at: string;
}

export type EditingItem = Statistic | Activity | Partner | Banner | null;
export type TableType = 'statistics' | 'activities' | 'partners' | 'banners';

export type FormState = Partial<
    Pick<
        Statistic & Activity & Partner & Banner,
        | 'id'
        | 'name'
        | 'icon'
        | 'label'
        | 'value'
        | 'data_source'
        | 'data_filter'
        | 'title'
        | 'description'
        | 'thumbnail'
        | 'logo_url'
        | 'website_url'
        | 'image_url'
        | 'link_url'
        | 'open_new_tab'
        | 'display_order'
        | 'published'
        | 'created_at'
        | 'updated_at'
    >
>;

export interface NotificationState {
    type: 'success' | 'error' | 'warning';
    message: string;
}

// Utility function
export function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err && 'message' in err) {
        const m = (err as { message?: unknown }).message;
        return typeof m === 'string' ? m : JSON.stringify(m);
    }
    return typeof err === 'string' ? err : JSON.stringify(err);
}