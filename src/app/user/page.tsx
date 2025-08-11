'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, Lock, Save, X, Edit3, Upload, Camera, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/utils/supabase/client';
import Notification from '@/component/Notification';
import { useNotificationWithUtils } from '@/hooks/useNotification';

export type TabType = 'personal' | 'password';

export interface PersonalInfo {
  name: string;
  email: string;
  avatar: string;
  gender?: string;
  birthdate?: string;
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
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    notifications,
    removeNotification,
    showSuccess,
    showError
  } = useNotificationWithUtils();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Personal info state
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: '',
    email: '',
    avatar: '',
    gender: '',
    birthdate: ''
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

  // Image upload states
  const [previewAvatar, setPreviewAvatar] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  // Load user data on component mount
  useEffect(() => {
    if (user) {
      setPersonalInfo({
        name: user.profile?.full_name || '',
        email: user.email || '',
        avatar: user.profile?.image_url || '',
        gender: user.profile?.gender || '',
        birthdate: user.profile?.birthdate || ''
      });
    }
  }, [user]);

  // Image upload function
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

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
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

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewAvatar(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase
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
    if (fileInputRef.current) fileInputRef.current.value = '';
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

      // Update profile in database
      const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: personalInfo.name.trim(),
            image_url: personalInfo.avatar || null,
            gender: personalInfo.gender || null,
            birthdate: personalInfo.birthdate || null,
            updated_at: new Date().toISOString()
          });

      if (profileError) {
        throw profileError;
      }

      // Update local state
      setUser({
        ...user,
        profile: {
          ...user.profile,
          id: user.id,
          full_name: personalInfo.name.trim(),
          image_url: personalInfo.avatar,
          gender: personalInfo.gender as any,
          birthdate: personalInfo.birthdate,
          updated_at: new Date().toISOString(),
          created_at: user.profile?.created_at || new Date().toISOString()
        }
      });

      showSuccess('Thành công', 'Thông tin cá nhân đã được cập nhật!');
      setIsEditing(false);
      setPreviewAvatar('');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại.');
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
        birthdate: user.profile?.birthdate || ''
      });
    }
    setPreviewAvatar('');
    setIsEditing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

      // Verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordData.currentPassword
      });

      if (signInError) {
        showError('Lỗi', 'Mật khẩu hiện tại không đúng!');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        throw updateError;
      }

      showSuccess('Thành công', 'Mật khẩu đã được thay đổi!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      showError('Lỗi', 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: keyof ShowPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const displayAvatar = previewAvatar || personalInfo.avatar;

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-6 sm:py-8">

        {/* Sử dụng Notification component mới */}
        <Notification
            notifications={notifications}
            onRemove={removeNotification}
            maxVisible={3}
        />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-8">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative">
                <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Thông tin tài khoản</h1>
                <p className="text-cyan-100">Quản lý thông tin cá nhân và bảo mật tài khoản của bạn</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 bg-gray-50/50">
              <nav className="flex space-x-0 px-6">
                <button
                    onClick={() => setActiveTab('personal')}
                    className={`relative flex items-center px-6 py-4 text-sm font-medium transition-all duration-300 ${
                        activeTab === 'personal'
                            ? 'border-b-2 border-cyan-600 bg-white text-cyan-600'
                            : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
                    }`}
                >
                  <User className="mr-2 h-4 w-4" />
                  Thông tin cá nhân
                </button>

                <button
                    onClick={() => setActiveTab('password')}
                    className={`relative flex items-center px-6 py-4 text-sm font-medium transition-all duration-300 ${
                        activeTab === 'password'
                            ? 'border-b-2 border-cyan-600 bg-white text-cyan-600'
                            : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
                    }`}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Đổi mật khẩu
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="p-6 lg:p-8">
              {activeTab === 'personal' ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h2>
                      {!isEditing ? (
                          <button
                              onClick={() => setIsEditing(true)}
                              className="text-white bg-cyan-600 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-cyan-700"
                              disabled={isLoading}
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>Chỉnh sửa</span>
                          </button>
                      ) : (
                          <button
                              onClick={handleCancelEdit}
                              className="text-white bg-gray-500 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-600"
                              disabled={isLoading}
                          >
                            <X className="w-4 h-4" />
                            <span>Hủy</span>
                          </button>
                      )}
                    </div>

                    {/* Avatar Section */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium">Ảnh đại diện</label>
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <div className="h-24 w-24 rounded-full overflow-hidden border bg-gray-100">
                            {displayAvatar ? (
                                <img src={displayAvatar} className="object-cover w-full h-full" alt="Avatar" />
                            ) : (
                                <div className="flex items-center justify-center h-full w-full">
                                  <Camera className="text-gray-400 w-6 h-6" />
                                </div>
                            )}
                          </div>
                          {isEditing && (
                              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera className="text-white w-5 h-5" />
                              </div>
                          )}
                        </div>

                        {isEditing && (
                            <div className="space-y-2">
                              <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleAvatarUpload}
                                  disabled={uploading}
                              />
                              <button
                                  onClick={() => fileInputRef.current?.click()}
                                  className="text-cyan-600 border border-cyan-600 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-cyan-50"
                                  disabled={uploading}
                              >
                                {uploading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-600"></div>
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                <span>{uploading ? 'Đang tải...' : 'Tải ảnh lên'}</span>
                              </button>

                              {displayAvatar && (
                                  <button
                                      onClick={handleRemoveAvatar}
                                      className="text-red-600 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50 flex items-center space-x-2"
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

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Họ và tên *</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={personalInfo.name}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                disabled={isLoading}
                            />
                        ) : (
                            <div className="px-4 py-3 bg-gray-50 border rounded-lg">{personalInfo.name || 'Chưa cập nhật'}</div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <div className="px-4 py-3 bg-gray-100 border rounded-lg text-gray-500">{personalInfo.email}</div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                        {isEditing ? (
                            <select
                                value={personalInfo.gender}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, gender: e.target.value }))}
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                disabled={isLoading}
                            >
                              <option value="">Chọn giới tính</option>
                              <option value="Nam">Nam</option>
                              <option value="Nữ">Nữ</option>
                              <option value="Khác">Khác</option>
                            </select>
                        ) : (
                            <div className="px-4 py-3 bg-gray-50 border rounded-lg">{personalInfo.gender || 'Chưa cập nhật'}</div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
                        {isEditing ? (
                            <input
                                type="date"
                                value={personalInfo.birthdate}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, birthdate: e.target.value }))}
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                disabled={isLoading}
                            />
                        ) : (
                            <div className="px-4 py-3 bg-gray-50 border rounded-lg">
                              {personalInfo.birthdate ? new Date(personalInfo.birthdate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                            </div>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                        <div className="flex justify-end space-x-2 pt-4">
                          <button
                              onClick={handleCancelEdit}
                              className="border px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
                              disabled={isLoading}
                          >
                            Hủy
                          </button>
                          <button
                              onClick={handleSavePersonalInfo}
                              className="bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-cyan-700"
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
              ) : (
                  // Password Tab
                  <div className="space-y-6 max-w-md mx-auto">
                    <h2 className="text-xl font-semibold text-gray-900 text-center">Đổi mật khẩu</h2>

                    {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => (
                        <div key={field} className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            {field === 'currentPassword'
                                ? 'Mật khẩu hiện tại'
                                : field === 'newPassword'
                                    ? 'Mật khẩu mới'
                                    : 'Xác nhận mật khẩu mới'}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                                type={showPasswords[field.replace('Password', '') as keyof ShowPasswords] ? 'text' : 'password'}
                                value={passwordData[field]}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, [field]: e.target.value }))}
                                className="w-full px-4 py-3 border rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Nhập mật khẩu"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility(field.replace('Password', '') as keyof ShowPasswords)}
                                className="absolute right-3 top-3"
                                disabled={isLoading}
                            >
                              {showPasswords[field.replace('Password', '') as keyof ShowPasswords] ? (
                                  <EyeOff className="h-5 w-5 text-gray-400" />
                              ) : (
                                  <Eye className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                    ))}

                    <button
                        onClick={handleChangePassword}
                        className="w-full bg-cyan-600 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-cyan-700"
                        disabled={isLoading}
                    >
                      {isLoading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                          <Lock className="h-5 w-5" />
                      )}
                      <span>{isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}</span>
                    </button>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

export default AccountSettings;