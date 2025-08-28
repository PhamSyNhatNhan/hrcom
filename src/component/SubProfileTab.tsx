'use client';

import React from 'react';
import { Edit3, X, Save, GraduationCap, Linkedin, Github, Globe, ExternalLink } from 'lucide-react';

interface SubProfileInfo {
    university_major_id?: string;
    cv?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
    description?: string;
}

interface UniversityMajor {
    id: string;
    university: {
        name: string;
        code: string;
    };
    major: {
        name: string;
    };
}

interface SubProfileTabProps {
    subProfileInfo: SubProfileInfo;
    setSubProfileInfo: React.Dispatch<React.SetStateAction<SubProfileInfo>>;
    hasSubProfile: boolean;
    universityMajors: UniversityMajor[];
    isEditing: boolean;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
    isLoading: boolean;
    onSave: () => void;
    onCancel: () => void;
}

const SubProfileTab: React.FC<SubProfileTabProps> = ({
                                                         subProfileInfo,
                                                         setSubProfileInfo,
                                                         hasSubProfile,
                                                         universityMajors,
                                                         isEditing,
                                                         setIsEditing,
                                                         isLoading,
                                                         onSave,
                                                         onCancel
                                                     }) => {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Thông tin bổ sung</h2>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                        disabled={isLoading}
                    >
                        <Edit3 className="w-4 h-4" />
                        <span>{hasSubProfile ? 'Chỉnh sửa' : 'Tạo mới'}</span>
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

            {/* Status indicator */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4">
                <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${hasSubProfile ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-gray-900 font-medium">
            {hasSubProfile ? 'Thông tin đã được thiết lập' : 'Chưa có thông tin bổ sung'}
          </span>
                    {hasSubProfile && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              Đã hoàn thiện
            </span>
                    )}
                </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <span>Trường - Chuyên ngành</span>
                    </label>
                    {isEditing ? (
                        <select
                            value={subProfileInfo.university_major_id}
                            onChange={(e) => setSubProfileInfo(prev => ({ ...prev, university_major_id: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                            disabled={isLoading}
                        >
                            <option value="">Chọn trường - chuyên ngành</option>
                            {universityMajors.map((um) => (
                                <option key={um.id} value={um.id}>
                                    {um.university.name} - {um.major.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-900 font-medium">
                            {universityMajors.find(um => um.id === subProfileInfo.university_major_id) ?
                                `${universityMajors.find(um => um.id === subProfileInfo.university_major_id)?.university.name} - ${universityMajors.find(um => um.id === subProfileInfo.university_major_id)?.major.name}` :
                                'Chưa cập nhật'
                            }
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900">CV (Link)</label>
                    {isEditing ? (
                        <input
                            type="url"
                            value={subProfileInfo.cv}
                            onChange={(e) => setSubProfileInfo(prev => ({ ...prev, cv: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                            disabled={isLoading}
                            placeholder="https://drive.google.com/file/d/..."
                        />
                    ) : (
                        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-900 font-medium">
                            {subProfileInfo.cv ? (
                                <a href={subProfileInfo.cv} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline flex items-center space-x-1">
                                    <span>Xem CV</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            ) : 'Chưa cập nhật'}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 flex items-center space-x-2">
                        <Linkedin className="w-4 h-4 text-blue-600" />
                        <span>LinkedIn</span>
                    </label>
                    {isEditing ? (
                        <input
                            type="url"
                            value={subProfileInfo.linkedin_url}
                            onChange={(e) => setSubProfileInfo(prev => ({ ...prev, linkedin_url: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                            disabled={isLoading}
                            placeholder="https://linkedin.com/in/yourprofile"
                        />
                    ) : (
                        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-900 font-medium">
                            {subProfileInfo.linkedin_url ? (
                                <a href={subProfileInfo.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline flex items-center space-x-1">
                                    <span>Xem LinkedIn</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            ) : 'Chưa cập nhật'}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 flex items-center space-x-2">
                        <Github className="w-4 h-4 text-gray-800" />
                        <span>GitHub</span>
                    </label>
                    {isEditing ? (
                        <input
                            type="url"
                            value={subProfileInfo.github_url}
                            onChange={(e) => setSubProfileInfo(prev => ({ ...prev, github_url: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                            disabled={isLoading}
                            placeholder="https://github.com/yourusername"
                        />
                    ) : (
                        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-900 font-medium">
                            {subProfileInfo.github_url ? (
                                <a href={subProfileInfo.github_url} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline flex items-center space-x-1">
                                    <span>Xem GitHub</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            ) : 'Chưa cập nhật'}
                        </div>
                    )}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-green-600" />
                        <span>Portfolio/Website</span>
                    </label>
                    {isEditing ? (
                        <input
                            type="url"
                            value={subProfileInfo.portfolio_url}
                            onChange={(e) => setSubProfileInfo(prev => ({ ...prev, portfolio_url: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                            disabled={isLoading}
                            placeholder="https://yourportfolio.com"
                        />
                    ) : (
                        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-900 font-medium">
                            {subProfileInfo.portfolio_url ? (
                                <a href={subProfileInfo.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline flex items-center space-x-1">
                                    <span>Xem Portfolio</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            ) : 'Chưa cập nhật'}
                        </div>
                    )}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900">Mô tả bản thân</label>
                    {isEditing ? (
                        <textarea
                            rows={4}
                            value={subProfileInfo.description}
                            onChange={(e) => setSubProfileInfo(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 resize-none"
                            disabled={isLoading}
                            placeholder="Viết về bản thân, kinh nghiệm, mục tiêu nghề nghiệp..."
                        />
                    ) : (
                        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-900 font-medium min-h-[100px]">
                            {subProfileInfo.description || 'Chưa cập nhật'}
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
                        <span>{isLoading ? 'Đang lưu...' : (hasSubProfile ? 'Lưu thay đổi' : 'Tạo mới')}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default SubProfileTab;