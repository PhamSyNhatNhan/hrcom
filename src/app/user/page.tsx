'use client';

import React, { useState, useRef } from 'react';
import { User, Lock, Save, X, Edit3 } from 'lucide-react';
import { PersonalForm } from '@/component/userinfo/PersonalForm';
import { PasswordForm } from '@/component/userinfo/PasswordForm';
import { TabsNavigation } from '@/component/userinfo/TabsNavigation';
import { NotificationItem } from '@/component/userinfo/NotificationItem';

export type TabType = 'personal' | 'password';

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  avatar: string;
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

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
}

const AccountSettings: React.FC = () => {
  const mockUser = {
    profile: {
      full_name: 'Nguyễn Văn A',
      phone: '0123456789',
      avatar: ''
    },
    email: 'nguyenvana@example.com'
  };

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: mockUser?.profile?.full_name || '',
    email: mockUser?.email || '',
    phone: mockUser?.profile?.phone || '',
    avatar: mockUser?.profile?.avatar || ''
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
  const [previewAvatar, setPreviewAvatar] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (type: Notification['type'], title: string, message: string) => {
    const id = Date.now().toString();
    const newNotification: Notification = { id, type, title, message };
    setNotifications((prev) => [...prev, newNotification]);
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-6 sm:py-8">
      <div className="fixed right-4 top-4 z-50 w-80 max-w-sm">
        {notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} remove={removeNotification} />
        ))}
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-8">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative">
              <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Thông tin tài khoản</h1>
              <p className="text-cyan-100">Quản lý thông tin cá nhân và bảo mật tài khoản của bạn</p>
            </div>
          </div>

          <TabsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="p-6 lg:p-8">
            {activeTab === 'personal' ? (
              <PersonalForm
                personalInfo={personalInfo}
                setPersonalInfo={setPersonalInfo}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                previewAvatar={previewAvatar}
                setPreviewAvatar={setPreviewAvatar}
                fileInputRef={fileInputRef}
                showNotification={showNotification}
              />
            ) : (
              <PasswordForm
                passwordData={passwordData}
                setPasswordData={setPasswordData}
                showPasswords={showPasswords}
                setShowPasswords={setShowPasswords}
                showNotification={showNotification}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
