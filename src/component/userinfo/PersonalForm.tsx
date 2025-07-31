import React from 'react';
import { Save, X, Edit3, Upload, Camera } from 'lucide-react';
import { PersonalInfo } from '@/app/user/page';

interface Props {
  personalInfo: PersonalInfo;
  setPersonalInfo: React.Dispatch<React.SetStateAction<PersonalInfo>>;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  previewAvatar: string;
  setPreviewAvatar: React.Dispatch<React.SetStateAction<string>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  showNotification: (type: 'success' | 'error' | 'warning', title: string, message: string) => void;
}

export const PersonalForm: React.FC<Props> = ({
  personalInfo,
  setPersonalInfo,
  isEditing,
  setIsEditing,
  previewAvatar,
  setPreviewAvatar,
  fileInputRef,
  showNotification
}) => {
  const displayAvatar = previewAvatar || personalInfo.avatar;

  const handlePersonalInfoChange = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'Lỗi tải file', 'Kích thước file không được vượt quá 5MB!');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Lỗi định dạng', 'Vui lòng chọn file ảnh!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewAvatar(result);
      handlePersonalInfoChange('avatar', result);
      showNotification('success', 'Thành công', 'Ảnh đã được tải lên thành công!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setPreviewAvatar('');
    handlePersonalInfoChange('avatar', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    if (!personalInfo.name.trim()) {
      showNotification('error', 'Lỗi validation', 'Vui lòng nhập họ và tên!');
      return;
    }
    showNotification('success', 'Thành công', 'Thông tin cá nhân đã được cập nhật!');
    setIsEditing(false);
    setPreviewAvatar('');
  };

  const handleCancel = () => {
    setPersonalInfo({
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@example.com',
      phone: '0123456789',
      avatar: ''
    });
    setPreviewAvatar('');
    setIsEditing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h2>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="text-white bg-cyan-600 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-cyan-700">
            <Edit3 className="w-4 h-4" />
            <span>Chỉnh sửa</span>
          </button>
        ) : (
          <button onClick={handleCancel} className="text-white bg-gray-500 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-600">
            <X className="w-4 h-4" />
            <span>Hủy</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium">Ảnh đại diện</label>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full overflow-hidden border bg-gray-100">
              {displayAvatar ? (
                <img src={displayAvatar} className="object-cover w-full h-full" />
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <Camera className="text-gray-400 w-6 h-6" />
                </div>
              )}
            </div>
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Camera className="text-white w-5 h-5" />
              </div>
            )}
          </div>
          {isEditing && (
            <div className="space-y-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="text-cyan-600 border border-cyan-600 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-cyan-50">
                <Upload className="w-4 h-4" />
                <span>Tải ảnh lên</span>
              </button>
              {displayAvatar && (
                <button onClick={handleRemoveAvatar} className="text-red-600 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50">
                  <X className="w-4 h-4" /> <span>Xóa ảnh</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
        {isEditing ? (
          <input
            type="text"
            value={personalInfo.name}
            onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        ) : (
          <div className="px-4 py-3 bg-gray-50 border rounded-lg">{personalInfo.name}</div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <div className="px-4 py-3 bg-gray-100 border rounded-lg text-gray-500">{personalInfo.email}</div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
        {isEditing ? (
          <input
            type="tel"
            value={personalInfo.phone}
            onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        ) : (
          <div className="px-4 py-3 bg-gray-50 border rounded-lg">{personalInfo.phone}</div>
        )}
      </div>

      {isEditing && (
        <div className="flex justify-end space-x-2 pt-4">
          <button onClick={handleCancel} className="border px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50">Hủy</button>
          <button onClick={handleSave} className="bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-cyan-700">
            <Save className="w-4 h-4" /> <span>Lưu thay đổi</span>
          </button>
        </div>
      )}
    </div>
  );
};
