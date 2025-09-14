'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Edit3, X, Save, GraduationCap, UserPlus, Upload, Camera, Plus, Trash2, Building, Award, Calendar, Eye, EyeOff, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/utils/supabase/client';
import Image from 'next/image';

// Interfaces
interface MentorWorkExperience {
    id?: string;
    avatar?: string;
    company: string;
    position: string;
    start_date: string;
    end_date?: string;
    description: string[];
    published: boolean;
}

interface MentorEducation {
    id?: string;
    avatar?: string;
    school: string;
    degree: string;
    start_date: string;
    end_date?: string;
    description: string[];
    published: boolean;
}

interface MentorActivity {
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

interface MentorInfo {
    // Basic info
    full_name?: string;
    email?: string;
    avatar?: string;
    phone_number?: string;
    headline?: string;
    description?: string;
    skill?: string[];
    published?: boolean;

    // Related data
    work_experiences?: MentorWorkExperience[];
    educations?: MentorEducation[];
    activities?: MentorActivity[];
}

interface MentorTabProps {
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

const MentorTab: React.FC<MentorTabProps> = ({
                                                 mentorInfo,
                                                 setMentorInfo,
                                                 hasMentorProfile,
                                                 isEditing,
                                                 setIsEditing,
                                                 isLoading,
                                                 onSave,
                                                 onCancel,
                                                 onUploadImage,
                                                 showSuccess,
                                                 showError
                                             }) => {
    const { user } = useAuthStore();
    const [skillInput, setSkillInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadingStates, setUploadingStates] = useState<{[key: string]: boolean}>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Registration states
    const [registrationData, setRegistrationData] = useState({
        notes: '',
        isSubmitting: false
    });
    const [hasRegistration, setHasRegistration] = useState(false);
    const [registrationStatus, setRegistrationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);

    // Check registration status on component mount
    useEffect(() => {
        if (user && user.role === 'user') {
            checkRegistrationStatus();
        }
    }, [user]);

    // Check if user has submitted mentor registration
    const checkRegistrationStatus = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('mentor_registrations')
                .select('status')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data) {
                setHasRegistration(true);
                setRegistrationStatus(data.status);
            }
        } catch (error) {
            // User hasn't submitted registration yet
            setHasRegistration(false);
            setRegistrationStatus(null);
        }
    };

    // Submit mentor registration
    const handleSubmitRegistration = async () => {
        if (!user || !registrationData.notes.trim()) return;

        try {
            setRegistrationData(prev => ({ ...prev, isSubmitting: true }));

            const { error } = await supabase
                .from('mentor_registrations')
                .insert([{
                    user_id: user.id,
                    email: user.email,
                    phone: user.profile?.phone_number || '',
                    notes: registrationData.notes.trim(),
                    status: 'pending'
                }]);

            if (error) throw error;

            setHasRegistration(true);
            setRegistrationStatus('pending');
            setRegistrationData({ notes: '', isSubmitting: false });
            showSuccess('Thành công', 'Đăng ký mentor đã được gửi! Admin sẽ xem xét và phản hồi sớm nhất.');

        } catch (error: any) {
            console.error('Error submitting registration:', error);
            showError('Lỗi', 'Không thể gửi đăng ký. Vui lòng thử lại.');
        } finally {
            setRegistrationData(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    // Upload helpers
    const handleImageUpload = async (file: File, uploadKey?: string): Promise<string> => {
        if (uploadKey) {
            setUploadingStates(prev => ({ ...prev, [uploadKey]: true }));
        } else {
            setUploading(true);
        }

        try {
            return await onUploadImage(file);
        } finally {
            if (uploadKey) {
                setUploadingStates(prev => ({ ...prev, [uploadKey]: false }));
            } else {
                setUploading(false);
            }
        }
    };

    // Skill management
    const handleAddSkill = () => {
        if (skillInput.trim() && !mentorInfo.skill?.includes(skillInput.trim())) {
            setMentorInfo(prev => ({
                ...prev,
                skill: [...(prev.skill || []), skillInput.trim()]
            }));
            setSkillInput('');
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setMentorInfo(prev => ({
            ...prev,
            skill: prev.skill?.filter(skill => skill !== skillToRemove) || []
        }));
    };

    // Work Experience management
    const addWorkExperience = () => {
        setMentorInfo(prev => ({
            ...prev,
            work_experiences: [...(prev.work_experiences || []), {
                company: '',
                position: '',
                start_date: '',
                end_date: '',
                description: [''],
                published: true,
                avatar: ''
            }]
        }));
    };

    const updateWorkExperience = (index: number, field: keyof MentorWorkExperience, value: any) => {
        setMentorInfo(prev => {
            const newExps = [...(prev.work_experiences || [])];
            newExps[index] = { ...newExps[index], [field]: value };
            return { ...prev, work_experiences: newExps };
        });
    };

    const removeWorkExperience = (index: number) => {
        setMentorInfo(prev => ({
            ...prev,
            work_experiences: prev.work_experiences?.filter((_, i) => i !== index) || []
        }));
    };

    // Education management
    const addEducation = () => {
        setMentorInfo(prev => ({
            ...prev,
            educations: [...(prev.educations || []), {
                school: '',
                degree: '',
                start_date: '',
                end_date: '',
                description: [''],
                published: true,
                avatar: ''
            }]
        }));
    };

    const updateEducation = (index: number, field: keyof MentorEducation, value: any) => {
        setMentorInfo(prev => {
            const newEdus = [...(prev.educations || [])];
            newEdus[index] = { ...newEdus[index], [field]: value };
            return { ...prev, educations: newEdus };
        });
    };

    const removeEducation = (index: number) => {
        setMentorInfo(prev => ({
            ...prev,
            educations: prev.educations?.filter((_, i) => i !== index) || []
        }));
    };

    // Activity management
    const addActivity = () => {
        setMentorInfo(prev => ({
            ...prev,
            activities: [...(prev.activities || []), {
                organization: '',
                role: '',
                activity_name: '',
                start_date: '',
                end_date: '',
                description: [''],
                published: true,
                avatar: ''
            }]
        }));
    };

    const updateActivity = (index: number, field: keyof MentorActivity, value: any) => {
        setMentorInfo(prev => {
            const newActivities = [...(prev.activities || [])];
            newActivities[index] = { ...newActivities[index], [field]: value };
            return { ...prev, activities: newActivities };
        });
    };

    const removeActivity = (index: number) => {
        setMentorInfo(prev => ({
            ...prev,
            activities: prev.activities?.filter((_, i) => i !== index) || []
        }));
    };

    // Check permissions
    const canEditMentor = user?.role === 'mentor' || user?.role === 'admin' || user?.role === 'superadmin';

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Thông tin Mentor</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Role hiện tại: <span className="font-semibold text-cyan-600">{user?.role}</span>
                    </p>
                </div>

                {canEditMentor && hasMentorProfile && !isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                        disabled={isLoading}
                    >
                        <Edit3 className="w-4 h-4" />
                        <span>Chỉnh sửa</span>
                    </button>
                ) : canEditMentor && hasMentorProfile && isEditing ? (
                    <button
                        onClick={onCancel}
                        className="bg-gray-500 text-white px-6 py-2 rounded-xl font-medium hover:bg-gray-600 transition-all duration-300 flex items-center space-x-2"
                        disabled={isLoading}
                    >
                        <X className="w-4 h-4" />
                        <span>Hủy</span>
                    </button>
                ) : null}
            </div>

            {canEditMentor && hasMentorProfile ? (
                <div className="space-y-8">
                    {/* Basic Information */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-cyan-800 mb-6 flex items-center space-x-2">
                            <Camera className="w-5 h-5" />
                            <span>Thông tin cơ bản</span>
                        </h3>

                        {/* Avatar */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-cyan-700 mb-4">Ảnh đại diện Mentor</label>
                            <div className="flex items-center space-x-6">
                                <div className="relative">
                                    <div className="h-28 w-28 rounded-full overflow-hidden ring-4 ring-cyan-100 shadow-lg bg-gray-100">
                                        {mentorInfo.avatar ? (
                                            <Image
                                                src={mentorInfo.avatar}
                                                alt="Mentor avatar"
                                                width={112}
                                                height={112}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-cyan-500 to-blue-600">
                                                <Camera className="text-white w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="space-y-3">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    try {
                                                        const imageUrl = await handleImageUpload(file);
                                                        setMentorInfo(prev => ({ ...prev, avatar: imageUrl }));
                                                    } catch (error) {
                                                        console.error('Error uploading avatar:', error);
                                                        showError('Lỗi', 'Không thể tải ảnh lên');
                                                    }
                                                }
                                            }}
                                            disabled={uploading}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="bg-white text-cyan-700 border-2 border-cyan-500/70 px-4 py-2 rounded-xl font-medium hover:bg-cyan-600 hover:text-white transition-all duration-300 flex items-center space-x-2 shadow-sm hover:shadow"
                                            disabled={uploading}
                                        >
                                            {uploading ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-600"></div>
                                            ) : (
                                                <Upload className="w-4 h-4" />
                                            )}
                                            <span>{uploading ? 'Đang tải...' : 'Tải ảnh lên'}</span>
                                        </button>

                                        {mentorInfo.avatar && (
                                            <button
                                                onClick={() => setMentorInfo(prev => ({ ...prev, avatar: '' }))}
                                                className="text-red-600 border-2 border-red-300 px-4 py-2 rounded-xl hover:bg-red-50 transition-all duration-300 flex items-center space-x-2"
                                                disabled={uploading}
                                            >
                                                <X className="w-4 h-4" />
                                                <span>Xóa ảnh</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Basic Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-cyan-700">
                                    Tên Mentor <span className="text-red-500">*</span>
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={mentorInfo.full_name || ''}
                                        onChange={(e) => setMentorInfo(prev => ({ ...prev, full_name: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-cyan-300 bg-white focus:ring-4 focus:ring-cyan-100 focus:border-cyan-500 shadow-sm transition-all duration-200"
                                        disabled={isLoading}
                                        placeholder="Tên hiển thị công khai"
                                    />
                                ) : (
                                    <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium">
                                        {mentorInfo.full_name || 'Chưa cập nhật'}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-cyan-700">
                                    Email liên hệ <span className="text-red-500">*</span>
                                </label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={mentorInfo.email || ''}
                                        onChange={(e) => setMentorInfo(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-cyan-300 bg-white focus:ring-4 focus:ring-cyan-100 focus:border-cyan-500 shadow-sm transition-all duration-200"
                                        disabled={isLoading}
                                        placeholder="Email công khai để liên hệ"
                                    />
                                ) : (
                                    <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium">
                                        {mentorInfo.email || 'Chưa cập nhật'}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-cyan-700">Số điện thoại</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={mentorInfo.phone_number || ''}
                                        onChange={(e) => setMentorInfo(prev => ({ ...prev, phone_number: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-cyan-300 bg-white focus:ring-4 focus:ring-cyan-100 focus:border-cyan-500 shadow-sm transition-all duration-200"
                                        disabled={isLoading}
                                        placeholder="SĐT liên hệ công khai"
                                    />
                                ) : (
                                    <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium">
                                        {mentorInfo.phone_number || 'Chưa cập nhật'}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-cyan-700">Tiêu đề chuyên môn</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={mentorInfo.headline || ''}
                                        onChange={(e) => setMentorInfo(prev => ({ ...prev, headline: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-cyan-300 bg-white focus:ring-4 focus:ring-cyan-100 focus:border-cyan-500 shadow-sm transition-all duration-200"
                                        disabled={isLoading}
                                        placeholder="VD: Senior HR Manager tại ABC Company"
                                    />
                                ) : (
                                    <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium">
                                        {mentorInfo.headline || 'Chưa cập nhật'}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-sm font-semibold text-cyan-700">Mô tả về bản thân (Mentor)</label>
                                {isEditing ? (
                                    <textarea
                                        rows={4}
                                        value={mentorInfo.description || ''}
                                        onChange={(e) => setMentorInfo(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-cyan-300 bg-white focus:ring-4 focus:ring-cyan-100 focus:border-cyan-500 shadow-sm transition-all duration-200 resize-none"
                                        disabled={isLoading}
                                        placeholder="Mô tả kinh nghiệm, chuyên môn và phương pháp hỗ trợ học viên..."
                                    />
                                ) : (
                                    <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium min-h-[100px] whitespace-pre-wrap">
                                        {mentorInfo.description || 'Chưa cập nhật'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Skills Section */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-emerald-800 mb-6">Kỹ năng chuyên môn</h3>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                                        className="flex-1 px-4 py-2 border border-emerald-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 shadow-sm"
                                        disabled={isLoading}
                                        placeholder="Nhập kỹ năng và nhấn Enter"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddSkill}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-all duration-300"
                                        disabled={isLoading || !skillInput.trim()}
                                    >
                                        Thêm
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(mentorInfo.skill || []).map((skill, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800"
                                        >
                                            {skill}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSkill(skill)}
                                                className="ml-2 text-emerald-600 hover:text-emerald-800 transition-colors duration-200"
                                                disabled={isLoading}
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium">
                                {mentorInfo.skill && mentorInfo.skill.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {mentorInfo.skill.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                ) : 'Chưa cập nhật kỹ năng'}
                            </div>
                        )}
                    </div>

                    {/* Work Experiences Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-indigo-800 flex items-center space-x-2">
                                <Building className="w-5 h-5" />
                                <span>Kinh nghiệm làm việc</span>
                            </h3>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={addWorkExperience}
                                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Thêm</span>
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {(mentorInfo.work_experiences || []).length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Chưa có kinh nghiệm làm việc
                                </div>
                            ) : (
                                (mentorInfo.work_experiences || []).map((exp, index) => (
                                    <div key={index} className="bg-white rounded-xl p-4 border border-indigo-200">
                                        <div className="flex items-start space-x-4">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                                    {exp.avatar ? (
                                                        <Image
                                                            src={exp.avatar}
                                                            alt={exp.company}
                                                            width={48}
                                                            height={48}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full w-full bg-indigo-100">
                                                            <Building className="text-indigo-600 w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                {isEditing ? (
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <input
                                                                type="text"
                                                                placeholder="Công ty"
                                                                value={exp.company}
                                                                onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                                                                className="px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Vị trí"
                                                                value={exp.position}
                                                                onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                                                                className="px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                            />
                                                            <input
                                                                type="date"
                                                                value={exp.start_date}
                                                                onChange={(e) => updateWorkExperience(index, 'start_date', e.target.value)}
                                                                className="px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                            />
                                                            <input
                                                                type="date"
                                                                value={exp.end_date || ''}
                                                                onChange={(e) => updateWorkExperience(index, 'end_date', e.target.value)}
                                                                className="px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                            />
                                                        </div>
                                                        <textarea
                                                            placeholder="Mô tả công việc (mỗi dòng một mô tả)"
                                                            value={exp.description.join('\n')}
                                                            onChange={(e) => updateWorkExperience(index, 'description', e.target.value.split('\n').filter(d => d.trim()))}
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-4">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    id={`work-avatar-${index}`}
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            try {
                                                                                const imageUrl = await handleImageUpload(file, `work-${index}`);updateWorkExperience(index, 'avatar', imageUrl);
                                                                            } catch (error) {
                                                                                console.error('Error uploading work avatar:', error);
                                                                                showError('Lỗi', 'Không thể tải ảnh lên');
                                                                            }
                                                                        }
                                                                    }}
                                                                    disabled={uploadingStates[`work-${index}`]}
                                                                />
                                                                <label
                                                                    htmlFor={`work-avatar-${index}`}
                                                                    className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800"
                                                                >
                                                                    {uploadingStates[`work-${index}`] ? (
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                                                                    ) : (
                                                                        'Đổi ảnh'
                                                                    )}
                                                                </label>
                                                                <label className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={exp.published}
                                                                        onChange={(e) => updateWorkExperience(index, 'published', e.target.checked)}
                                                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                                    />
                                                                    <span className="text-sm text-gray-700">Công khai</span>
                                                                </label>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeWorkExperience(index)}
                                                                className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                                                                <p className="text-indigo-600 font-medium">{exp.company}</p>
                                                                <p className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    <span>{exp.start_date} - {exp.end_date || 'Hiện tại'}</span>
                                                                </p>
                                                            </div>
                                                            {exp.published ? (
                                                                <Eye className="w-4 h-4 text-green-600" />
                                                            ) : (
                                                                <EyeOff className="w-4 h-4 text-gray-400" />
                                                            )}
                                                        </div>
                                                        {exp.description && exp.description.length > 0 && (
                                                            <div className="mt-2">
                                                                {exp.description.map((desc, descIndex) => (
                                                                    <p key={descIndex} className="text-sm text-gray-600">
                                                                        • {desc}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Education Section */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-emerald-800 flex items-center space-x-2">
                                <GraduationCap className="w-5 h-5" />
                                <span>Học vấn</span>
                            </h3>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={addEducation}
                                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-300"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Thêm</span>
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {(mentorInfo.educations || []).length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Chưa có thông tin học vấn
                                </div>
                            ) : (
                                (mentorInfo.educations || []).map((edu, index) => (
                                    <div key={index} className="bg-white rounded-xl p-4 border border-emerald-200">
                                        <div className="flex items-start space-x-4">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                                    {edu.avatar ? (
                                                        <Image
                                                            src={edu.avatar}
                                                            alt={edu.school}
                                                            width={48}
                                                            height={48}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full w-full bg-emerald-100">
                                                            <GraduationCap className="text-emerald-600 w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                {isEditing ? (
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <input
                                                                type="text"
                                                                placeholder="Trường học"
                                                                value={edu.school}
                                                                onChange={(e) => updateEducation(index, 'school', e.target.value)}
                                                                className="px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Bằng cấp"
                                                                value={edu.degree}
                                                                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                                                className="px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                            />
                                                            <input
                                                                type="date"
                                                                value={edu.start_date}
                                                                onChange={(e) => updateEducation(index, 'start_date', e.target.value)}
                                                                className="px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                            />
                                                            <input
                                                                type="date"
                                                                value={edu.end_date || ''}
                                                                onChange={(e) => updateEducation(index, 'end_date', e.target.value)}
                                                                className="px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                            />
                                                        </div>
                                                        <textarea
                                                            placeholder="Mô tả học tập (mỗi dòng một mô tả)"
                                                            value={edu.description.join('\n')}
                                                            onChange={(e) => updateEducation(index, 'description', e.target.value.split('\n').filter(d => d.trim()))}
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                        />
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-4">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    id={`edu-avatar-${index}`}
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            try {
                                                                                const imageUrl = await handleImageUpload(file, `edu-${index}`);
                                                                                updateEducation(index, 'avatar', imageUrl);
                                                                            } catch (error) {
                                                                                console.error('Error uploading education avatar:', error);
                                                                                showError('Lỗi', 'Không thể tải ảnh lên');
                                                                            }
                                                                        }
                                                                    }}
                                                                    disabled={uploadingStates[`edu-${index}`]}
                                                                />
                                                                <label
                                                                    htmlFor={`edu-avatar-${index}`}
                                                                    className="cursor-pointer text-sm text-emerald-600 hover:text-emerald-800"
                                                                >
                                                                    {uploadingStates[`edu-${index}`] ? (
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                                                                    ) : (
                                                                        'Đổi ảnh'
                                                                    )}
                                                                </label>
                                                                <label className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={edu.published}
                                                                        onChange={(e) => updateEducation(index, 'published', e.target.checked)}
                                                                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                                                    />
                                                                    <span className="text-sm text-gray-700">Công khai</span>
                                                                </label>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeEducation(index)}
                                                                className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                                                                <p className="text-emerald-600 font-medium">{edu.school}</p>
                                                                <p className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    <span>{edu.start_date} - {edu.end_date || 'Hiện tại'}</span>
                                                                </p>
                                                            </div>
                                                            {edu.published ? (
                                                                <Eye className="w-4 h-4 text-green-600" />
                                                            ) : (
                                                                <EyeOff className="w-4 h-4 text-gray-400" />
                                                            )}
                                                        </div>
                                                        {edu.description && edu.description.length > 0 && (
                                                            <div className="mt-2">
                                                                {edu.description.map((desc, descIndex) => (
                                                                    <p key={descIndex} className="text-sm text-gray-600">
                                                                        • {desc}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Activities Section */}
                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-violet-800 flex items-center space-x-2">
                                <Award className="w-5 h-5" />
                                <span>Hoạt động</span>
                            </h3>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={addActivity}
                                    className="flex items-center space-x-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all duration-300"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Thêm</span>
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {(mentorInfo.activities || []).length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Chưa có thông tin hoạt động
                                </div>
                            ) : (
                                (mentorInfo.activities || []).map((activity, index) => (
                                    <div key={index} className="bg-white rounded-xl p-4 border border-violet-200">
                                        <div className="flex items-start space-x-4">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                                    {activity.avatar ? (
                                                        <Image
                                                            src={activity.avatar}
                                                            alt={activity.activity_name}
                                                            width={48}
                                                            height={48}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full w-full bg-violet-100">
                                                            <Award className="text-violet-600 w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                {isEditing ? (
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <input
                                                                type="text"
                                                                placeholder="Tên hoạt động"
                                                                value={activity.activity_name}
                                                                onChange={(e) => updateActivity(index, 'activity_name', e.target.value)}
                                                                className="px-3 py-2 border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Tổ chức"
                                                                value={activity.organization}
                                                                onChange={(e) => updateActivity(index, 'organization', e.target.value)}
                                                                className="px-3 py-2 border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Vai trò"
                                                                value={activity.role}
                                                                onChange={(e) => updateActivity(index, 'role', e.target.value)}
                                                                className="px-3 py-2 border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                                            />
                                                            <div></div>
                                                            <input
                                                                type="date"
                                                                value={activity.start_date}
                                                                onChange={(e) => updateActivity(index, 'start_date', e.target.value)}
                                                                className="px-3 py-2 border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                                            />
                                                            <input
                                                                type="date"
                                                                value={activity.end_date || ''}
                                                                onChange={(e) => updateActivity(index, 'end_date', e.target.value)}
                                                                className="px-3 py-2 border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                                            />
                                                        </div>
                                                        <textarea
                                                            placeholder="Mô tả hoạt động (mỗi dòng một mô tả)"
                                                            value={activity.description.join('\n')}
                                                            onChange={(e) => updateActivity(index, 'description', e.target.value.split('\n').filter(d => d.trim()))}
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                                        />
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-4">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    id={`activity-avatar-${index}`}
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            try {
                                                                                const imageUrl = await handleImageUpload(file, `activity-${index}`);
                                                                                updateActivity(index, 'avatar', imageUrl);
                                                                            } catch (error) {
                                                                                console.error('Error uploading activity avatar:', error);
                                                                                showError('Lỗi', 'Không thể tải ảnh lên');
                                                                            }
                                                                        }
                                                                    }}
                                                                    disabled={uploadingStates[`activity-${index}`]}
                                                                />
                                                                <label
                                                                    htmlFor={`activity-avatar-${index}`}
                                                                    className="cursor-pointer text-sm text-violet-600 hover:text-violet-800"
                                                                >
                                                                    {uploadingStates[`activity-${index}`] ? (
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-600"></div>
                                                                    ) : (
                                                                        'Đổi ảnh'
                                                                    )}
                                                                </label>
                                                                <label className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={activity.published}
                                                                        onChange={(e) => updateActivity(index, 'published', e.target.checked)}
                                                                        className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                                                                    />
                                                                    <span className="text-sm text-gray-700">Công khai</span>
                                                                </label>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeActivity(index)}
                                                                className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900">{activity.activity_name}</h4>
                                                                <p className="text-violet-600 font-medium">
                                                                    {activity.role} tại {activity.organization}
                                                                </p>
                                                                <p className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    <span>{activity.start_date} - {activity.end_date || 'Hiện tại'}</span>
                                                                </p>
                                                            </div>
                                                            {activity.published ? (
                                                                <Eye className="w-4 h-4 text-green-600" />
                                                            ) : (
                                                                <EyeOff className="w-4 h-4 text-gray-400" />
                                                            )}
                                                        </div>
                                                        {activity.description && activity.description.length > 0 && (
                                                            <div className="mt-2">
                                                                {activity.description.map((desc, descIndex) => (
                                                                    <p key={descIndex} className="text-sm text-gray-600">
                                                                        • {desc}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Publish Status */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-amber-800 mb-6">Trạng thái hiển thị</h3>

                        {isEditing ? (
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="published"
                                        checked={mentorInfo.published === true}
                                        onChange={() => setMentorInfo(prev => ({ ...prev, published: true }))}
                                        disabled={isLoading}
                                        className="text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className="text-sm">Công khai (hiển thị trong danh sách mentor)</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="published"
                                        checked={mentorInfo.published === false}
                                        onChange={() => setMentorInfo(prev => ({ ...prev, published: false }))}
                                        disabled={isLoading}
                                        className="text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className="text-sm">Ẩn (không hiển thị công khai)</span>
                                </label>
                            </div>
                        ) : (
                            <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium">
                                <span className={`px-3 py-2 rounded-full text-sm font-medium ${
                                    mentorInfo.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {mentorInfo.published ? 'Công khai - Hiển thị trong danh sách mentor' : 'Ẩn - Không hiển thị công khai'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {isEditing && (
                        <div className="flex justify-end space-x-4 pt-6">
                            <button
                                onClick={onCancel}
                                className="px-6 py-2 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all duration-300"
                                disabled={isLoading}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={onSave}
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                <span>{isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                            </button>
                        </div>
                    )}
                </div>
            ) : canEditMentor && !hasMentorProfile ? (
                // User có quyền mentor nhưng chưa có profile
                <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-12 h-12 text-cyan-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Mentor chưa được thiết lập</h3>
                    <p className="text-gray-600 mb-6">
                        Bạn đã có quyền mentor nhưng profile mentor chưa được tạo trong hệ thống.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                        <p className="text-amber-800 text-sm">
                            <strong>Lưu ý:</strong> Admin cần tạo profile mentor cho bạn trong hệ thống trước khi bạn có thể chỉnh sửa thông tin.
                        </p>
                    </div>
                    <p className="text-sm text-gray-500">
                        Vui lòng liên hệ admin để được hỗ trợ thiết lập profile mentor.
                    </p>
                </div>
            ) : (
                // User thường - form đăng ký mentor
                <div className="max-w-2xl mx-auto">
                    {!hasRegistration ? (
                        // Form đăng ký
                        <div className="text-center py-12">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                                <UserPlus className="w-12 h-12 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Đăng ký trở thành Mentor</h3>
                            <p className="text-gray-600 mb-8">
                                Chia sẻ kinh nghiệm và hướng dẫn học viên trong lĩnh vực của bạn
                            </p>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-left">
                                <h4 className="text-blue-800 font-semibold mb-3 flex items-center">
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Yêu cầu trở thành Mentor:
                                </h4>
                                <ul className="text-blue-700 text-sm space-y-2">
                                    <li className="flex items-start">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                        Có kinh nghiệm chuyên môn ít nhất 2 năm trong lĩnh vực
                                    </li>
                                    <li className="flex items-start">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    </li>
                                    <li className="flex items-start">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                        Cam kết hỗ trợ và hướng dẫn học viên
                                    </li>
                                    <li className="flex items-start">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                        Có kỹ năng giao tiếp và chia sẻ kiến thức tốt
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <textarea
                                    placeholder="Mô tả kinh nghiệm chuyên môn, lý do muốn trở thành mentor và kế hoạch hỗ trợ học viên..."
                                    value={registrationData.notes}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                                    maxLength={1000}
                                />
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <span>Tối thiểu 100 ký tự để gửi đăng ký</span>
                                    <span>{registrationData.notes.length}/1000</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmitRegistration}
                                disabled={registrationData.isSubmitting || registrationData.notes.trim().length < 100}
                                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-4 rounded-xl font-medium hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                            >
                                {registrationData.isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Đang gửi đăng ký...</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-5 h-5" />
                                        <span>Gửi đăng ký trở thành Mentor</span>
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-500 mt-4 text-center">
                                Sau khi gửi đăng ký, admin sẽ xem xét và phản hồi trong vòng 3-5 ngày làm việc
                            </p>
                        </div>
                    ) : (
                        // Hiển thị trạng thái đăng ký
                        <div className="text-center py-12">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r rounded-full flex items-center justify-center">
                                {registrationStatus === 'pending' && (
                                    <div className="bg-gradient-to-r from-amber-100 to-orange-100 w-full h-full rounded-full flex items-center justify-center">
                                        <Clock className="w-12 h-12 text-amber-600" />
                                    </div>
                                )}
                                {registrationStatus === 'approved' && (
                                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 w-full h-full rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-12 h-12 text-green-600" />
                                    </div>
                                )}
                                {registrationStatus === 'rejected' && (
                                    <div className="bg-gradient-to-r from-red-100 to-pink-100 w-full h-full rounded-full flex items-center justify-center">
                                        <XCircle className="w-12 h-12 text-red-600" />
                                    </div>
                                )}
                            </div>

                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                {registrationStatus === 'pending' && 'Đăng ký đang chờ duyệt'}
                                {registrationStatus === 'approved' && 'Đăng ký đã được phê duyệt'}
                                {registrationStatus === 'rejected' && 'Đăng ký bị từ chối'}
                            </h3>

                            <div className={`p-6 rounded-xl mb-6 max-w-md mx-auto ${
                                registrationStatus === 'pending' ? 'bg-amber-50 border border-amber-200' :
                                    registrationStatus === 'approved' ? 'bg-green-50 border border-green-200' :
                                        'bg-red-50 border border-red-200'
                            }`}>
                                <p className={`text-sm ${
                                    registrationStatus === 'pending' ? 'text-amber-800' :
                                        registrationStatus === 'approved' ? 'text-green-800' :
                                            'text-red-800'
                                }`}>
                                    {registrationStatus === 'pending' && (
                                        <>
                                            <strong>Trạng thái:</strong> Đang chờ admin xem xét<br/>
                                            Admin sẽ xem xét đăng ký của bạn và phản hồi trong thời gian sớm nhất.
                                            Bạn sẽ nhận được thông báo qua email khi có kết quả.
                                        </>
                                    )}
                                    {registrationStatus === 'approved' && (
                                        <>
                                            <strong>Chúc mừng!</strong> Đăng ký mentor của bạn đã được phê duyệt.<br/>
                                            Admin sẽ sớm cấp quyền mentor và thiết lập profile mentor cho bạn.
                                            Vui lòng kiểm tra email để biết thêm chi tiết.
                                        </>
                                    )}
                                    {registrationStatus === 'rejected' && (
                                        <>
                                            <strong>Đăng ký chưa được chấp nhận.</strong><br/>
                                            Vui lòng liên hệ admin để biết thêm chi tiết và cải thiện hồ sơ
                                            cho lần đăng ký tiếp theo.
                                        </>
                                    )}
                                </p>
                            </div>

                            {registrationStatus === 'rejected' && (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => {
                                            setHasRegistration(false);
                                            setRegistrationStatus(null);
                                            setRegistrationData({ notes: '', isSubmitting: false });
                                        }}
                                        className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                                    >
                                        Đăng ký lại
                                    </button>
                                    <p className="text-sm text-gray-500">
                                        Bạn có thể đăng ký lại sau khi cải thiện hồ sơ theo góp ý của admin
                                    </p>
                                </div>
                            )}

                            {(registrationStatus === 'pending' || registrationStatus === 'approved') && (
                                <button
                                    onClick={() => window.location.href = 'mailto:admin@yoursite.com?subject=Hỗ trợ đăng ký Mentor'}
                                    className="text-gray-600 hover:text-gray-800 text-sm underline"
                                >
                                    Liên hệ admin nếu cần hỗ trợ
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MentorTab;