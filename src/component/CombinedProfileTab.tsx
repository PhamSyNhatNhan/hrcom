'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Edit3, Upload, Camera, X, Save, GraduationCap, Linkedin, Github, Globe, ExternalLink, Search } from 'lucide-react';

interface PersonalInfo {
    name: string;
    email: string;
    avatar: string;
    gender?: string;
    birthdate?: string;
    phone_number?: string;
}

interface SubProfileInfo {
    university_major_id?: string;
    cv?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
    description?: string;
}

interface University {
    id: string;
    name: string;
    code: string;
}

interface Major {
    id: string;
    name: string;
}

interface UniversityMajor {
    id: string;
    university_id: string;
    major_id: string;
    university: {
        name: string;
        code: string;
    };
    major: {
        name: string;
    };
}

interface CombinedProfileTabProps {
    personalInfo: PersonalInfo;
    setPersonalInfo: React.Dispatch<React.SetStateAction<PersonalInfo>>;
    subProfileInfo: SubProfileInfo;
    setSubProfileInfo: React.Dispatch<React.SetStateAction<SubProfileInfo>>;
    hasSubProfile: boolean;
    universityMajors: UniversityMajor[];
    isEditing: boolean;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
    isLoading: boolean;
    previewAvatar: string;
    uploading: boolean;
    onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveAvatar: () => void;
    onSavePersonalInfo: () => void;
    onSaveSubProfile: () => void;
    onCancel: () => void;
}

const CombinedProfileTab: React.FC<CombinedProfileTabProps> = ({
                                                                   personalInfo,
                                                                   setPersonalInfo,
                                                                   subProfileInfo,
                                                                   setSubProfileInfo,
                                                                   hasSubProfile,
                                                                   universityMajors,
                                                                   isEditing,
                                                                   setIsEditing,
                                                                   isLoading,
                                                                   previewAvatar,
                                                                   uploading,
                                                                   onAvatarUpload,
                                                                   onRemoveAvatar,
                                                                   onSavePersonalInfo,
                                                                   onSaveSubProfile,
                                                                   onCancel
                                                               }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const universityRef = useRef<HTMLDivElement>(null);
    const majorRef = useRef<HTMLDivElement>(null);
    const displayAvatar = previewAvatar || personalInfo.avatar;

    // THEME ————————————————
    const isEdit = isEditing;

    // Panel wrapper
    const panelBasicCls = isEdit
        ? "rounded-2xl p-6 bg-white border border-cyan-200 shadow-[0_10px_30px_rgba(8,145,178,0.12)]"
        : "rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-cyan-50";

    const panelExtraCls = isEdit
        ? "rounded-2xl p-6 bg-white border border-emerald-200 shadow-[0_10px_30px_rgba(16,185,129,0.12)]"
        : "rounded-2xl p-6 bg-gradient-to-br from-green-50 to-emerald-50";

    // Label màu nổi hơn khi edit
    const labelCls = isEdit
        ? "block text-sm font-semibold text-cyan-700"
        : "block text-sm font-semibold text-gray-900";

    // Box hiển thị (View mode)
    const viewBoxCls = "px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium";

    // Input/Select/Textarea (Edit mode)
    const editInputBase =
        "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none";
    const editInputCls =
        `${editInputBase} border-cyan-300 bg-white focus:ring-4 focus:ring-cyan-100 focus:border-cyan-500 shadow-sm`;
    const editSelectCls = editInputCls;
    const editTextareaCls = `${editInputCls} resize-none`;

    // Search dropdown (Edit mode)
    const dropdownCls =
        "absolute z-30 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto";
    const dropdownBorder = isEdit ? "border-cyan-200" : "border-gray-200";
    const dropdownItem =
        "w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b last:border-b-0";
    const dropdownItemBorder = isEdit ? "border-cyan-50" : "border-gray-100";

    // Avatar ring
    const avatarRing = isEdit ? "ring-4 ring-cyan-100" : "ring-4 ring-white";

    // ———————————————— Local state cho trường/ngành
    const [universities, setUniversities] = useState<University[]>([]);
    const [majors, setMajors] = useState<Major[]>([]);
    const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
    const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);

    const [universitySearch, setUniversitySearch] = useState('');
    const [majorSearch, setMajorSearch] = useState('');
    const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
    const [showMajorDropdown, setShowMajorDropdown] = useState(false);

    // Extract list
    useEffect(() => {
        const uniqueUniversities: University[] = [];
        const uniqueMajors: Major[] = [];
        const universityIds = new Set<string>();
        const majorIds = new Set<string>();

        universityMajors.forEach(um => {
            if (!universityIds.has(um.university.name)) {
                uniqueUniversities.push({
                    id: um.university_id,
                    name: um.university.name,
                    code: um.university.code
                });
                universityIds.add(um.university.name);
            }
            if (!majorIds.has(um.major.name)) {
                uniqueMajors.push({
                    id: um.major_id,
                    name: um.major.name
                });
                majorIds.add(um.major.name);
            }
        });

        setUniversities(uniqueUniversities);
        setMajors(uniqueMajors);
    }, [universityMajors]);

    // Init selected
    useEffect(() => {
        if (subProfileInfo.university_major_id && universityMajors.length > 0) {
            const current = universityMajors.find(um => um.id === subProfileInfo.university_major_id);
            if (current) {
                const uni = {
                    id: current.university_id,
                    name: current.university.name,
                    code: current.university.code
                };
                const maj = {
                    id: current.major_id,
                    name: current.major.name
                };
                setSelectedUniversity(uni);
                setSelectedMajor(maj);
                setUniversitySearch(uni.name);
                setMajorSearch(maj.name);
            }
        } else {
            setSelectedUniversity(null);
            setSelectedMajor(null);
            setUniversitySearch('');
            setMajorSearch('');
        }
    }, [subProfileInfo.university_major_id, universityMajors]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleMouseDown = (event: MouseEvent) => {
            if (universityRef.current && !universityRef.current.contains(event.target as Node)) {
                setShowUniversityDropdown(false);
            }
            if (majorRef.current && !majorRef.current.contains(event.target as Node)) {
                setShowMajorDropdown(false);
            }
        };
        const handleTouchStart = (event: TouchEvent) => {
            if (universityRef.current && !universityRef.current.contains(event.target as Node)) {
                setShowUniversityDropdown(false);
            }
            if (majorRef.current && !majorRef.current.contains(event.target as Node)) {
                setShowMajorDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('touchstart', handleTouchStart);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('touchstart', handleTouchStart);
        };
    }, []);

    const handleUniversitySelect = (university: University) => {
        setSelectedUniversity(university);
        setUniversitySearch(university.name);
        setShowUniversityDropdown(false);

        if (selectedMajor) {
            const exists = universityMajors.some(
                um => um.university_id === university.id && um.major_id === selectedMajor.id
            );
            if (!exists) {
                setSelectedMajor(null);
                setMajorSearch('');
                setSubProfileInfo(prev => ({ ...prev, university_major_id: '' }));
            } else {
                const umx = universityMajors.find(
                    um => um.university_id === university.id && um.major_id === selectedMajor.id
                );
                if (umx) setSubProfileInfo(prev => ({ ...prev, university_major_id: umx.id }));
            }
        }
    };

    const handleMajorSelect = (major: Major) => {
        setSelectedMajor(major);
        setMajorSearch(major.name);
        setShowMajorDropdown(false);

        if (selectedUniversity) {
            const umx = universityMajors.find(
                um => um.university_id === selectedUniversity.id && um.major_id === major.id
            );
            if (umx) setSubProfileInfo(prev => ({ ...prev, university_major_id: umx.id }));
        }
    };

    const filteredUniversities = universities.filter(uni =>
        uni.name.toLowerCase().includes(universitySearch.toLowerCase())
    );

    const availableMajors = selectedUniversity
        ? majors.filter(major =>
            universityMajors.some(um =>
                um.university_id === selectedUniversity.id &&
                um.major_id === major.id &&
                major.name.toLowerCase().includes(majorSearch.toLowerCase())
            )
        )
        : majors.filter(major => major.name.toLowerCase().includes(majorSearch.toLowerCase()));

    const handleSaveBoth = async () => {
        try {
            await onSavePersonalInfo();
            await onSaveSubProfile();
        } catch (error) {
            console.error('Error saving profile data:', error);
        }
    };

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

            {/* Thông tin cơ bản */}
            <div className={panelBasicCls}>
                <h3 className={`text-lg font-semibold mb-6 flex items-center space-x-2 ${isEdit ? 'text-cyan-800' : 'text-gray-900'}`}>
                    <Camera className={`w-5 h-5 ${isEdit ? 'text-cyan-600' : 'text-blue-600'}`} />
                    <span>Thông tin cơ bản</span>
                </h3>

                {/* Avatar */}
                <div className="mb-6">
                    <label className={`${labelCls} mb-4`}>Ảnh đại diện</label>
                    <div className="flex items-center space-x-6">
                        <div className="relative">
                            <div className={`h-28 w-28 rounded-full overflow-hidden ${avatarRing} shadow-lg bg-gray-100`}>
                                {displayAvatar ? (
                                    <img src={displayAvatar} className="object-cover w-full h-full" alt="Avatar" />
                                ) : (
                                    <div className={`flex items-center justify-center h-full w-full ${isEdit ? 'bg-cyan-100' : 'bg-gradient-to-br from-cyan-500 to-blue-600'}`}>
                                        <Camera className={`${isEdit ? 'text-cyan-600' : 'text-white'} w-8 h-8`} />
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
                                    className="bg-white text-cyan-700 border-2 border-cyan-500/70 px-4 py-2 rounded-xl font-medium hover:bg-cyan-600 hover:text-white transition-all duration-300 flex items-center space-x-2 shadow-sm hover:shadow"
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

                {/* Basic Info Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className={labelCls}>
                            Họ và tên <span className="text-red-500">*</span>
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={personalInfo.name}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, name: e.target.value }))}
                                className={editInputCls}
                                disabled={isLoading}
                            />
                        ) : (
                            <div className={viewBoxCls}>
                                {personalInfo.name || 'Chưa cập nhật'}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className={labelCls}>Email</label>
                        <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-600">
                            {personalInfo.email}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={labelCls}>Số điện thoại</label>
                        {isEditing ? (
                            <input
                                type="tel"
                                value={personalInfo.phone_number}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, phone_number: e.target.value }))}
                                className={editInputCls}
                                disabled={isLoading}
                                placeholder="Nhập số điện thoại"
                            />
                        ) : (
                            <div className={viewBoxCls}>
                                {personalInfo.phone_number || 'Chưa cập nhật'}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className={labelCls}>Giới tính</label>
                        {isEditing ? (
                            <select
                                value={personalInfo.gender}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, gender: e.target.value }))}
                                className={editSelectCls}
                                disabled={isLoading}
                            >
                                <option value="">Chọn giới tính</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </select>
                        ) : (
                            <div className={viewBoxCls}>
                                {personalInfo.gender || 'Chưa cập nhật'}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 md:col-span-1">
                        <label className={labelCls}>Ngày sinh</label>
                        {isEditing ? (
                            <input
                                type="date"
                                value={personalInfo.birthdate}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, birthdate: e.target.value }))}
                                className={editInputCls}
                                disabled={isLoading}
                            />
                        ) : (
                            <div className={viewBoxCls}>
                                {personalInfo.birthdate ? new Date(personalInfo.birthdate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Thông tin bổ sung */}
            <div className={panelExtraCls}>
                <h3 className={`text-lg font-semibold mb-6 flex items-center space-x-2 ${isEdit ? 'text-emerald-800' : 'text-gray-900'}`}>
                    <GraduationCap className={`w-5 h-5 ${isEdit ? 'text-emerald-600' : 'text-green-600'}`} />
                    <span>Thông tin bổ sung</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* University */}
                    <div className="space-y-2">
                        <label className={`${labelCls} flex items-center space-x-2`}>
                            <GraduationCap className={`w-4 h-4 ${isEdit ? 'text-cyan-600' : 'text-blue-600'}`} />
                            <span>Trường đại học / Cao đẳng</span>
                        </label>
                        {isEditing ? (
                            <div className="relative" ref={universityRef}>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm trường học..."
                                    value={universitySearch}
                                    onChange={(e) => {
                                        setUniversitySearch(e.target.value);
                                        setShowUniversityDropdown(true);
                                    }}
                                    onFocus={() => setShowUniversityDropdown(true)}
                                    className={editInputCls}
                                    disabled={isLoading}
                                />
                                <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />

                                {showUniversityDropdown && (
                                    <div className={`${dropdownCls} ${dropdownBorder}`}>
                                        {filteredUniversities.length > 0 ? (
                                            filteredUniversities.map((university) => (
                                                <div
                                                    key={university.id}
                                                    onClick={() => handleUniversitySelect(university)}
                                                    className={`${dropdownItem} ${dropdownItemBorder} cursor-pointer`}
                                                >
                                                    <div className="font-medium text-gray-900">{university.name}</div>
                                                    <div className="text-sm text-gray-500">{university.code}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-gray-500 text-sm">
                                                Không tìm thấy trường nào
                                            </div>
                                        )}
                                    </div>
                                )}
                                {selectedUniversity && (
                                    <div className="mt-2 text-sm text-cyan-700 bg-cyan-50 px-3 py-2 rounded-lg">
                                        ✓ Đã chọn: {selectedUniversity.name}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={viewBoxCls}>
                                {selectedUniversity ? selectedUniversity.name : 'Chưa cập nhật'}
                            </div>
                        )}
                    </div>

                    {/* Major */}
                    <div className="space-y-2">
                        <label className={`${labelCls} flex items-center space-x-2`}>
                            <GraduationCap className={`w-4 h-4 ${isEdit ? 'text-emerald-600' : 'text-green-600'}`} />
                            <span>Ngành học</span>
                        </label>
                        {isEditing ? (
                            <div className="relative" ref={majorRef}>
                                <input
                                    type="text"
                                    placeholder={selectedUniversity ? "Tìm kiếm ngành học..." : "Vui lòng chọn trường trước"}
                                    value={majorSearch}
                                    onChange={(e) => {
                                        setMajorSearch(e.target.value);
                                        setShowMajorDropdown(true);
                                    }}
                                    onFocus={() => selectedUniversity && setShowMajorDropdown(true)}
                                    disabled={!selectedUniversity || isLoading}
                                    className={`${editInputCls} disabled:opacity-50 disabled:cursor-not-allowed`}
                                />
                                <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />

                                {showMajorDropdown && selectedUniversity && (
                                    <div className={`${dropdownCls} ${dropdownBorder}`}>
                                        {availableMajors.length > 0 ? (
                                            availableMajors.map((major) => (
                                                <div
                                                    key={major.id}
                                                    onClick={() => handleMajorSelect(major)}
                                                    className={`${dropdownItem} ${dropdownItemBorder} cursor-pointer`}
                                                >
                                                    <div className="font-medium text-gray-900">{major.name}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-gray-500 text-sm">
                                                Trường này chưa có ngành học nào
                                            </div>
                                        )}
                                    </div>
                                )}
                                {selectedMajor && (
                                    <div className="mt-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                                        ✓ Đã chọn: {selectedMajor.name}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={viewBoxCls}>
                                {selectedMajor ? selectedMajor.name : 'Chưa cập nhật'}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className={labelCls}>CV (Link)</label>
                        {isEditing ? (
                            <input
                                type="url"
                                value={subProfileInfo.cv}
                                onChange={(e) => setSubProfileInfo(prev => ({ ...prev, cv: e.target.value }))}
                                className={editInputCls}
                                disabled={isLoading}
                                placeholder="https://drive.google.com/file/d/..."
                            />
                        ) : (
                            <div className={viewBoxCls}>
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
                        <label className={`${labelCls} flex items-center space-x-2`}>
                            <Linkedin className={`w-4 h-4 ${isEdit ? 'text-cyan-600' : 'text-blue-600'}`} />
                            <span>LinkedIn</span>
                        </label>
                        {isEditing ? (
                            <input
                                type="url"
                                value={subProfileInfo.linkedin_url}
                                onChange={(e) => setSubProfileInfo(prev => ({ ...prev, linkedin_url: e.target.value }))}
                                className={editInputCls}
                                disabled={isLoading}
                                placeholder="https://linkedin.com/in/yourprofile"
                            />
                        ) : (
                            <div className={viewBoxCls}>
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
                        <label className={`${labelCls} flex items-center space-x-2`}>
                            <Github className="w-4 h-4 text-gray-800" />
                            <span>GitHub</span>
                        </label>
                        {isEditing ? (
                            <input
                                type="url"
                                value={subProfileInfo.github_url}
                                onChange={(e) => setSubProfileInfo(prev => ({ ...prev, github_url: e.target.value }))}
                                className={editInputCls}
                                disabled={isLoading}
                                placeholder="https://github.com/yourusername"
                            />
                        ) : (
                            <div className={viewBoxCls}>
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
                        <label className={`${labelCls} flex items-center space-x-2`}>
                            <Globe className={`w-4 h-4 ${isEdit ? 'text-emerald-600' : 'text-green-600'}`} />
                            <span>Portfolio/Website</span>
                        </label>
                        {isEditing ? (
                            <input
                                type="url"
                                value={subProfileInfo.portfolio_url}
                                onChange={(e) => setSubProfileInfo(prev => ({ ...prev, portfolio_url: e.target.value }))}
                                className={editInputCls}
                                disabled={isLoading}
                                placeholder="https://yourportfolio.com"
                            />
                        ) : (
                            <div className={viewBoxCls}>
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
                        <label className={labelCls}>Mô tả bản thân</label>
                        {isEditing ? (
                            <textarea
                                rows={4}
                                value={subProfileInfo.description}
                                onChange={(e) => setSubProfileInfo(prev => ({ ...prev, description: e.target.value }))}
                                className={editTextareaCls}
                                disabled={isLoading}
                                placeholder="Viết về bản thân, kinh nghiệm, mục tiêu nghề nghiệp..."
                            />
                        ) : (
                            <div className={`${viewBoxCls} min-h-[100px] whitespace-pre-wrap`}>
                                {subProfileInfo.description || 'Chưa cập nhật'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
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
                        onClick={handleSaveBoth}
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

export default CombinedProfileTab;
