'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, GraduationCap } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Notification from '@/component/Notification';
import { useNotificationWithUtils } from '@/hooks/useNotification';
import { supabase } from '@/utils/supabase/client';

// Import tab components
import CombinedProfileTab from '@/component/CombinedProfileTab';
import MentorTab from '@/component/MentorTab';
import PasswordTab from '@/component/PasswordTab';

export type TabType = 'profile' | 'mentor' | 'password';

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

export interface MentorInfo {
  headline?: string;
  description?: string;
  skill?: string[];
  published?: boolean;
}

export interface UniversityMajor {
  id: string;
  university: {
    name: string;
    code: string;
  };
  major: {
    name: string;
  };
}

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
    headline: '',
    description: '',
    skill: [],
    published: false
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
      const transformedData = data?.map(item => ({
        id: item.id,
        university_id: item.university_id,
        major_id: item.major_id,
        university: {
          name: item.universities?.name || 'Unknown University',
          code: item.universities?.code || ''
        },
        major: {
          name: item.majors?.name || 'Unknown Major'
        }
      })) || [];

      setUniversityMajors(transformedData);
    } catch (error) {
      console.error('Error loading university majors:', error);

      // Set empty array as fallback to prevent UI errors
      setUniversityMajors([]);

      // Show error to user
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
    if (!user || user.role !== 'mentor') return;

    try {
      const { data: profileMentor, error: profileError } = await supabase
          .from('profile_mentor')
          .select('mentor_id')
          .eq('profile_id', user.id)
          .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profileMentor) {
        setHasMentorProfile(true);
        setMentorId(profileMentor.mentor_id);

        const { data: mentorData, error: mentorError } = await supabase
            .from('mentors')
            .select('*')
            .eq('id', profileMentor.mentor_id)
            .single();

        if (mentorError) throw mentorError;

        setMentorInfo({
          headline: mentorData.headline || '',
          description: mentorData.description || '',
          skill: mentorData.skill || [],
          published: mentorData.published || false
        });
      }
    } catch (error) {
      console.error('Error loading mentor info:', error);
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

  // Handle save personal info
  const handleSavePersonalInfo = async () => {
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

      const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: personalInfo.name.trim(),
            image_url: personalInfo.avatar || null,
            gender: personalInfo.gender || null,
            birthdate: personalInfo.birthdate || null,
            phone_number: personalInfo.phone_number || null,
            updated_at: new Date().toISOString()
          });

      if (profileError) throw profileError;

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

      showSuccess('Thành công', 'Thông tin cá nhân đã được cập nhật!');
      setPreviewAvatar('');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle save sub profile
  const handleSaveSubProfile = async () => {
    if (!user) {
      showError('Lỗi', 'Vui lòng đăng nhập lại!');
      return;
    }

    try {
      setIsLoading(true);

      if (hasSubProfile) {
        const { error } = await supabase
            .from('sub_profiles')
            .update({
              university_major_id: subProfileInfo.university_major_id || null,
              cv: subProfileInfo.cv || null,
              linkedin_url: subProfileInfo.linkedin_url || null,
              github_url: subProfileInfo.github_url || null,
              portfolio_url: subProfileInfo.portfolio_url || null,
              description: subProfileInfo.description || null,
              updated_at: new Date().toISOString()
            })
            .eq('profile_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
            .from('sub_profiles')
            .insert({
              profile_id: user.id,
              university_major_id: subProfileInfo.university_major_id || null,
              cv: subProfileInfo.cv || null,
              linkedin_url: subProfileInfo.linkedin_url || null,
              github_url: subProfileInfo.github_url || null,
              portfolio_url: subProfileInfo.portfolio_url || null,
              description: subProfileInfo.description || null
            });

        if (error) throw error;
        setHasSubProfile(true);
      }

      showSuccess('Thành công', 'Thông tin bổ sung đã được cập nhật!');
    } catch (error) {
      console.error('Error updating sub profile:', error);
      showError('Lỗi', 'Không thể cập nhật thông tin bổ sung. Vui lòng thử lại.');
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

      const { error } = await supabase
          .from('mentors')
          .update({
            headline: mentorInfo.headline || null,
            description: mentorInfo.description || null,
            skill: mentorInfo.skill || [],
            published: mentorInfo.published,
            updated_at: new Date().toISOString()
          })
          .eq('id', mentorId);

      if (error) throw error;

      showSuccess('Thành công', 'Thông tin mentor đã được cập nhật!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating mentor info:', error);
      showError('Lỗi', 'Không thể cập nhật thông tin mentor. Vui lòng thử lại.');
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

    if (user?.role === 'mentor') {
      tabs.push({ id: 'mentor' as TabType, label: 'Thông tin Mentor', icon: GraduationCap });
    }

    tabs.push({ id: 'password' as TabType, label: 'Đổi mật khẩu', icon: Lock });

    return tabs;
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
        <Notification
            notifications={notifications}
            onRemove={removeNotification}
            maxVisible={3}
        />

        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Thông tin tài khoản
            </h1>
            <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Quản lý thông tin cá nhân và cài đặt tài khoản của bạn
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            {/* Tabs */}
            <div className="border-b border-gray-200 bg-gray-50">
              <nav className="flex space-x-0 px-6 overflow-x-auto">
                {getAvailableTabs().map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`relative flex items-center px-6 py-4 text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                            activeTab === id
                                ? 'border-b-2 border-cyan-600 bg-white text-cyan-600'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {label}
                    </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6 lg:p-8">
              {/* Combined Profile Tab */}
              {activeTab === 'profile' && (
                  <CombinedProfileTab
                      personalInfo={personalInfo}
                      setPersonalInfo={setPersonalInfo}
                      subProfileInfo={subProfileInfo}
                      setSubProfileInfo={setSubProfileInfo}
                      hasSubProfile={hasSubProfile}
                      universityMajors={universityMajors}
                      isEditing={isEditing}
                      setIsEditing={setIsEditing}
                      isLoading={isLoading}
                      previewAvatar={previewAvatar}
                      uploading={uploading}
                      onAvatarUpload={handleAvatarUpload}
                      onRemoveAvatar={handleRemoveAvatar}
                      onSavePersonalInfo={handleSavePersonalInfo}
                      onSaveSubProfile={handleSaveSubProfile}
                      onCancel={handleCancelEdit}
                  />
              )}

              {/* Mentor Tab */}
              {activeTab === 'mentor' && user?.role === 'mentor' && (
                  <MentorTab
                      mentorInfo={mentorInfo}
                      setMentorInfo={setMentorInfo}
                      hasMentorProfile={hasMentorProfile}
                      isEditing={isEditing}
                      setIsEditing={setIsEditing}
                      isLoading={isLoading}
                      onSave={handleSaveMentorInfo}
                      onCancel={handleCancelEdit}
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
  );
};

export default AccountSettings;