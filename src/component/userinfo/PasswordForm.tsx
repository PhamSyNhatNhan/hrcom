import React from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { PasswordData, ShowPasswords } from '@/app/user/page';

interface Props {
  passwordData: PasswordData;
  setPasswordData: React.Dispatch<React.SetStateAction<PasswordData>>;
  showPasswords: ShowPasswords;
  setShowPasswords: React.Dispatch<React.SetStateAction<ShowPasswords>>;
  showNotification: (type: 'success' | 'error' | 'warning', title: string, message: string) => void;
}

export const PasswordForm: React.FC<Props> = ({
  passwordData,
  setPasswordData,
  showPasswords,
  setShowPasswords,
  showNotification
}) => {
  const togglePasswordVisibility = (field: keyof ShowPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangePassword = () => {
    if (!passwordData.currentPassword.trim()) {
      showNotification('error', 'Lỗi', 'Vui lòng nhập mật khẩu hiện tại!');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('error', 'Lỗi', 'Mật khẩu mới và xác nhận không khớp!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showNotification('error', 'Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    showNotification('success', 'Thành công', 'Mật khẩu đã được thay đổi!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
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
              onChange={(e) => handlePasswordChange(field, e.target.value)}
              className="w-full px-4 py-3 border rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Nhập mật khẩu"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility(field.replace('Password', '') as keyof ShowPasswords)}
              className="absolute right-3 top-3"
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
      >
        <Lock className="h-5 w-5" />
        <span>Đổi mật khẩu</span>
      </button>
    </div>
  );
};
