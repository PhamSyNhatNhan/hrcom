'use client';

import React, { useRef } from 'react';
import { Edit3, Upload, Camera, X, Save } from 'lucide-react';

interface PersonalInfo {
    name: string;
    email: string;
    avatar: string;
    gender?: string;
    birthdate?: string;
    phone_number?: string;
}

interface PersonalInfoTabProps {
    personalInfo: PersonalInfo;
    setPersonalInfo: React.Dispatch<React.SetStateAction<PersonalInfo>>;
    isEditing: boolean;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
    isLoading: boolean;
    previewAvatar: string;
    uploading: boolean;
    onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveAvatar: () => void;
    onSave: () => void;
    onCancel: () => void;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
                                                             personalInfo,
                                                             setPersonalInfo,
                                                             isEditing,
                                                             setIsEditing,
                                                             isLoading,
                                                             previewAvatar,
                                                             uploading,
                                                             onAvatarUpload,
                                                             onRemoveAvatar,
                                                             onSave,
                                                             onCancel
                                                         }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const displayAvatar = previewAvatar || personalInfo.avatar;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h2>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                        disabled={isLoading}
                    >
                        <Edit3 className="w-4 h-4" />
                        <span>Chỉnh sửa</span>
                    </button>
                ) : (
                    <button
                        onClick={onCancel}
                        className="bg-gray-500 text-white px-6 py-2 rounded-xl font-medium hover:bg-gray-600 transition-all duration-300 flex items-center space-x-2"
                        disabled={isLoading}
                    >
                        <X className="w-4 h-4" />
                        <span>Hủy</span>
                    </button>
                )}
            </div>

            {/* Avatar Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                <label className="block text-sm font-semibold text-gray-900 mb-4">Ảnh đại diện</label>
                <div className="flex items-center space-x-6">
                    <div className="relative">
                        <div className="h-28 w-28 rounded-full overflow-hidden ring-4 ring-white shadow-lg bg-gray-100">
                            {displayAvatar ? (
                                <img src={displayAvatar} className="object-cover w-full h-full" alt="Avatar" />
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
                                onChange={onAvatarUpload}
                                disabled={uploading}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-white text-cyan-600 border-2 border-cyan-600 px-4 py-2 rounded-xl font-medium hover:bg-cyan-600 hover:text-white transition-all duration-300 flex items-center space-x-2"
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
                                    onClick={onRemoveAvatar}
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

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900">
                        Họ và tên <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={personalInfo.name}
                            onChange={(e) => setPersonalInfo(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                            disabled={isLoading}
                        />
                    ) : (
                        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-900 font-medium">
                            {personalInfo.name || 'Chưa cập nhật'}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900">Email</label>
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-xl text-gray-600">
                        {personalInfo.email}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900">Số điện thoại</label>
                    {isEditing ? (
                        <input
                            type="tel"
                            value={personalInfo.phone_number}
                            onChange={(e) => setPersonalInfo(prev => ({ ...prev, phone_number: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                            disabled={isLoading}
                            placeholder="Nhập số điện thoại"
                        />
                    ) : (
                        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-900 font-medium">
                            {personalInfo.phone_number || 'Chưa cập nhật'}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900">Giới tính</label>
                    {isEditing ? (
                        <select
                            value={personalInfo.gender}
                            onChange={(e) => setPersonalInfo(prev => ({ ...prev, gender: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                            disabled={isLoading}
                        >
                            <option value="">Chọn giới tính</option>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                        </select>
                    ) : (
                        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-900 font-medium">
                            {personalInfo.gender || 'Chưa cập nhật'}
                        </div>
                    )}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900">Ngày sinh</label>
                    {isEditing ? (
                        <input
                            type="date"
                            value={personalInfo.birthdate}
                            onChange={(e) => setPersonalInfo(prev => ({ ...prev, birthdate: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                            disabled={isLoading}
                        />
                    ) : (
                        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-900 font-medium">
                            {personalInfo.birthdate ? new Date(personalInfo.birthdate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                        </div>
                    )}
                </div>
            </div>

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
    );
};

export default PersonalInfoTab;