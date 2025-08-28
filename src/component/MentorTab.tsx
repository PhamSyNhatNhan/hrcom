'use client';

import React, { useState } from 'react';
import { Edit3, X, Save, GraduationCap } from 'lucide-react';

interface MentorInfo {
    headline?: string;
    description?: string;
    skill?: string[];
    published?: boolean;
}

interface MentorTabProps {
    mentorInfo: MentorInfo;
    setMentorInfo: React.Dispatch<React.SetStateAction<MentorInfo>>;
    hasMentorProfile: boolean;
    isEditing: boolean;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
    isLoading: boolean;
    onSave: () => void;
    onCancel: () => void;
}

const MentorTab: React.FC<MentorTabProps> = ({
                                                 mentorInfo,
                                                 setMentorInfo,
                                                 hasMentorProfile,
                                                 isEditing,
                                                 setIsEditing,
                                                 isLoading,
                                                 onSave,
                                                 onCancel
                                             }) => {
    const [skillInput, setSkillInput] = useState('');

    const handleAddSkill = () => {
        if (skillInput.trim() && !mentorInfo.skill?.includes(skillInput.trim())) {
            setMentorInfo(prev => ({
                ...prev,
                skill: [...(prev.skill || []), skillInput.trim()]
            }));
            setSkillInput('');
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setMentorInfo(prev => ({
            ...prev,
            skill: prev.skill?.filter(skill => skill !== skillToRemove) || []
        }));
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Thông tin Mentor</h2>
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

            {/* Status indicator */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${hasMentorProfile ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-gray-600">
            {hasMentorProfile ? 'Profile Mentor đã được thiết lập' : 'Chưa có profile Mentor'}
          </span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Trạng thái hiển thị:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        mentorInfo.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
            {mentorInfo.published ? 'Công khai' : 'Ẩn'}
          </span>
                </div>
            </div>

            {hasMentorProfile ? (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900">Tiêu đề chuyên môn</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={mentorInfo.headline}
                                onChange={(e) => setMentorInfo(prev => ({ ...prev, headline: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                                disabled={isLoading}
                                placeholder="VD: Senior HR Manager tại ABC Company"
                            />
                        ) : (
                            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-900 font-medium">
                                {mentorInfo.headline || 'Chưa cập nhật'}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900">Mô tả về bản thân (Mentor)</label>
                        {isEditing ? (
                            <textarea
                                rows={6}
                                value={mentorInfo.description}
                                onChange={(e) => setMentorInfo(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 resize-none"
                                disabled={isLoading}
                                placeholder="Mô tả kinh nghiệm, chuyên môn và phương pháp hỗ trợ học viên..."
                            />
                        ) : (
                            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-900 font-medium min-h-[120px] whitespace-pre-wrap">
                                {mentorInfo.description || 'Chưa cập nhật'}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900">Kỹ năng chuyên môn</label>
                        {isEditing ? (
                            <div className="space-y-3">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                                        disabled={isLoading}
                                        placeholder="Nhập kỹ năng và nhấn Enter"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddSkill}
                                        className="px-4 py-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 font-medium transition-all duration-300"
                                        disabled={isLoading || !skillInput.trim()}
                                    >
                                        Thêm
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(mentorInfo.skill || []).map((skill, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-cyan-100 text-cyan-800"
                                        >
                      {skill}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSkill(skill)}
                                                className="ml-2 text-cyan-600 hover:text-cyan-800 transition-colors duration-200"
                                                disabled={isLoading}
                                            >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-900 font-medium">
                                {mentorInfo.skill && mentorInfo.skill.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {mentorInfo.skill.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-cyan-100 text-cyan-800"
                                            >
                        {skill}
                      </span>
                                        ))}
                                    </div>
                                ) : 'Chưa cập nhật kỹ năng'}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900">Trạng thái hiển thị</label>
                        {isEditing ? (
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="published"
                                        checked={mentorInfo.published === true}
                                        onChange={() => setMentorInfo(prev => ({ ...prev, published: true }))}
                                        disabled={isLoading}
                                        className="text-cyan-600 focus:ring-cyan-500"
                                    />
                                    <span className="text-sm">Công khai (hiển thị trong danh sách mentor)</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="published"
                                        checked={mentorInfo.published === false}
                                        onChange={() => setMentorInfo(prev => ({ ...prev, published: false }))}
                                        disabled={isLoading}
                                        className="text-cyan-600 focus:ring-cyan-500"
                                    />
                                    <span className="text-sm">Ẩn (không hiển thị công khai)</span>
                                </label>
                            </div>
                        ) : (
                            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-900 font-medium">
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                    mentorInfo.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {mentorInfo.published ? 'Công khai - Hiển thị trong danh sách mentor' : 'Ẩn - Không hiển thị công khai'}
                </span>
                            </div>
                        )}
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
            ) : (
                <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có profile Mentor</h3>
                    <p className="text-gray-600 mb-6">
                        Bạn cần được admin thiết lập làm mentor trước khi có thể chỉnh sửa thông tin mentor.
                    </p>
                    <p className="text-sm text-gray-500">
                        Liên hệ admin để được hỗ trợ thiết lập tài khoản mentor.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MentorTab;