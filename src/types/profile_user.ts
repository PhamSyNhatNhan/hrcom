// src/types/profile_user.ts

// ==================== CORE TYPES ====================

export interface PersonalInfo {
    name: string;
    email: string;
    avatar: string;
    gender?: string;
    birthdate?: string;
    phone_number?: string;
}

export interface SubProfileInfo {
    university_major_id?: string;
    cv?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
    description?: string;
}

export interface MentorSkill {
    id: string;
    name: string;
    description?: string;
}

export interface MentorWorkExperience {
    id?: string;
    avatar?: string;
    company: string;
    position: string;
    start_date: string;
    end_date?: string;
    description: string[];
    published: boolean;
}

export interface MentorEducation {
    id?: string;
    avatar?: string;
    school: string;
    degree: string;
    start_date: string;
    end_date?: string;
    description: string[];
    published: boolean;
}

export interface MentorActivity {
    id?: string;
    avatar?: string;
    organization: string;
    role: string;
    activity_name: string;
    start_date: string;
    end_date?: string;
    description: string[];
    published: boolean;
}

export interface MentorInfo {
    // Basic info
    full_name?: string;
    email?: string;
    avatar?: string;
    phone_number?: string;
    headline?: string;
    description?: string;
    published?: boolean;

    // Skills
    skills?: MentorSkill[];

    // Related data
    work_experiences?: MentorWorkExperience[];
    educations?: MentorEducation[];
    activities?: MentorActivity[];
}

// ==================== UNIVERSITY & MAJOR ====================

export interface University {
    id: string;
    name: string;
    code: string;
}

export interface Major {
    id: string;
    name: string;
}

export interface UniversityMajor {
    id: string;
    university_id: string;
    major_id: string;
    university: {
        name: string;
        code: string;
    };
    major: {
        name: string;
    };
}

// ==================== PASSWORD ====================

export interface PasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface ShowPasswords {
    current: boolean;
    new: boolean;
    confirm: boolean;
}

// ==================== TAB TYPES ====================

export type TabType = 'profile' | 'mentor' | 'password';

// ==================== PROPS FOR TAB COMPONENTS ====================

export interface CombinedProfileTabProps {
    personalInfo: PersonalInfo;
    setPersonalInfo: React.Dispatch<React.SetStateAction<PersonalInfo>>;
    subProfileInfo: SubProfileInfo;
    setSubProfileInfo: React.Dispatch<React.SetStateAction<SubProfileInfo>>;
    hasSubProfile: boolean;
    setHasSubProfile: React.Dispatch<React.SetStateAction<boolean>>;
    universityMajors: UniversityMajor[];
    isEditing: boolean;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    previewAvatar: string;
    setPreviewAvatar: React.Dispatch<React.SetStateAction<string>>;
    uploading: boolean;
    onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveAvatar: () => void;
    onSave: () => void;
    onCancel: () => void;
    user: any;
    setUser: (user: any) => void;
    showSuccess: (title: string, message: string) => void;
    showError: (title: string, message: string) => void;
    uploadImage: (file: File) => Promise<string>;
}

export interface MentorTabProps {
    mentorInfo: MentorInfo;
    setMentorInfo: React.Dispatch<React.SetStateAction<MentorInfo>>;
    hasMentorProfile: boolean;
    isEditing: boolean;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
    isLoading: boolean;
    onSave: () => void;
    onCancel: () => void;
    onUploadImage: (file: File) => Promise<string>;
    showSuccess: (title: string, message: string) => void;
    showError: (title: string, message: string) => void;
}

export interface PasswordTabProps {
    passwordData: PasswordData;
    setPasswordData: React.Dispatch<React.SetStateAction<PasswordData>>;
    showPasswords: ShowPasswords;
    togglePasswordVisibility: (field: keyof ShowPasswords) => void;
    isLoading: boolean;
    onSubmit: () => void;
}