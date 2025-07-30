'use client';

import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Save, X, Edit3 } from 'lucide-react';

// Types
interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ShowPasswords {
  current: boolean;
  new: boolean;
  confirm: boolean;
}

type TabType = 'personal' | 'password';

const AccountSettings: React.FC = () => {
  // Mock user data
  const mockUser = {
    profile: {
      full_name: 'Nguyễn Văn A',
      phone: '0123456789'
    },
    email: 'nguyenvana@example.com'
  };
  
  // States
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: mockUser?.profile?.full_name || '',
    email: mockUser?.email || '',
    phone: mockUser?.profile?.phone || ''
  });

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

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('personal');

  // Handlers
  const handlePersonalInfoChange = (field: keyof PersonalInfo, value: string): void => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: keyof PasswordData, value: string): void => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field: keyof ShowPasswords): void => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSavePersonalInfo = (): void => {
    // Basic validation
    if (!personalInfo.name.trim()) {
      alert('Vui lòng nhập họ và tên!');
      return;
    }

    console.log('Personal info to save:', personalInfo);
    setIsEditing(false);
    alert('Thông tin cá nhân đã được cập nhật thành công!');
  };

  const handleChangePassword = (): void => {
    // Validation
    if (!passwordData.currentPassword.trim()) {
      alert('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    console.log('Password change request');
    
    // Reset form
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    alert('Mật khẩu đã được thay đổi thành công!');
  };

  const handleCancelEdit = (): void => {
    setPersonalInfo({
      name: mockUser?.profile?.full_name || '',
      email: mockUser?.email || '',
      phone: mockUser?.profile?.phone || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-6 sm:py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-8">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative">
              <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
                Thông tin tài khoản
              </h1>
              <p className="text-cyan-100">
                Quản lý thông tin cá nhân và bảo mật tài khoản của bạn
              </p>
            </div>
            {/* Decorative elements */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-white/5" />
          </div>

          {/* Tabs Navigation */}
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
            
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-8">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Thông tin cá nhân
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Cập nhật thông tin cá nhân của bạn
                    </p>
                  </div>
                  
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex transform items-center space-x-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:scale-105 hover:bg-cyan-700"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Chỉnh sửa</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center space-x-2 rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-gray-600"
                    >
                      <X className="h-4 w-4" />
                      <span>Hủy</span>
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={personalInfo.name}
                        onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-cyan-500"
                        placeholder="Nhập họ và tên"
                      />
                    ) : (
                      <div className="flex min-h-[48px] items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700">
                        {personalInfo.name || 'Chưa cập nhật'}
                      </div>
                    )}
                  </div>

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="flex min-h-[48px] items-center justify-between rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500">
                      <span>{personalInfo.email || 'Chưa có email'}</span>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Số điện thoại
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={personalInfo.phone}
                        onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-cyan-500"
                        placeholder="Nhập số điện thoại"
                      />
                    ) : (
                      <div className="flex min-h-[48px] items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700">
                        {personalInfo.phone || 'Chưa cập nhật'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex justify-end space-x-3 border-t border-gray-100 pt-6">
                    <button
                      onClick={handleCancelEdit}
                      className="rounded-lg border border-gray-300 px-6 py-2 text-sm text-gray-700 transition-all duration-300 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSavePersonalInfo}
                      className="flex items-center space-x-2 rounded-lg bg-cyan-600 px-6 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-cyan-700"
                    >
                      <Save className="h-4 w-4" />
                      <span>Lưu thay đổi</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Đổi mật khẩu
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Cập nhật mật khẩu để bảo mật tài khoản
                  </p>
                </div>
                
                <div className="mx-auto max-w-md space-y-6">
                  
                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Mật khẩu hiện tại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 outline-none transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-cyan-500"
                        placeholder="Nhập mật khẩu hiện tại"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 transition-colors hover:text-gray-600"
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 outline-none transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-cyan-500"
                        placeholder="Nhập mật khẩu mới"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 transition-colors hover:text-gray-600"
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 outline-none transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-cyan-500"
                        placeholder="Nhập lại mật khẩu mới"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 transition-colors hover:text-gray-600"
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleChangePassword}
                      className="flex w-full items-center justify-center space-x-2 rounded-lg bg-cyan-600 px-4 py-3 font-medium text-white transition-all duration-300 hover:bg-cyan-700"
                    >
                      <Lock className="h-5 w-5" />
                      <span>Đổi mật khẩu</span>
                    </button>
                  </div>
                </div>

                {/* Security Notes */}
                <div className="mt-8 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
                  <h3 className="mb-3 flex items-center text-sm font-semibold text-blue-800">
                    <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-xs text-blue-600">💡</span>
                    </div>
                    Lưu ý bảo mật
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-start">
                      <span className="mr-3 mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                      <span>Mật khẩu phải có ít nhất 6 ký tự</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                      <span>Nên sử dụng kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                      <span>Không sử dụng thông tin cá nhân dễ đoán</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                      <span>Không chia sẻ mật khẩu với người khác</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;