'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, GraduationCap } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Notification from '@/component/Notification';
import { useNotificationWithUtils } from '@/hooks/useNotification';
import { supabase } from '@/utils/supabase/client';

import type {
    TabType,
    PersonalInfo,
    SubProfileInfo,
    MentorInfo,
    PasswordData,
    ShowPasswords,
    UniversityMajor
} from '@/types/profile_user';

import CombinedProfileTab from '@/component/profile/CombinedProfileTab';
import MentorTab from '@/component/profile/MentorTab';
import PasswordTab from '@/component/profile/PasswordTab';

const AccountSettings: React.FC = () => {
    const { user, setUser } = useAuthStore();

    const {
        notifications,
        removeNotification,
        showSuccess,
        showError
    } = useNotificationWithUtils();

    // State
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Personal info state
    const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
        name: '',
        email: '',
        avatar: '',
        gender: '',
        birthdate: '',
        phone_number: ''
    });

    // SubProfile state
    const [subProfileInfo, setSubProfileInfo] = useState<SubProfileInfo>({
        university_major_id: '',
        cv: '',
        linkedin_url: '',
        github_url: '',
        portfolio_url: '',
        description: ''
    });

    // Mentor info state
    const [mentorInfo, setMentorInfo] = useState<MentorInfo>({
        full_name: '',
        email: '',
        avatar: '',
        phone_number: '',
        headline: '',
        description: '',
        skills: [],
        published: false,
        work_experiences: [],
        educations: [],
        activities: []
    });

    // Password state
    const [passwordData, setPasswordData] = useState<PasswordData>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPasswords, setShowPasswords] = useState<ShowPasswords>({
        current: false,
        new: false,
        confirm: false
    });

    // Additional states
    const [previewAvatar, setPreviewAvatar] = useState<string>('');
    const [uploading, setUploading] = useState<boolean>(false);
    const [universityMajors, setUniversityMajors] = useState<UniversityMajor[]>([]);
    const [hasSubProfile, setHasSubProfile] = useState<boolean>(false);
    const [hasMentorProfile, setHasMentorProfile] = useState<boolean>(false);
    const [mentorId, setMentorId] = useState<string>('');

    // Load initial data
    useEffect(() => {
        if (user) {
            // Load personal info
            setPersonalInfo({
                name: user.profile?.full_name || '',
                email: user.email || '',
                avatar: user.profile?.image_url || '',
                gender: user.profile?.gender || '',
                birthdate: user.profile?.birthdate || '',
                phone_number: user.profile?.phone_number || ''
            });

            // Load additional data
            loadUniversityMajors();
            loadSubProfile();

            if (user.role === 'mentor') {
                loadMentorInfo();
            }
        }
    }, [user]);

    // Load university majors
    const loadUniversityMajors = async () => {
        try {
            // First try with explicit joins
            const { data, error } = await supabase
                .from('university_majors')
                .select(`
          id,
          university_id,
          major_id,
          universities!university_majors_university_id_fkey(
            id,
            name,
            code
          ),
          majors!university_majors_major_id_fkey(
            id,
            name
          )
        `);

            if (error) {
                console.error('Primary query failed:', error);

                // Fallback: Load data separately
                const [universitiesResult, majorsResult, universityMajorsResult] = await Promise.all([
                    supabase.from('universities').select('id, name, code'),
                    supabase.from('majors').select('id, name'),
                    supabase.from('university_majors').select('id, university_id, major_id')
                ]);

                if (universitiesResult.error || majorsResult.error || universityMajorsResult.error) {
                    throw new Error('Failed to load fallback data');
                }

                // Manually join the data
                const combinedData = universityMajorsResult.data?.map(um => ({
                    id: um.id,
                    university_id: um.university_id,
                    major_id: um.major_id,
                    university: universitiesResult.data?.find(u => u.id === um.university_id) || { name: 'Unknown', code: '' },
                    major: majorsResult.data?.find(m => m.id === um.major_id) || { name: 'Unknown' }
                })) || [];

                setUniversityMajors(combinedData);
                return;
            }

            // Transform data to expected format
            const transformedData = (data ?? []).map((item: any) => {
                const uni = Array.isArray(item.universities) ? item.universities[0] : item.universities;
                const maj = Array.isArray(item.majors) ? item.majors[0] : item.majors;

                return {
                    id: item.id,
                    university_id: item.university_id,
                    major_id: item.major_id,
                    university: {
                        name: uni?.name ?? 'Unknown University',
                        code: uni?.code ?? ''
                    },
                    major: {
                        name: maj?.name ?? 'Unknown Major'
                    }
                } as UniversityMajor & { university_id?: string; major_id?: string };
            });

            setUniversityMajors(transformedData);
        } catch (error) {
            console.error('Error loading university majors:', error);
            setUniversityMajors([]);
            showError('Lỗi tải dữ liệu', 'Không thể tải danh sách trường và ngành học. Vui lòng thử lại sau.');
        }
    };

    // Load sub profile
    const loadSubProfile = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('sub_profiles')
                .select('*')
                .eq('profile_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setHasSubProfile(true);
                setSubProfileInfo({
                    university_major_id: data.university_major_id || '',
                    cv: data.cv || '',
                    linkedin_url: data.linkedin_url || '',
                    github_url: data.github_url || '',
                    portfolio_url: data.portfolio_url || '',
                    description: data.description || ''
                });
            }
        } catch (error) {
            console.error('Error loading sub profile:', error);
        }
    };

    // Load mentor info
    const loadMentorInfo = async () => {
        if (!user) {
            console.log('❌ No user found');
            return;
        }

        console.log('🔄 Loading mentor info for user:', user.id, 'role:', user.role);

        try {
            // Sử dụng RPC function thay vì query trực tiếp
            const { data: mentorId, error: mentorIdError } = await supabase
                .rpc('get_current_user_mentor_id');

            console.log('📋 Mentor ID result:', { mentorId, mentorIdError });

            if (mentorIdError) {
                console.error('❌ Error getting mentor ID:', mentorIdError);
                setHasMentorProfile(false);
                return;
            }

            if (!mentorId) {
                console.log('ℹ️ No mentor found for user');
                setHasMentorProfile(false);
                return;
            }

            console.log('✅ Found mentor ID:', mentorId);
            setHasMentorProfile(true);
            setMentorId(mentorId);

            const { data: skillRels, error: relErr } = await supabase
                .from('mentor_skill_relations')
                .select('skill_id, mentor_skills:skill_id(id,name,description)')
                .eq('mentor_id', mentorId);
            if (relErr) {
                console.error('❌ Error loading mentor skills:', relErr);
            }
            const skills: any[] = (skillRels || [])
                .map((r: any) => r.mentor_skills)
                .filter(Boolean);

            // Lấy thông tin mentor đầy đủ bao gồm work experiences, educations, activities
            const { data: mentorData, error: mentorError } = await supabase
                .from('mentors')
                .select(`
        *,
        mentor_work_experiences (*),
        mentor_educations (*),
        mentor_activities (*)
      `)
                .eq('id', mentorId)
                .single();

            console.log('👨‍🏫 Mentor data query result:', { mentorData, mentorError });

            if (mentorError) {
                console.error('❌ Error fetching mentor data:', mentorError);
                throw mentorError;
            }

            if (mentorData) {
                console.log('✅ Complete mentor info loaded:', mentorData);
                setMentorInfo({
                    // Basic info
                    full_name: mentorData.full_name || '',
                    email: mentorData.email || '',
                    avatar: mentorData.avatar || '',
                    phone_number: mentorData.phone_number || '',
                    headline: mentorData.headline || '',
                    description: mentorData.description || '',
                    published: mentorData.published || false,
                    skills,
                    // Related data
                    work_experiences: mentorData.mentor_work_experiences || [],
                    educations: mentorData.mentor_educations || [],
                    activities: mentorData.mentor_activities || []
                });
            }
        } catch (error) {
            console.error('❌ Error loading mentor info:', error);
            setHasMentorProfile(false);
            showError('Lỗi', 'Không thể tải thông tin mentor');
        }
    };

    // Upload image
    const uploadImage = async (file: File): Promise<string> => {
        if (!user) throw new Error('User not authenticated');

        const fileExt = file.name.split('.').pop();
        const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { data, error } = await supabase.storage
            .from('images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

        return urlData.publicUrl;
    };

    // Handle avatar upload
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showError('Lỗi tải file', 'Kích thước file không được vượt quá 5MB!');
            return;
        }

        if (!file.type.startsWith('image/')) {
            showError('Lỗi định dạng', 'Vui lòng chọn file ảnh!');
            return;
        }

        try {
            setUploading(true);

            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewAvatar(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            const imageUrl = await uploadImage(file);
            setPersonalInfo(prev => ({ ...prev, avatar: imageUrl }));

            showSuccess('Thành công', 'Ảnh đã được tải lên thành công!');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            showError('Lỗi upload', 'Không thể tải ảnh lên. Vui lòng thử lại.');
            setPreviewAvatar('');
        } finally {
            setUploading(false);
        }
    };

    // Handle remove avatar
    const handleRemoveAvatar = () => {
        setPreviewAvatar('');
        setPersonalInfo(prev => ({ ...prev, avatar: '' }));
    };

    // ✅ UNIFIED SAVE FUNCTION
    const handleSaveProfile = async () => {
        if (!user) {
            showError('Lỗi', 'Vui lòng đăng nhập lại!');
            return;
        }

        if (!personalInfo.name.trim()) {
            showError('Lỗi validation', 'Vui lòng nhập họ và tên!');
            return;
        }

        try {
            setIsLoading(true);
            console.log('🔄 Saving profile data...');

            // 1. Save Personal Info
            const profileData = {
                id: user.id,
                full_name: personalInfo.name.trim(),
                image_url: personalInfo.avatar || null,
                gender: personalInfo.gender || null,
                birthdate: personalInfo.birthdate || null,
                phone_number: personalInfo.phone_number || null,
                updated_at: new Date().toISOString()
            };

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert(profileData);

            if (profileError) {
                throw new Error(`Profile update failed: ${profileError.message}`);
            }

            console.log('✅ Personal info saved');

            // 2. Save Sub Profile (if has data)
            if (subProfileInfo.university_major_id ||
                subProfileInfo.cv?.trim() ||
                subProfileInfo.linkedin_url?.trim() ||
                subProfileInfo.github_url?.trim() ||
                subProfileInfo.portfolio_url?.trim() ||
                subProfileInfo.description?.trim()) {

                const subProfileData = {
                    university_major_id: subProfileInfo.university_major_id || null,
                    cv: subProfileInfo.cv?.trim() || null,
                    linkedin_url: subProfileInfo.linkedin_url?.trim() || null,
                    github_url: subProfileInfo.github_url?.trim() || null,
                    portfolio_url: subProfileInfo.portfolio_url?.trim() || null,
                    description: subProfileInfo.description?.trim() || null,
                    updated_at: new Date().toISOString()
                };

                if (hasSubProfile) {
                    const { error } = await supabase
                        .from('sub_profiles')
                        .update(subProfileData)
                        .eq('profile_id', user.id);
                    if (error) throw new Error(`Sub profile update failed: ${error.message}`);
                    console.log('✅ Sub profile updated');
                } else {
                    const { error } = await supabase
                        .from('sub_profiles')
                        .insert({ profile_id: user.id, ...subProfileData });
                    if (error) throw new Error(`Sub profile creation failed: ${error.message}`);
                    setHasSubProfile(true);
                    console.log('✅ Sub profile created');
                }
            }

            // 3. Update user store
            setUser({
                ...user,
                profile: {
                    ...user.profile,
                    id: user.id,
                    full_name: personalInfo.name.trim(),
                    image_url: personalInfo.avatar,
                    gender: personalInfo.gender as any,
                    birthdate: personalInfo.birthdate,
                    phone_number: personalInfo.phone_number,
                    updated_at: new Date().toISOString(),
                    created_at: user.profile?.created_at || new Date().toISOString()
                }
            });

            // 4. Success
            showSuccess('Thành công', 'Thông tin đã được cập nhật!');
            setPreviewAvatar('');
            setIsEditing(false);
            console.log('✅ Profile save completed, exiting edit mode');

        } catch (error: any) {
            console.error('❌ Error saving profile:', error);
            showError('Lỗi', error?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle save mentor info
    const handleSaveMentorInfo = async () => {
        if (!user || !mentorId) {
            showError('Lỗi', 'Không tìm thấy thông tin mentor!');
            return;
        }

        try {
            setIsLoading(true);

            console.log('🔄 Saving complete mentor info:', mentorInfo);

            // 1. Lưu thông tin cơ bản của mentor
            const mentorUpdateData = {
                full_name: mentorInfo.full_name?.trim() || null,
                email: mentorInfo.email?.trim() || null,
                avatar: mentorInfo.avatar || null,
                phone_number: mentorInfo.phone_number?.trim() || null,
                headline: mentorInfo.headline?.trim() || null,
                description: mentorInfo.description?.trim() || null,
                published: mentorInfo.published,
                updated_at: new Date().toISOString()
            };

            console.log('📝 Updating mentor basic info:', mentorUpdateData);

            const { error: mentorError } = await supabase
                .from('mentors')
                .update(mentorUpdateData)
                .eq('id', mentorId);

            if (mentorError) {
                console.error('❌ Error updating mentor:', mentorError);
                throw mentorError;
            }

            console.log('✅ Mentor basic info updated');

            {
                // delete old relations
                const { error: delRelErr } = await supabase
                    .from('mentor_skill_relations')
                    .delete()
                    .eq('mentor_id', mentorId);
                if (delRelErr) {
                    console.error('❌ Error deleting old mentor_skill_relations:', delRelErr);
                    throw delRelErr;
                }

                // insert new relations
                const selected = mentorInfo.skills || [];
                if (selected.length > 0) {
                    const rows = selected.map(s => ({
                        mentor_id: mentorId,
                        skill_id: s.id
                    }));
                    const { error: insRelErr } = await supabase
                        .from('mentor_skill_relations')
                        .insert(rows);
                    if (insRelErr) {
                        console.error('❌ Error inserting mentor_skill_relations:', insRelErr);
                        throw insRelErr;
                    }
                }
            }

            // 2. Lưu Work Experiences -
            if (mentorInfo.work_experiences && mentorInfo.work_experiences.length > 0) {
                console.log('🔄 Saving work experiences:', mentorInfo.work_experiences);

                // Xóa tất cả work experiences cũ
                const { error: deleteWorkError } = await supabase
                    .from('mentor_work_experiences')
                    .delete()
                    .eq('mentor_id', mentorId);

                if (deleteWorkError) {
                    console.error('❌ Error deleting old work experiences:', deleteWorkError);
                }

                // Thêm work experiences mới - CHỈ YÊU CẦU company và position
                const workExperiencesToInsert = mentorInfo.work_experiences
                    .filter(exp => exp.company?.trim() && exp.position?.trim())
                    .map(exp => ({
                        mentor_id: mentorId,
                        avatar: exp.avatar || null,
                        company: exp.company.trim(),
                        position: exp.position.trim(),
                        start_date: exp.start_date || null, // Cho phép null
                        end_date: exp.end_date || null,     // Cho phép null
                        description: exp.description || [],
                        published: exp.published
                    }));

                if (workExperiencesToInsert.length > 0) {
                    const { error: insertWorkError } = await supabase
                        .from('mentor_work_experiences')
                        .insert(workExperiencesToInsert);

                    if (insertWorkError) {
                        console.error('❌ Error inserting work experiences:', insertWorkError);
                        throw insertWorkError;
                    }
                    console.log('✅ Work experiences saved');
                }
            }

            // 3. Lưu Education
            if (mentorInfo.educations && mentorInfo.educations.length > 0) {
                console.log('🔄 Saving educations:', mentorInfo.educations);

                // Xóa tất cả educations cũ
                const { error: deleteEduError } = await supabase
                    .from('mentor_educations')
                    .delete()
                    .eq('mentor_id', mentorId);

                if (deleteEduError) {
                    console.error('❌ Error deleting old educations:', deleteEduError);
                }

                // Thêm educations mới - CHỈ YÊU CẦU school và degree
                const educationsToInsert = mentorInfo.educations
                    .filter(edu => edu.school?.trim() && edu.degree?.trim())
                    .map(edu => ({
                        mentor_id: mentorId,
                        avatar: edu.avatar || null,
                        school: edu.school.trim(),
                        degree: edu.degree.trim(),
                        start_date: edu.start_date || null, // Cho phép null
                        end_date: edu.end_date || null,     // Cho phép null
                        description: edu.description || [],
                        published: edu.published
                    }));

                if (educationsToInsert.length > 0) {
                    const { error: insertEduError } = await supabase
                        .from('mentor_educations')
                        .insert(educationsToInsert);

                    if (insertEduError) {
                        console.error('❌ Error inserting educations:', insertEduError);
                        throw insertEduError;
                    }
                    console.log('✅ Educations saved');
                }
            }

            // 4. Lưu Activities
            if (mentorInfo.activities && mentorInfo.activities.length > 0) {
                console.log('🔄 Saving activities:', mentorInfo.activities);

                // Xóa tất cả activities cũ
                const { error: deleteActError } = await supabase
                    .from('mentor_activities')
                    .delete()
                    .eq('mentor_id', mentorId);

                if (deleteActError) {
                    console.error('❌ Error deleting old activities:', deleteActError);
                }

                // Thêm activities mới - YÊU CẦU 3 trường chính
                const activitiesToInsert = mentorInfo.activities
                    .filter(act => act.activity_name?.trim() && act.organization?.trim() && act.role?.trim())
                    .map(act => ({
                        mentor_id: mentorId,
                        avatar: act.avatar || null,
                        organization: act.organization.trim(),
                        role: act.role.trim(),
                        activity_name: act.activity_name.trim(),
                        start_date: act.start_date || null, // Cho phép null
                        end_date: act.end_date || null,     // Cho phép null
                        description: act.description || [],
                        published: act.published
                    }));

                if (activitiesToInsert.length > 0) {
                    const { error: insertActError } = await supabase
                        .from('mentor_activities')
                        .insert(activitiesToInsert);

                    if (insertActError) {
                        console.error('❌ Error inserting activities:', insertActError);
                        throw insertActError;
                    }
                    console.log('✅ Activities saved');
                }
            }

            showSuccess('Thành công', 'Tất cả thông tin mentor đã được cập nhật!');
            setIsEditing(false);

            // Reload lại data để đảm bảo sync
            await loadMentorInfo();

        } catch (error: any) {
            console.error('❌ Error updating mentor info:', error);
            showError('Lỗi', error?.message || 'Không thể cập nhật thông tin mentor. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle change password
    const handleChangePassword = async () => {
        if (!passwordData.currentPassword.trim()) {
            showError('Lỗi', 'Vui lòng nhập mật khẩu hiện tại!');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showError('Lỗi', 'Mật khẩu mới và xác nhận không khớp!');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            showError('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự!');
            return;
        }

        try {
            setIsLoading(true);

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user?.email || '',
                password: passwordData.currentPassword
            });

            if (signInError) {
                showError('Lỗi', 'Mật khẩu hiện tại không đúng!');
                return;
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (updateError) throw updateError;

            showSuccess('Thành công', 'Mật khẩu đã được thay đổi!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Error changing password:', error);
            showError('Lỗi', 'Không thể đổi mật khẩu. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        if (user) {
            setPersonalInfo({
                name: user.profile?.full_name || '',
                email: user.email || '',
                avatar: user.profile?.image_url || '',
                gender: user.profile?.gender || '',
                birthdate: user.profile?.birthdate || '',
                phone_number: user.profile?.phone_number || ''
            });
        }
        setPreviewAvatar('');
        setIsEditing(false);

        // Reload data based on current tab
        if (activeTab === 'profile') {
            loadSubProfile();
        } else if (activeTab === 'mentor') {
            loadMentorInfo();
        }
    };

    // Toggle password visibility
    const togglePasswordVisibility = (field: keyof ShowPasswords) => {
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    // Get available tabs based on user role
    const getAvailableTabs = () => {
        const tabs = [
            { id: 'profile' as TabType, label: 'Thông tin cá nhân', icon: User }
        ];

        if (user?.role === 'user' || user?.role === 'mentor') {
            tabs.push({ id: 'mentor' as TabType, label: 'Thông tin Mentor', icon: GraduationCap });
        }

        tabs.push({ id: 'password' as TabType, label: 'Đổi mật khẩu', icon: Lock });
        return tabs;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-4 sm:py-8 px-2 sm:px-4 lg:px-8">
            <Notification
                notifications={notifications}
                onRemove={removeNotification}
                maxVisible={3}
            />

            <div className="mx-auto max-w-7xl">
                {/* Page Header - Mobile Optimized */}
                <div className="text-center mb-6 sm:mb-12 px-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
                        Thông tin tài khoản
                    </h1>
                    <p className="text-sm sm:text-base lg:text-xl text-gray-600 max-w-3xl mx-auto">
                        Quản lý thông tin cá nhân và cài đặt tài khoản của bạn
                    </p>
                </div>

                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                    {/* Tabs - Tràn lên với hiệu ứng mượt */}
                    <div className="border-b border-gray-200 bg-gray-50 -mx-[1px]">
                        <nav className="flex space-x-0 px-2 sm:px-6 overflow-x-auto scrollbar-hide">
                            {getAvailableTabs().map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`
                                        relative flex items-center px-4 sm:px-6 py-3 sm:py-4 
                                        text-sm sm:text-base font-medium 
                                        transition-all duration-300 ease-in-out
                                        whitespace-nowrap
                                        ${activeTab === id
                                        ? 'text-cyan-600 bg-white'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }
                                    `}
                                >
                                    <Icon className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                    {/* Label đầy đủ trên desktop */}
                                    <span className="hidden sm:inline">{label}</span>
                                    {/* Label ngắn trên mobile */}
                                    <span className="sm:hidden">
                                        {id === 'profile' && 'Hồ sơ'}
                                        {id === 'mentor' && 'Mentor'}
                                        {id === 'password' && 'Mật khẩu'}
                                    </span>

                                    {/* Border bottom indicator với animation */}
                                    {activeTab === id && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600 animate-[slideIn_0.3s_ease-in-out]" />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content với fade animation */}
                    <div className="p-3 sm:p-6 lg:p-8">
                        <div className="animate-[fadeIn_0.4s_ease-in-out]">
                            {/* Combined Profile Tab */}
                            {activeTab === 'profile' && (
                                <CombinedProfileTab
                                    personalInfo={personalInfo}
                                    setPersonalInfo={setPersonalInfo}
                                    subProfileInfo={subProfileInfo}
                                    setSubProfileInfo={setSubProfileInfo}
                                    hasSubProfile={hasSubProfile}
                                    setHasSubProfile={setHasSubProfile}
                                    universityMajors={universityMajors}
                                    isEditing={isEditing}
                                    setIsEditing={setIsEditing}
                                    isLoading={isLoading}
                                    setIsLoading={setIsLoading}
                                    previewAvatar={previewAvatar}
                                    setPreviewAvatar={setPreviewAvatar}
                                    uploading={uploading}
                                    onAvatarUpload={handleAvatarUpload}
                                    onRemoveAvatar={handleRemoveAvatar}
                                    onSave={handleSaveProfile}
                                    onCancel={handleCancelEdit}
                                    user={user}
                                    setUser={setUser}
                                    showSuccess={showSuccess}
                                    showError={showError}
                                    uploadImage={uploadImage}
                                />
                            )}

                            {/* Mentor Tab */}
                            {activeTab === 'mentor' && (user?.role === 'user' || user?.role === 'mentor') && (
                                <MentorTab
                                    mentorInfo={mentorInfo}
                                    setMentorInfo={setMentorInfo}
                                    hasMentorProfile={hasMentorProfile}
                                    isEditing={isEditing}
                                    setIsEditing={setIsEditing}
                                    isLoading={isLoading}
                                    onSave={handleSaveMentorInfo}
                                    onCancel={handleCancelEdit}
                                    onUploadImage={uploadImage}
                                    showSuccess={showSuccess}
                                    showError={showError}
                                />
                            )}

                            {/* Password Tab */}
                            {activeTab === 'password' && (
                                <PasswordTab
                                    passwordData={passwordData}
                                    setPasswordData={setPasswordData}
                                    showPasswords={showPasswords}
                                    togglePasswordVisibility={togglePasswordVisibility}
                                    isLoading={isLoading}
                                    onSubmit={handleChangePassword}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Thêm CSS animations vào cuối component hoặc file CSS global */}
            <style jsx>{`
                @keyframes slideIn {
                    from {
                        transform: scaleX(0);
                        opacity: 0;
                    }
                    to {
                        transform: scaleX(1);
                        opacity: 1;
                    }
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default AccountSettings;