'use client';

import React from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import type { PasswordTabProps } from '@/types/profile_user';

const PasswordTab: React.FC<PasswordTabProps> = ({
                                                     passwordData,
                                                     setPasswordData,
                                                     showPasswords,
                                                     togglePasswordVisibility,
                                                     isLoading,
                                                     onSubmit
                                                 }) => {
    const passwordFields = [
        {
            key: 'currentPassword' as const,
            label: 'Mật khẩu hiện tại',
            showKey: 'current' as keyof typeof showPasswords,
            placeholder: 'Nhập mật khẩu hiện tại'
        },
        {
            key: 'newPassword' as const,
            label: 'Mật khẩu mới',
            showKey: 'new' as keyof typeof showPasswords,
            placeholder: 'Nhập mật khẩu mới (tối thiểu 6 ký tự)'
        },
        {
            key: 'confirmPassword' as const,
            label: 'Xác nhận mật khẩu mới',
            showKey: 'confirm' as keyof typeof showPasswords,
            placeholder: 'Nhập lại mật khẩu mới'
        }
    ];

    return (
        <div className="space-y-8 max-w-md mx-auto">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Đổi mật khẩu</h2>
                <p className="text-gray-600">Cập nhật mật khẩu để bảo mật tài khoản của bạn</p>
            </div>

            <div className="space-y-6">
                {passwordFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900 block">
                            {field.label}
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords[field.showKey] ? 'text' : 'password'}
                                value={passwordData[field.key]}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                                placeholder={field.placeholder}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility(field.showKey)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                disabled={isLoading}
                            >
                                {showPasswords[field.showKey] ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Password Requirements */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Yêu cầu mật khẩu:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Ít nhất 6 ký tự</li>
                    <li>• Khác với mật khẩu hiện tại</li>
                    <li>• Mật khẩu mới và xác nhận phải khớp</li>
                </ul>
            </div>

            <button
                onClick={onSubmit}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                disabled={isLoading}
            >
                {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                    <Lock className="h-5 w-5" />
                )}
                <span>{isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}</span>
            </button>

            {/* Security Tips */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Mẹo bảo mật:</h4>
                <ul className="text-xs text-gray-700 space-y-1">
                    <li>• Sử dụng mật khẩu mạnh và duy nhất</li>
                    <li>• Không chia sẻ mật khẩu với ai</li>
                    <li>• Thay đổi mật khẩu định kỳ</li>
                    <li>• Kích hoạt xác thực 2 yếu tố nếu có thể</li>
                </ul>
            </div>
        </div>
    );
};

export default PasswordTab;