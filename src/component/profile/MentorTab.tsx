'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Edit3, X, Save, GraduationCap, UserPlus, Upload, Camera, Plus, Trash2,
    Building, Award, Calendar, Eye, EyeOff, Clock, CheckCircle, XCircle, Mail, Phone, FileText
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/utils/supabase/client';
import Image from 'next/image';
import type {
    MentorTabProps,
    MentorWorkExperience,
    MentorEducation,
    MentorActivity,
    MentorSkill
} from '@/types/profile_user';

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
    const [uploading, setUploading] = useState(false);
    const [uploadingStates, setUploadingStates] = useState<{[key: string]: boolean}>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Skill states
    const [allSkills, setAllSkills] = useState<MentorSkill[]>([]);
    const [isSkillPickerOpen, setIsSkillPickerOpen] = useState(false);
    const [tempSelectedSkillIds, setTempSelectedSkillIds] = useState<Set<string>>(new Set());

    const remainingSkills = useMemo(() => {
        const selected = new Set((mentorInfo.skills || []).map(s => s.id));
        return (allSkills || []).filter(s => !selected.has(s.id));
    }, [allSkills, mentorInfo.skills]);

    useEffect(() => {
        let mounted = true;
        supabase
            .from('mentor_skills')
            .select('id,name,description')
            .eq('published', true)
            .order('name', { ascending: true })
            .then(({ data, error }) => {
                if (!mounted) return;
                if (error) {
                    console.error('Load mentor_skills error:', error);
                    return;
                }
                setAllSkills(data || []);
            });
        return () => { mounted = false; };
    }, []);

    // Registration states
    const [registrationData, setRegistrationData] = useState({
        email: user?.email || '',
        phone: user?.profile?.phone_number || '',
        notes: '',
        isSubmitting: false
    });
    const [hasRegistration, setHasRegistration] = useState(false);
    const [registrationStatus, setRegistrationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
    const [registrationError, setRegistrationError] = useState('');
    const [registrationStep, setRegistrationStep] = useState<'initial' | 'policy' | 'form'>('initial');
    const [agreedToPolicy, setAgreedToPolicy] = useState(false);

    useEffect(() => {
        if (user && user.role === 'user') {
            checkRegistrationStatus();
        }
    }, [user]);

    useEffect(() => {
        if (user && !hasRegistration) {
            setRegistrationData(prev => ({
                ...prev,
                email: user.email || prev.email,
                phone: user.profile?.phone_number || prev.phone
            }));
        }
    }, [user, hasRegistration]);

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
            setHasRegistration(false);
            setRegistrationStatus(null);
        }
    };

    const handleSubmitRegistration = async () => {
        if (!user) {
            setRegistrationError('Không tìm thấy thông tin người dùng');
            return;
        }

        if (!registrationData.email.trim()) {
            setRegistrationError('Vui lòng nhập địa chỉ email');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationData.email)) {
            setRegistrationError('Địa chỉ email không hợp lệ');
            return;
        }

        if (!registrationData.phone.trim()) {
            setRegistrationError('Vui lòng nhập số điện thoại');
            return;
        }

        if (!/^[0-9+\-\s()]{10,}$/.test(registrationData.phone.replace(/\s/g, ''))) {
            setRegistrationError('Số điện thoại không hợp lệ');
            return;
        }

        if (!registrationData.notes.trim()) {
            setRegistrationError('Vui lòng chia sẻ thông tin về bản thân');
            return;
        }

        if (registrationData.notes.trim().length < 100) {
            setRegistrationError('Vui lòng chia sẻ ít nhất 100 ký tự về bản thân');
            return;
        }

        try {
            setRegistrationData(prev => ({ ...prev, isSubmitting: true }));
            setRegistrationError('');

            const { error } = await supabase
                .from('mentor_registrations')
                .insert([{
                    user_id: user.id,
                    email: registrationData.email.trim(),
                    phone: registrationData.phone.trim(),
                    notes: registrationData.notes.trim(),
                    status: 'pending'
                }]);

            if (error) throw error;

            setHasRegistration(true);
            setRegistrationStatus('pending');
            setRegistrationData({
                email: user?.email || '',
                phone: user?.profile?.phone_number || '',
                notes: '',
                isSubmitting: false
            });

            showSuccess('Thành công', 'Đăng ký mentor đã được gửi! Admin sẽ xem xét và phản hồi sớm nhất.');

        } catch (error: any) {
            console.error('Error submitting registration:', error);
            setRegistrationError('Không thể gửi đăng ký. Vui lòng thử lại.');
        } finally {
            setRegistrationData(prev => ({ ...prev, isSubmitting: false }));
        }
    };

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
    const removeSkill = (skillId: string) => {
        setMentorInfo(prev => ({
            ...prev,
            skills: (prev.skills || []).filter(s => s.id !== skillId)
        }));
    };

    const toggleSkillId = (id: string) => {
        setTempSelectedSkillIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAllRemaining = () => {
        setTempSelectedSkillIds(new Set(remainingSkills.map(s => s.id)));
    };

    const clearTempSelection = () => setTempSelectedSkillIds(new Set());

    const applyAddSkills = () => {
        if (tempSelectedSkillIds.size === 0) {
            setIsSkillPickerOpen(false);
            return;
        }
        const mapById = new Map(allSkills.map(s => [s.id, s]));
        const toAdd: MentorSkill[] = Array.from(tempSelectedSkillIds)
            .map(id => mapById.get(id))
            .filter(Boolean) as MentorSkill[];

        setMentorInfo(prev => {
            const curr = prev.skills || [];
            const exists = new Set(curr.map(s => s.id));
            const merged = [...curr, ...toAdd.filter(s => !exists.has(s.id))];
            return { ...prev, skills: merged };
        });

        setTempSelectedSkillIds(new Set());
        setIsSkillPickerOpen(false);
        showSuccess?.('Đã thêm kỹ năng', `Đã thêm ${toAdd.length} kỹ năng vào hồ sơ`);
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

    const removeWorkExperience = (index: number) => {
        setMentorInfo(prev => ({
            ...prev,
            work_experiences: prev.work_experiences?.filter((_, i) => i !== index) || []
        }));
    };

    const updateWorkExperience = (index: number, field: keyof MentorWorkExperience, value: any) => {
        setMentorInfo(prev => {
            const newExps = [...(prev.work_experiences || [])];
            newExps[index] = { ...newExps[index], [field]: value };
            return { ...prev, work_experiences: newExps };
        });
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

    const removeEducation = (index: number) => {
        setMentorInfo(prev => ({
            ...prev,
            educations: prev.educations?.filter((_, i) => i !== index) || []
        }));
    };

    const updateEducation = (index: number, field: keyof MentorEducation, value: any) => {
        setMentorInfo(prev => {
            const newEdus = [...(prev.educations || [])];
            newEdus[index] = { ...newEdus[index], [field]: value };
            return { ...prev, educations: newEdus };
        });
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

    const removeActivity = (index: number) => {
        setMentorInfo(prev => ({
            ...prev,
            activities: prev.activities?.filter((_, i) => i !== index) || []
        }));
    };

    const updateActivity = (index: number, field: keyof MentorActivity, value: any) => {
        setMentorInfo(prev => {
            const newActivities = [...(prev.activities || [])];
            newActivities[index] = { ...newActivities[index], [field]: value };
            return { ...prev, activities: newActivities };
        });
    };

    const canEditMentor = user?.role === 'mentor';

    // Theme - Responsive
    const theme = {
        panel: isEditing
            ? "bg-gradient-to-r rounded-2xl p-4 sm:p-6"
            : "bg-gradient-to-r rounded-2xl p-4 sm:p-6",

        header: isEditing
            ? "text-base sm:text-lg"
            : "text-gray-900 text-base sm:text-lg",

        label: isEditing
            ? "block text-sm font-semibold mb-2 sm:mb-3"
            : "block text-sm font-semibold text-gray-900 mb-2",

        viewBox: "px-3 py-2 sm:px-4 sm:py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium text-sm sm:text-base",

        input: isEditing
            ? "w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border border-cyan-300 bg-white focus:ring-4 focus:ring-cyan-100 focus:border-cyan-500 shadow-sm transition-all duration-200 focus:outline-none"
            : "w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl text-gray-900 font-medium bg-gray-50",

        select: isEditing
            ? "w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border border-cyan-300 bg-white focus:ring-4 focus:ring-cyan-100 focus:border-cyan-500 shadow-sm transition-all duration-200 focus:outline-none"
            : "w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl text-gray-900 font-medium bg-gray-50",

        textarea: isEditing
            ? "w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border border-cyan-300 bg-white focus:ring-4 focus:ring-cyan-100 focus:border-cyan-500 shadow-sm transition-all duration-200 focus:outline-none resize-none"
            : "w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl text-gray-900 font-medium bg-gray-50 resize-none",

        avatarRing: isEditing ? "ring-4 ring-cyan-100" : "ring-4 ring-white",
        avatarBg: isEditing ? "bg-cyan-100" : "bg-gradient-to-br from-cyan-500 to-blue-600",
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Thông tin Mentor</h2>
                {canEditMentor && hasMentorProfile && !isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 sm:px-6 py-2 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                        disabled={isLoading}
                    >
                        <Edit3 className="w-4 h-4" />
                        <span>Chỉnh sửa</span>
                    </button>
                ) : canEditMentor && hasMentorProfile && isEditing ? (
                    <button
                        onClick={onCancel}
                        className="w-full sm:w-auto bg-gray-500 text-white px-4 sm:px-6 py-2 rounded-xl font-medium hover:bg-gray-600 transition-all duration-300 flex items-center justify-center space-x-2"
                        disabled={isLoading}
                    >
                        <X className="w-4 h-4" />
                        <span>Hủy</span>
                    </button>
                ) : null}
            </div>

            {canEditMentor && hasMentorProfile ? (
                <div className="space-y-6 sm:space-y-8">
                    {/* Basic Information - Mobile Optimized */}
                    <div className={`${theme.panel} from-blue-50 to-cyan-50`}>
                        <h3 className={`font-semibold mb-4 sm:mb-6 flex items-center space-x-2 text-cyan-800 ${theme.header}`}>
                            <Camera className="w-5 h-5" />
                            <span>Thông tin cơ bản</span>
                        </h3>

                        {/* Avatar - Mobile Responsive */}
                        <div className="mb-4 sm:mb-6">
                            <label className={`${theme.label} text-cyan-700 mb-3 sm:mb-4`}>Ảnh đại diện Mentor</label>
                            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                                <div className="relative">
                                    <div className={`h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden ${theme.avatarRing} shadow-lg bg-gray-100`}>
                                        {mentorInfo.avatar ? (
                                            <Image
                                                src={mentorInfo.avatar}
                                                alt="Mentor avatar"
                                                width={112}
                                                height={112}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className={`flex items-center justify-center h-full w-full ${theme.avatarBg}`}>
                                                <Camera className={`${isEditing ? 'text-cyan-600' : 'text-white'} w-6 h-6 sm:w-8 sm:h-8`} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
                                                        showSuccess('Thành công', 'Ảnh đã được cập nhật');
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
                                            className="w-full sm:w-auto bg-white text-cyan-700 border-2 border-cyan-500/70 px-4 py-2 rounded-xl font-medium hover:bg-cyan-600 hover:text-white transition-all duration-300 flex items-center justify-center space-x-2 shadow-sm hover:shadow text-sm"
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
                                                className="w-full sm:w-auto text-red-600 border-2 border-red-300 px-4 py-2 rounded-xl hover:bg-red-50 transition-all duration-300 flex items-center justify-center space-x-2 text-sm"
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

                        {/* Basic Fields - Responsive Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-2">
                                <label className={`${theme.label} text-cyan-700`}>
                                    Tên Mentor <span className="text-red-500">*</span>
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={mentorInfo.full_name || ''}
                                        onChange={(e) => setMentorInfo(prev => ({ ...prev, full_name: e.target.value }))}
                                        className={theme.input}
                                        disabled={isLoading}
                                        placeholder="Tên hiển thị công khai"
                                    />
                                ) : (
                                    <div className={theme.viewBox}>
                                        {mentorInfo.full_name || 'Chưa cập nhật'}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className={`${theme.label} text-cyan-700`}>
                                    Email liên hệ <span className="text-red-500">*</span>
                                </label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={mentorInfo.email || ''}
                                        onChange={(e) => setMentorInfo(prev => ({ ...prev, email: e.target.value }))}
                                        className={theme.input}
                                        disabled={isLoading}
                                        placeholder="Email công khai để liên hệ"
                                    />
                                ) : (
                                    <div className={theme.viewBox}>
                                        {mentorInfo.email || 'Chưa cập nhật'}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className={`${theme.label} text-cyan-700`}>Số điện thoại</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={mentorInfo.phone_number || ''}
                                        onChange={(e) => setMentorInfo(prev => ({ ...prev, phone_number: e.target.value }))}
                                        className={theme.input}
                                        disabled={isLoading}
                                        placeholder="SĐT liên hệ công khai"
                                    />
                                ) : (
                                    <div className={theme.viewBox}>
                                        {mentorInfo.phone_number || 'Chưa cập nhật'}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className={`${theme.label} text-cyan-700`}>Tiêu đề chuyên môn</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={mentorInfo.headline || ''}
                                        onChange={(e) => setMentorInfo(prev => ({ ...prev, headline: e.target.value }))}
                                        className={theme.input}
                                        disabled={isLoading}
                                        placeholder="VD: Senior HR Manager tại ABC Company"
                                    />
                                ) : (
                                    <div className={theme.viewBox}>
                                        {mentorInfo.headline || 'Chưa cập nhật'}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className={`${theme.label} text-cyan-700`}>Mô tả về bản thân (Mentor)</label>
                                {isEditing ? (
                                    <textarea
                                        rows={4}
                                        value={mentorInfo.description || ''}
                                        onChange={(e) => setMentorInfo(prev => ({ ...prev, description: e.target.value }))}
                                        className={theme.textarea}
                                        disabled={isLoading}
                                        placeholder="Mô tả kinh nghiệm, chuyên môn và phương pháp hỗ trợ học viên..."
                                    />
                                ) : (
                                    <div className={`${theme.viewBox} min-h-[100px] whitespace-pre-wrap`}>
                                        {mentorInfo.description || 'Chưa cập nhật'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Skills Section - Mobile Optimized */}
                    <div className={`${theme.panel} from-green-50 to-emerald-50`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                            <h3 className={`font-semibold text-emerald-800 ${theme.header}`}>Kỹ năng</h3>

                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={() => setIsSkillPickerOpen(true)}
                                    className="w-full sm:w-auto px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition text-sm"
                                >
                                    Thêm kỹ năng
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {(mentorInfo.skills || []).map(s => (
                                <span
                                    key={s.id}
                                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600/10 text-emerald-800 px-3 py-1 text-xs sm:text-sm"
                                >
                                    {s.name}
                                    {isEditing && (
                                        <button
                                            onClick={() => removeSkill(s.id)}
                                            className="ml-1 rounded-full hover:bg-emerald-600/20 px-1"
                                            aria-label={`Remove ${s.name}`}
                                        >
                                            ×
                                        </button>
                                    )}
                                </span>
                            ))}
                            {(!mentorInfo.skills || mentorInfo.skills.length === 0) && (
                                <span className="text-xs sm:text-sm text-emerald-800/70">Chưa chọn kỹ năng nào</span>
                            )}
                        </div>

                        {/* Skill Picker Modal - Mobile Optimized */}
                        {isEditing && isSkillPickerOpen && (
                            <div className="mt-4 border border-emerald-200 bg-white rounded-xl shadow p-3 sm:p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                                    <div className="font-medium text-emerald-900 text-sm sm:text-base">
                                        Chọn kỹ năng (còn lại: {remainingSkills.length})
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={selectAllRemaining}
                                            className="text-xs sm:text-sm px-2 py-1 border rounded-lg hover:bg-emerald-50"
                                        >
                                            Chọn tất cả
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearTempSelection}
                                            className="text-xs sm:text-sm px-2 py-1 border rounded-lg hover:bg-emerald-50"
                                        >
                                            Bỏ chọn
                                        </button>
                                    </div>
                                </div>

                                <div className="max-h-48 sm:max-h-64 overflow-auto divide-y">
                                    {remainingSkills.length === 0 ? (
                                        <div className="text-xs sm:text-sm text-gray-500 py-4">Không còn kỹ năng nào để thêm.</div>
                                    ) : (
                                        remainingSkills.map(s => {
                                            const checked = tempSelectedSkillIds.has(s.id);
                                            return (
                                                <label
                                                    key={s.id}
                                                    className="flex items-start gap-3 py-2 cursor-pointer hover:bg-emerald-50/40 px-2 rounded-lg"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleSkillId(s.id)}
                                                        className="mt-1 w-4 h-4 text-emerald-600 rounded"
                                                    />
                                                    <div>
                                                        <div className="text-xs sm:text-sm font-medium text-gray-900">{s.name}</div>
                                                        {s.description && (
                                                            <div className="text-xs text-gray-500 line-clamp-2">{s.description}</div>
                                                        )}
                                                    </div>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setIsSkillPickerOpen(false); setTempSelectedSkillIds(new Set()); }}
                                        className="w-full sm:w-auto px-3 py-2 rounded-xl border hover:bg-gray-50 text-sm"
                                    >
                                        Đóng
                                    </button>
                                    <button
                                        type="button"
                                        onClick={applyAddSkills}
                                        className="w-full sm:w-auto px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
                                    >
                                        Thêm {tempSelectedSkillIds.size > 0 ? `(${tempSelectedSkillIds.size})` : ''}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Work Experiences Section - Mobile Optimized */}
                    <div className={`${theme.panel} from-blue-50 to-indigo-50`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                            <h3 className={`font-semibold text-indigo-800 flex items-center space-x-2 ${theme.header}`}>
                                <Building className="w-5 h-5" />
                                <span>Kinh nghiệm làm việc</span>
                            </h3>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={addWorkExperience}
                                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 text-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Thêm</span>
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {(mentorInfo.work_experiences || []).length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
                                    Chưa có kinh nghiệm làm việc
                                </div>
                            ) : (
                                (mentorInfo.work_experiences || []).map((exp, index) => (
                                    <div key={index} className="bg-white rounded-xl p-3 sm:p-4 border border-indigo-200">
                                        <div className="flex items-start space-x-3 sm:space-x-4">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gray-100">
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
                                                            <Building className="text-indigo-600 w-5 h-5 sm:w-6 sm:h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                {isEditing ? (
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <input
                                                                type="text"
                                                                placeholder="Công ty *"
                                                                value={exp.company}
                                                                onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                                                                className="px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Vị trí *"
                                                                value={exp.position}
                                                                onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                                                                className="px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                            />
                                                            <div>
                                                                <input
                                                                    type="date"
                                                                    value={exp.start_date || ''}
                                                                    onChange={(e) => updateWorkExperience(index, 'start_date', e.target.value)}
                                                                    className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                                    placeholder="Ngày bắt đầu"
                                                                />
                                                                <p className="text-xs text-gray-500 mt-1">Không bắt buộc</p>
                                                            </div>
                                                            <div>
                                                                <input
                                                                    type="date"
                                                                    value={exp.end_date || ''}
                                                                    onChange={(e) => updateWorkExperience(index, 'end_date', e.target.value)}
                                                                    className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                                    placeholder="Ngày kết thúc"
                                                                />
                                                                <p className="text-xs text-gray-500 mt-1">Không bắt buộc</p>
                                                            </div>
                                                        </div>
                                                        <textarea
                                                            placeholder="Mô tả công việc (mỗi dòng một mô tả)"
                                                            value={exp.description.join('\n')}
                                                            onChange={(e) => updateWorkExperience(index, 'description', e.target.value.split('\n').filter(d => d.trim()))}
                                                            rows={3}
                                                            className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                        />
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    id={`work-avatar-${index}`}
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            try {
                                                                                const imageUrl = await handleImageUpload(file, `work-${index}`);
                                                                                updateWorkExperience(index, 'avatar', imageUrl);
                                                                                showSuccess('Thành công', 'Ảnh công ty đã được cập nhật');
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
                                                                    className="cursor-pointer text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1 border border-indigo-300 rounded-lg hover:bg-indigo-50"
                                                                >
                                                                    {uploadingStates[`work-${index}`] ? (
                                                                        <div className="flex items-center space-x-1">
                                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
                                                                            <span>Đang tải...</span>
                                                                        </div>
                                                                    ) : (
                                                                        'Tải ảnh công ty'
                                                                    )}
                                                                </label>
                                                                <label className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={exp.published}
                                                                        onChange={(e) => updateWorkExperience(index, 'published', e.target.checked)}
                                                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                                    />
                                                                    <span className="text-xs sm:text-sm text-gray-700">Công khai</span>
                                                                </label>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeWorkExperience(index)}
                                                                className="text-red-600 hover:text-red-800 text-xs sm:text-sm flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded justify-center sm:justify-start"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex items-start justify-between">
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{exp.position}</h4>
                                                                <p className="text-indigo-600 font-medium text-sm truncate">{exp.company}</p>
                                                                <p className="text-xs sm:text-sm text-gray-500 flex items-center space-x-1 mt-1">
                                                                    <Calendar className="w-3 h-3 flex-shrink-0" />
                                                                    <span>{exp.start_date || 'Không rõ'} - {exp.end_date || 'Hiện tại'}</span>
                                                                </p>
                                                            </div>
                                                            {exp.published ? (
                                                                <Eye className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                            ) : (
                                                                <EyeOff className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        {exp.description && exp.description.length > 0 && (
                                                            <div className="mt-2 space-y-1">
                                                                {exp.description.map((desc, descIndex) => (
                                                                    <p key={descIndex} className="text-xs sm:text-sm text-gray-600">
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

                    {/* Education Section - Mobile Optimized */}
                    <div className={`${theme.panel} from-green-50 to-emerald-50`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                            <h3 className={`font-semibold text-emerald-800 flex items-center space-x-2 ${theme.header}`}>
                                <GraduationCap className="w-5 h-5" />
                                <span>Học vấn</span>
                            </h3>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={addEducation}
                                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-300 text-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Thêm</span>
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {(mentorInfo.educations || []).length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
                                    Chưa có thông tin học vấn
                                </div>
                            ) : (
                                (mentorInfo.educations || []).map((edu, index) => (
                                    <div key={index} className="bg-white rounded-xl p-3 sm:p-4 border border-emerald-200">
                                        <div className="flex items-start space-x-3 sm:space-x-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gray-100">
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
                                                            <GraduationCap className="text-emerald-600 w-5 h-5 sm:w-6 sm:h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                {isEditing ? (
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <input
                                                                type="text"
                                                                placeholder="Trường học *"
                                                                value={edu.school}
                                                                onChange={(e) => updateEducation(index, 'school', e.target.value)}
                                                                className="px-3 py-2 text-sm border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Bằng cấp *"
                                                                value={edu.degree}
                                                                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                                                className="px-3 py-2 text-sm border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                            />
                                                            <div>
                                                                <input
                                                                    type="date"
                                                                    value={edu.start_date || ''}
                                                                    onChange={(e) => updateEducation(index, 'start_date', e.target.value)}
                                                                    className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                                    placeholder="Ngày bắt đầu"
                                                                />
                                                                <p className="text-xs text-gray-500 mt-1">Không bắt buộc</p>
                                                            </div>
                                                            <div>
                                                                <input
                                                                    type="date"
                                                                    value={edu.end_date || ''}
                                                                    onChange={(e) => updateEducation(index, 'end_date', e.target.value)}
                                                                    className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                                    placeholder="Ngày kết thúc"
                                                                />
                                                                <p className="text-xs text-gray-500 mt-1">Không bắt buộc</p>
                                                            </div>
                                                        </div>
                                                        <textarea
                                                            placeholder="Mô tả học tập (mỗi dòng một mô tả)"
                                                            value={edu.description.join('\n')}
                                                            onChange={(e) => updateEducation(index, 'description', e.target.value.split('\n').filter(d => d.trim()))}
                                                            rows={3}
                                                            className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                        />
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                            <div className="flex flex-wrap items-center gap-3">
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
                                                                                showSuccess('Thành công', 'Ảnh trường học đã được cập nhật');
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
                                                                    className="cursor-pointer text-xs sm:text-sm text-emerald-600 hover:text-emerald-800 px-3 py-1 border border-emerald-300 rounded-lg hover:bg-emerald-50"
                                                                >
                                                                    {uploadingStates[`edu-${index}`] ? (
                                                                        <div className="flex items-center space-x-1">
                                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-600"></div>
                                                                            <span>Đang tải...</span>
                                                                        </div>
                                                                    ) : (
                                                                        'Tải ảnh trường'
                                                                    )}
                                                                </label>
                                                                <label className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={edu.published}
                                                                        onChange={(e) => updateEducation(index, 'published', e.target.checked)}
                                                                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                                                    />
                                                                    <span className="text-xs sm:text-sm text-gray-700">Công khai</span>
                                                                </label>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeEducation(index)}
                                                                className="text-red-600 hover:text-red-800 text-xs sm:text-sm flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded justify-center sm:justify-start"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex items-start justify-between">
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{edu.degree}</h4>
                                                                <p className="text-emerald-600 font-medium text-sm truncate">{edu.school}</p>
                                                                <p className="text-xs sm:text-sm text-gray-500 flex items-center space-x-1 mt-1">
                                                                    <Calendar className="w-3 h-3 flex-shrink-0" />
                                                                    <span>{edu.start_date || 'Không rõ'} - {edu.end_date || 'Hiện tại'}</span>
                                                                </p>
                                                            </div>
                                                            {edu.published ? (
                                                                <Eye className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                            ) : (
                                                                <EyeOff className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        {edu.description && edu.description.length > 0 && (
                                                            <div className="mt-2 space-y-1">
                                                                {edu.description.map((desc, descIndex) => (
                                                                    <p key={descIndex} className="text-xs sm:text-sm text-gray-600">
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

                    {/* Activities Section - Mobile Optimized */}
                    <div className={`${theme.panel} from-purple-50 to-violet-50`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                            <h3 className={`font-semibold text-violet-800 flex items-center space-x-2 ${theme.header}`}>
                                <Award className="w-5 h-5" />
                                <span>Hoạt động</span>
                            </h3>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={addActivity}
                                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all duration-300 text-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Thêm</span>
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {(mentorInfo.activities || []).length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
                                    Chưa có thông tin hoạt động
                                </div>
                            ) : (
                                (mentorInfo.activities || []).map((activity, index) => (
                                    <div key={index} className="bg-white rounded-xl p-3 sm:p-4 border border-violet-200">
                                        <div className="flex items-start space-x-3 sm:space-x-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gray-100">
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
                                                            <Award className="text-violet-600 w-5 h-5 sm:w-6 sm:h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                {isEditing ? (
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <input
                                                                type="text"
                                                                placeholder="Tên hoạt động *"
                                                                value={activity.activity_name}
                                                                onChange={(e) => updateActivity(index, 'activity_name', e.target.value)}
                                                                className="px-3 py-2 text-sm border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Tổ chức *"
                                                                value={activity.organization}
                                                                onChange={(e) => updateActivity(index, 'organization', e.target.value)}
                                                                className="px-3 py-2 text-sm border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Vai trò *"
                                                                value={activity.role}
                                                                onChange={(e) => updateActivity(index, 'role', e.target.value)}
                                                                className="px-3 py-2 text-sm border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none sm:col-span-2"
                                                            />
                                                            <div>
                                                                <input
                                                                    type="date"
                                                                    value={activity.start_date || ''}
                                                                    onChange={(e) => updateActivity(index, 'start_date', e.target.value)}
                                                                    className="w-full px-3 py-2 text-sm border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
                                                                    placeholder="Ngày bắt đầu"
                                                                />
                                                                <p className="text-xs text-gray-500 mt-1">Không bắt buộc</p>
                                                            </div>
                                                            <div>
                                                                <input
                                                                    type="date"
                                                                    value={activity.end_date || ''}
                                                                    onChange={(e) => updateActivity(index, 'end_date', e.target.value)}
                                                                    className="w-full px-3 py-2 text-sm border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
                                                                    placeholder="Ngày kết thúc"
                                                                />
                                                                <p className="text-xs text-gray-500 mt-1">Không bắt buộc</p>
                                                            </div>
                                                        </div>
                                                        <textarea
                                                            placeholder="Mô tả hoạt động (mỗi dòng một mô tả)"
                                                            value={activity.description.join('\n')}
                                                            onChange={(e) => updateActivity(index, 'description', e.target.value.split('\n').filter(d => d.trim()))}
                                                            rows={3}
                                                            className="w-full px-3 py-2 text-sm border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
                                                        />
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                            <div className="flex flex-wrap items-center gap-3">
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
                                                                                showSuccess('Thành công', 'Ảnh hoạt động đã được cập nhật');
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
                                                                    className="cursor-pointer text-xs sm:text-sm text-violet-600 hover:text-violet-800 px-3 py-1 border border-violet-300 rounded-lg hover:bg-violet-50"
                                                                >
                                                                    {uploadingStates[`activity-${index}`] ? (
                                                                        <div className="flex items-center space-x-1">
                                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-violet-600"></div>
                                                                            <span>Đang tải...</span>
                                                                        </div>
                                                                    ) : (
                                                                        'Tải ảnh hoạt động'
                                                                    )}
                                                                </label>
                                                                <label className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={activity.published}
                                                                        onChange={(e) => updateActivity(index, 'published', e.target.checked)}
                                                                        className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                                                                    />
                                                                    <span className="text-xs sm:text-sm text-gray-700">Công khai</span>
                                                                </label>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeActivity(index)}
                                                                className="text-red-600 hover:text-red-800 text-xs sm:text-sm flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded justify-center sm:justify-start"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex items-start justify-between">
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{activity.activity_name}</h4>
                                                                <p className="text-violet-600 font-medium text-sm truncate">
                                                                    {activity.role} tại {activity.organization}
                                                                </p>
                                                                <p className="text-xs sm:text-sm text-gray-500 flex items-center space-x-1 mt-1">
                                                                    <Calendar className="w-3 h-3 flex-shrink-0" />
                                                                    <span>{activity.start_date || 'Không rõ'} - {activity.end_date || 'Hiện tại'}</span>
                                                                </p>
                                                            </div>
                                                            {activity.published ? (
                                                                <Eye className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                            ) : (
                                                                <EyeOff className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        {activity.description && activity.description.length > 0 && (
                                                            <div className="mt-2 space-y-1">
                                                                {activity.description.map((desc, descIndex) => (
                                                                    <p key={descIndex} className="text-xs sm:text-sm text-gray-600">
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

                    {/* Publish Status - Mobile Optimized */}
                    <div className={`${theme.panel} from-amber-50 to-orange-50`}>
                        <h3 className={`font-semibold text-amber-800 mb-4 sm:mb-6 ${theme.header}`}>Trạng thái hiển thị</h3>

                        {isEditing ? (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="published"
                                        checked={mentorInfo.published === true}
                                        onChange={() => setMentorInfo(prev => ({ ...prev, published: true }))}
                                        disabled={isLoading}
                                        className="text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className="text-xs sm:text-sm">Công khai (hiển thị trong danh sách mentor)</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="published"
                                        checked={mentorInfo.published === false}
                                        onChange={() => setMentorInfo(prev => ({ ...prev, published: false }))}
                                        disabled={isLoading}
                                        className="text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className="text-xs sm:text-sm">Ẩn (không hiển thị công khai)</span>
                                </label>
                            </div>
                        ) : (
                            <div className={theme.viewBox}>
                                <span className={`px-3 py-2 rounded-full text-xs sm:text-sm font-medium ${
                                    mentorInfo.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {mentorInfo.published ? 'Công khai - Hiển thị trong danh sách mentor' : 'Ẩn - Không hiển thị công khai'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons - Mobile Optimized */}
                    {isEditing && (
                        <div className="flex flex-col-reverse sm:flex-row justify-end space-y-reverse space-y-4 sm:space-y-0 sm:space-x-4 pt-6">
                            <button
                                onClick={onCancel}
                                className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all duration-300 text-sm sm:text-base"
                                disabled={isLoading}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={onSave}
                                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 text-sm sm:text-base"
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
                <div className="text-center py-12 px-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Profile Mentor chưa được thiết lập</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
                        Bạn đã có quyền mentor nhưng profile mentor chưa được tạo trong hệ thống.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 max-w-md mx-auto">
                        <p className="text-amber-800 text-xs sm:text-sm text-left">
                            <strong>Lưu ý:</strong> Admin cần tạo profile mentor cho bạn trong hệ thống trước khi bạn có thể chỉnh sửa thông tin.
                        </p>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">
                        Vui lòng liên hệ admin để được hỗ trợ thiết lập profile mentor.
                    </p>
                </div>
            ) : (
                // User thường - registration flow với policy
                <div className="max-w-2xl mx-auto px-4">
                    {!hasRegistration ? (
                        <>
                            {/* Step 1: Initial - Show Register Button */}
                            {registrationStep === 'initial' && (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                                        <UserPlus className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Trở thành Mentor</h3>
                                    <p className="text-sm sm:text-base text-gray-600 mb-8 max-w-md mx-auto">
                                        Chia sẻ kinh nghiệm và hướng dẫn những người mới bắt đầu trong lĩnh vực HR.
                                        Cùng phát triển cộng đồng nhân sự Việt Nam.
                                    </p>

                                    {/* Benefits Preview */}
                                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 sm:p-6 mb-8 text-left">
                                        <h4 className="text-emerald-800 font-semibold mb-4 flex items-center text-sm sm:text-base">
                                            <GraduationCap className="w-5 h-5 mr-2" />
                                            Quyền lợi khi trở thành Mentor:
                                        </h4>
                                        <ul className="text-emerald-700 text-xs sm:text-sm space-y-2">
                                            <li className="flex items-start">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                                Tham gia giao lưu, chia sẻ với cộng đồng nhân sự quy mô lớn
                                            </li>
                                            <li className="flex items-start">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                                Được đào tạo chuyên môn để nâng cao kiến thức và kỹ năng
                                            </li>
                                            <li className="flex items-start">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                                Kết nối với các chuyên gia Nhân sự giỏi trong cộng đồng
                                            </li>
                                            <li className="flex items-start">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                                Tham gia sự kiện, hội thảo chuyên ngành và phát triển bản thân
                                            </li>
                                        </ul>
                                    </div>

                                    <button
                                        onClick={() => setRegistrationStep('policy')}
                                        className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                                    >
                                        Đăng ký trở thành Mentor
                                    </button>
                                </div>
                            )}

                            {/* Step 2: Policy Agreement */}
                            {registrationStep === 'policy' && (
                                <div className="py-12">
                                    <div className="text-center mb-8">
                                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                                            Chính sách và Quy định dành cho Mentor
                                        </h3>
                                        <p className="text-sm sm:text-base text-gray-600">
                                            Vui lòng đọc kỹ và đồng ý với các điều khoản trước khi tiếp tục
                                        </p>
                                    </div>

                                    {/* Policy Content - Mobile Optimized */}
                                    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6 mb-6 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                                        <div className="prose prose-sm max-w-none text-xs sm:text-sm">
                                            <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4">1. Định nghĩa</h4>
                                            <p className="text-gray-700 mb-4">
                                                Mentor là những người làm công tác Nhân sự tại các đơn vị, tổ chức doanh nghiệp đã có kinh nghiệm trong lĩnh vực Nhân sự nói chung và công tác tuyển dụng nói riêng. Mentor tham gia các dự án trên tinh thần tình nguyện và tự nguyện, không bao gồm các công việc được giao trong hợp đồng lao động chính thức.
                                            </p>

                                            <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 mt-6">2. Quyền lợi và Nghĩa vụ</h4>

                                            <h5 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">2.1. Quyền lợi của Mentor</h5>
                                            <p className="text-gray-700 mb-2">Khi trở thành Mentor của HR Companion, bạn sẽ có các quyền lợi sau:</p>
                                            <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-gray-700 mb-4">
                                                <li>Được tham gia giao lưu, chia sẻ kiến thức, kỹ năng chuyên môn cùng cộng đồng nhân sự với quy mô lớn.</li>
                                                <li>Được tham gia các chương trình đào tạo chuyên môn của HR Companion để nâng cao kiến thức và kỹ năng.</li>
                                                <li>Có cơ hội được kết nối với những chuyên gia Nhân sự giỏi trong cộng đồng.</li>
                                                <li>Được tham gia vào các sự kiện, khóa học, hội thảo, buổi chia sẻ kiến thức chuyên ngành, phát triển bản thân và mở rộng quan hệ.</li>
                                                <li>Được nhận các khoản thưởng, tri ân do HR Companion quy định (nếu có).</li>
                                                <li>Doanh nghiệp của Mentor đang làm việc được hỗ trợ tạo điều kiện để kết nối, phát triển thương hiệu tuyển dụng trong khuôn khổ các chương trình hoạt động của HR Companion và các đơn vị đối tác.</li>
                                            </ul>

                                            <h5 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">2.2. Nghĩa vụ và Cam kết của Mentor</h5>
                                            <p className="text-gray-700 mb-2">Mentor có trách nhiệm thực hiện các nghĩa vụ sau:</p>
                                            <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-gray-700 mb-4">
                                                <li><strong>Tham gia và đóng góp:</strong> Tham gia các hoạt động đã cam kết và đóng góp cho các hoạt động phát triển chất lượng đội ngũ Mentor và Trợ lý dự án một cách phối hợp và chuyên nghiệp.</li>
                                                <li><strong>Chia sẻ chuyên môn:</strong> Tích cực chia sẻ kiến thức, kỹ năng, hỗ trợ tư vấn các vấn đề liên quan đến Nhân sự theo quy định của chương trình.</li>
                                                <li><strong>Cam kết Bảo mật:</strong> Cam kết bảo mật tuyệt đối mọi thông tin, tài liệu, dữ liệu và tài sản sở hữu trí tuệ của HR Companion trong suốt quá trình hợp tác và sau khi chấm dứt hợp tác.</li>
                                                <li><strong>Duy trì Uy tín & Hình ảnh:</strong> Đảm bảo giữ gìn hình ảnh, uy tín cá nhân không làm ảnh hưởng tiêu cực đến uy tín và thương hiệu của HR Companion.</li>
                                                <li><strong>Quy tắc tham gia sự kiện:</strong> Khi tham gia các sự kiện, hoạt động Đào tạo, Workshop về Kỹ năng ứng tuyển, Mentor có nghĩa vụ thông báo và trao đổi thông tin với Trợ lý của HR Companion. Đồng thời, Mentor cần Sử dụng danh xưng Mentor/Cố vấn chuyên môn tại HR Companion tại sự kiện đó.</li>
                                            </ul>

                                            <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 mt-6">3. Điều Khoản Chung</h4>
                                            <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-gray-700 mb-4">
                                                <li><strong>Chấp thuận:</strong> Khi đăng ký trở thành Mentor và chấp nhận Chính sách này, bạn đồng ý với tất cả các điều khoản, quy định và nghĩa vụ được nêu trên cùng các quy định đã được Ban điều hành HR Companion ban hành.</li>
                                                <li><strong>Điều chỉnh:</strong> Quy định này có hiệu lực kể từ ngày ký và có thể được Ban Điều hành HR Companion điều chỉnh, bổ sung khi cần thiết. Mọi thay đổi sẽ được thông báo đến Mentor.</li>
                                                <li><strong>Giải quyết tranh chấp:</strong> Mọi tranh chấp, vướng mắc phát sinh (nếu có) sẽ được Ban Điều hành, Mentor và Trợ lý dự án cùng thảo luận, phối hợp giải quyết trên tinh thần thiện chí và tuân thủ quy định pháp luật.</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Agreement Checkbox - Mobile Optimized */}
                                    <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 mb-6">
                                        <label className="flex items-start cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={agreedToPolicy}
                                                onChange={(e) => setAgreedToPolicy(e.target.checked)}
                                                className="mt-1 w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 flex-shrink-0"
                                            />
                                            <span className="ml-3 text-xs sm:text-sm text-gray-700">
                                                <strong className="text-emerald-800">Tôi đã đọc kỹ, hiểu rõ và đồng ý với toàn bộ Chính sách và Quy định dành cho Mentor của HR Companion.</strong>
                                            </span>
                                        </label>
                                    </div>

                                    {/* Action Buttons - Mobile Optimized */}
                                    <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3">
                                        <button
                                            onClick={() => {
                                                setRegistrationStep('initial');
                                                setAgreedToPolicy(false);
                                            }}
                                            className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-300 text-sm sm:text-base"
                                        >
                                            Quay lại
                                        </button>
                                        <button
                                            onClick={() => setRegistrationStep('form')}
                                            disabled={!agreedToPolicy}
                                            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 text-sm sm:text-base"
                                        >
                                            <span>Tiếp tục</span>
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Registration Form */}
                            {registrationStep === 'form' && (
                                <div className="py-12">
                                    <div className="text-center mb-8">
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                                            <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Thông tin đăng ký</h3>
                                        <p className="text-sm sm:text-base text-gray-600">
                                            Vui lòng cung cấp thông tin để chúng tôi đánh giá hồ sơ của bạn
                                        </p>
                                    </div>

                                    {/* Error Message */}
                                    {registrationError && (
                                        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
                                            <div className="flex items-center">
                                                <X className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                                                <span className="text-xs sm:text-sm text-red-700">{registrationError}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {/* Email */}
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-3">
                                                <Mail className="w-4 h-4 inline mr-2" />
                                                Email liên hệ <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                disabled={registrationData.isSubmitting}
                                                className="w-full px-3 py-3 sm:px-4 text-sm sm:text-base border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                placeholder="email@example.com"
                                                value={registrationData.email}
                                                onChange={(e) => setRegistrationData(prev => ({
                                                    ...prev,
                                                    email: e.target.value
                                                }))}
                                            />
                                            <p className="mt-2 text-xs text-gray-500">
                                                Chúng tôi sẽ sử dụng email này để liên hệ về việc đăng ký mentor
                                            </p>
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-3">
                                                <Phone className="w-4 h-4 inline mr-2" />
                                                Số điện thoại <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                required
                                                disabled={registrationData.isSubmitting}
                                                className="w-full px-3 py-3 sm:px-4 text-sm sm:text-base border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                placeholder="0901234567"
                                                value={registrationData.phone}
                                                onChange={(e) => setRegistrationData(prev => ({
                                                    ...prev,
                                                    phone: e.target.value
                                                }))}
                                            />
                                            <p className="mt-2 text-xs text-gray-500">
                                                Số điện thoại để chúng tôi có thể liên hệ trực tiếp khi cần thiết
                                            </p>
                                        </div>

                                        {/* Notes */}
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-3">
                                                <FileText className="w-4 h-4 inline mr-2" />
                                                Chia sẻ về bản thân <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                required
                                                disabled={registrationData.isSubmitting}
                                                rows={6}
                                                className="w-full px-3 py-3 sm:px-4 text-sm sm:text-base border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                                placeholder={`Chia sẻ về:
• Kinh nghiệm chuyên môn trong lĩnh vực HR
• Lý do muốn trở thành mentor
• Kỹ năng và chuyên môn mà bạn có thể hướng dẫn
• Thời gian có thể dành cho mentoring
• Thông tin liên hệ khác (LinkedIn, v.v.)
• Ghi chú hoặc thông tin khác...`}
                                                value={registrationData.notes}
                                                onChange={(e) => setRegistrationData(prev => ({
                                                    ...prev,
                                                    notes: e.target.value
                                                }))}
                                                maxLength={1000}
                                            />
                                            <div className="mt-2 flex justify-between items-center">
                                                <span className="text-xs text-gray-500">
                                                    Tối thiểu 100 ký tự để gửi đăng ký
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {registrationData.notes.length}/1000 ký tự
                                                </span>
                                            </div>
                                        </div>

                                        {/* Requirements Box - Mobile Optimized */}
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-6">
                                            <h4 className="text-emerald-800 font-semibold mb-3 flex items-center text-sm sm:text-base">
                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                Yêu cầu trở thành Mentor:
                                            </h4>
                                            <ul className="text-emerald-700 text-xs sm:text-sm space-y-2">
                                                <li className="flex items-start">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                                    Có kinh nghiệm chuyên môn ít nhất 2 năm trong lĩnh vực HR
                                                </li>
                                                <li className="flex items-start">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                                    Có kỹ năng giao tiếp và chia sẻ kiến thức tốt
                                                </li>
                                                <li className="flex items-start">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                                    Cam kết hỗ trợ và hướng dẫn học viên
                                                </li>
                                                <li className="flex items-start">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                                    Có thái độ tích cực và sẵn sàng chia sẻ
                                                </li>
                                            </ul>
                                        </div>

                                        {/* Action Buttons - Mobile Optimized */}
                                        <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4">
                                            <button
                                                onClick={() => {
                                                    setRegistrationStep('policy');
                                                    setRegistrationError('');
                                                }}
                                                disabled={registrationData.isSubmitting}
                                                className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-300 disabled:opacity-50 text-sm sm:text-base"
                                            >
                                                Quay lại
                                            </button>
                                            <button
                                                onClick={handleSubmitRegistration}
                                                disabled={registrationData.isSubmitting ||
                                                    !registrationData.email.trim() ||
                                                    !registrationData.phone.trim() ||
                                                    registrationData.notes.trim().length < 100}
                                                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 text-sm sm:text-base"
                                            >
                                                {registrationData.isSubmitting ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                        <span>Đang gửi...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus className="w-5 h-5" />
                                                        <span>Gửi đăng ký</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Info - Mobile Optimized */}
                                        <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                            <div className="flex items-start gap-3">
                                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-white text-xs font-bold">ℹ</span>
                                                </div>
                                                <div className="text-xs sm:text-sm">
                                                    <p className="text-blue-700 leading-relaxed">
                                                        Chúng tôi sẽ xem xét hồ sơ và phản hồi qua email trong 3-5 ngày làm việc.
                                                        Bạn sẽ nhận được thông báo chi tiết về kết quả đăng ký.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        // Hiển thị trạng thái đăng ký - Mobile Optimized
                        <div className="text-center py-12 px-4">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-gradient-to-r rounded-full flex items-center justify-center">
                                {registrationStatus === 'pending' && (
                                    <div className="bg-gradient-to-r from-amber-100 to-orange-100 w-full h-full rounded-full flex items-center justify-center">
                                        <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600" />
                                    </div>
                                )}
                                {registrationStatus === 'approved' && (
                                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 w-full h-full rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
                                    </div>
                                )}
                                {registrationStatus === 'rejected' && (
                                    <div className="bg-gradient-to-r from-red-100 to-pink-100 w-full h-full rounded-full flex items-center justify-center">
                                        <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600" />
                                    </div>
                                )}
                            </div>

                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                                {registrationStatus === 'pending' && 'Đăng ký đang chờ duyệt'}
                                {registrationStatus === 'approved' && 'Đăng ký đã được phê duyệt'}
                                {registrationStatus === 'rejected' && 'Đăng ký bị từ chối'}
                            </h3>

                            <div className={`p-4 sm:p-6 rounded-xl mb-6 max-w-md mx-auto ${
                                registrationStatus === 'pending' ? 'bg-amber-50 border border-amber-200' :
                                    registrationStatus === 'approved' ? 'bg-green-50 border border-green-200' :
                                        'bg-red-50 border border-red-200'
                            }`}>
                                <p className={`text-xs sm:text-sm text-left ${
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
                                            setRegistrationData({
                                                email: user?.email || '',
                                                phone: user?.profile?.phone_number || '',
                                                notes: '',
                                                isSubmitting: false
                                            });
                                        }}
                                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                                    >
                                        Đăng ký lại
                                    </button>
                                    <p className="text-xs sm:text-sm text-gray-500">
                                        Bạn có thể đăng ký lại sau khi cải thiện hồ sơ theo góp ý của admin
                                    </p>
                                </div>
                            )}

                            {(registrationStatus === 'pending' || registrationStatus === 'approved') && (
                                <button
                                    onClick={() => window.location.href = 'mailto:admin@yoursite.com?subject=Hỗ trợ đăng ký Mentor'}
                                    className="text-gray-600 hover:text-gray-800 text-xs sm:text-sm underline"
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