'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    GraduationCap,
    BookOpen,
    FileText,
    ArrowRight,
    X,
    Check,
    Search
} from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/authStore';

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
    universities: University;
    majors: Major;
}

interface FormData {
    university_major_id: string;
    description: string;
}

export default function MenteeSetupPage() {
    const [formData, setFormData] = useState<FormData>({
        university_major_id: '',
        description: ''
    });

    const [universities, setUniversities] = useState<University[]>([]);
    const [majors, setMajors] = useState<Major[]>([]);
    const [universityMajors, setUniversityMajors] = useState<UniversityMajor[]>([]);

    const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
    const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);

    const [universitySearch, setUniversitySearch] = useState('');
    const [majorSearch, setMajorSearch] = useState('');
    const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
    const [showMajorDropdown, setShowMajorDropdown] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDataLoading, setIsDataLoading] = useState(true);

    // Refs for dropdown management
    const universityRef = useRef<HTMLDivElement>(null);
    const majorRef = useRef<HTMLDivElement>(null);

    const router = useRouter();
    const { user } = useAuthStore();

    // Handle click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (universityRef.current && !universityRef.current.contains(event.target as Node)) {
                setShowUniversityDropdown(false);
            }
            if (majorRef.current && !majorRef.current.contains(event.target as Node)) {
                setShowMajorDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    // Load universities and majors
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsDataLoading(true);

                // Load universities
                const { data: universitiesData, error: universitiesError } = await supabase
                    .from('universities')
                    .select('*')
                    .order('name');

                if (universitiesError) {
                    console.error('Error loading universities:', universitiesError);
                } else {
                    setUniversities(universitiesData || []);
                }

                // Load majors
                const { data: majorsData, error: majorsError } = await supabase
                    .from('majors')
                    .select('*')
                    .order('name');

                if (majorsError) {
                    console.error('Error loading majors:', majorsError);
                } else {
                    setMajors(majorsData || []);
                }

                // Load university-major combinations
                const { data: universityMajorsData, error: universityMajorsError } = await supabase
                    .from('university_majors')
                    .select(`
                        *,
                        universities (id, name, code),
                        majors (id, name)
                    `)
                    .order('universities(name), majors(name)');

                if (universityMajorsError) {
                    console.error('Error loading university majors:', universityMajorsError);
                } else {
                    setUniversityMajors(universityMajorsData || []);
                }

            } catch (err) {
                console.error('Error loading data:', err);
                setError('Không thể tải dữ liệu trường và ngành học');
            } finally {
                setIsDataLoading(false);
            }
        };

        loadData();
    }, []);

    const handleUniversitySelect = (university: University) => {
        console.log('Selecting university:', university.name);
        setSelectedUniversity(university);
        setUniversitySearch(university.name);
        setShowUniversityDropdown(false);

        // Reset major if it doesn't exist in the selected university
        if (selectedMajor) {
            const majorExistsInUniversity = universityMajors.some(
                um => um.university_id === university.id && um.major_id === selectedMajor.id
            );
            if (!majorExistsInUniversity) {
                setSelectedMajor(null);
                setMajorSearch('');
                setFormData(prev => ({ ...prev, university_major_id: '' }));
            } else {
                // Update university_major_id if the combination still exists
                const universityMajor = universityMajors.find(
                    um => um.university_id === university.id && um.major_id === selectedMajor.id
                );
                if (universityMajor) {
                    setFormData(prev => ({ ...prev, university_major_id: universityMajor.id }));
                }
            }
        }
    };

    const handleMajorSelect = (major: Major) => {
        console.log('Selecting major:', major.name);
        setSelectedMajor(major);
        setMajorSearch(major.name);
        setShowMajorDropdown(false);

        // Find the university-major combination
        if (selectedUniversity) {
            const universityMajor = universityMajors.find(
                um => um.university_id === selectedUniversity.id && um.major_id === major.id
            );
            if (universityMajor) {
                setFormData(prev => ({ ...prev, university_major_id: universityMajor.id }));
            }
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
        : majors.filter(major =>
            major.name.toLowerCase().includes(majorSearch.toLowerCase())
        );

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!user) {
            setError('Không tìm thấy thông tin người dùng');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Only create/update sub_profile if user selected university-major or has description
            if (formData.university_major_id || formData.description.trim()) {
                const { error: subProfileError } = await supabase
                    .from('sub_profiles')
                    .upsert({
                        profile_id: user.id,
                        university_major_id: formData.university_major_id || null,
                        description: formData.description.trim() || null
                    }, {
                        onConflict: 'profile_id'
                    });

                if (subProfileError) {
                    console.error('Error saving sub profile:', subProfileError);
                    setError('Không thể lưu thông tin. Vui lòng thử lại.');
                    return;
                }
            }

            console.log('✅ Mentee setup completed successfully');

            // Redirect to homepage
            router.push('/?welcome=mentee');

        } catch (err) {
            console.error('Error in mentee setup:', err);
            setError('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        router.push('/');
    };

    const handleBackToRoleSelection = () => {
        router.push('/auth/onboarding/role-selection');
    };

    if (isDataLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
            <div className="flex min-h-screen">
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-2xl w-full">
                        <div className="bg-white/80 backdrop-blur-sm py-12 px-8 shadow-2xl rounded-2xl border border-white/20">
                            {/* Header */}
                            <div className="text-center mb-12">
                                <div className="flex justify-center mb-8">
                                    <Image
                                        src="/HR-Comapnion-logo.png"
                                        alt="Logo"
                                        width={200}
                                        height={60}
                                        className="h-auto w-auto"
                                    />
                                </div>

                                <div className="mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <GraduationCap className="w-8 h-8 text-white" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                        Thiết lập hồ sơ Mentee
                                    </h1>
                                    <p className="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
                                        Chia sẻ thông tin về trường và ngành học của bạn để các mentor có thể hỗ trợ bạn tốt nhất.
                                    </p>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <div className="flex items-center">
                                        <X className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                                        <span className="text-sm text-red-700">{error}</span>
                                    </div>
                                </div>
                            )}

                            <form className="space-y-8" onSubmit={handleSubmit}>
                                {/* University Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        <GraduationCap className="w-4 h-4 inline mr-2" />
                                        Trường đại học / Cao đẳng (tùy chọn)
                                    </label>
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
                                            className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
                                        />
                                        <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />

                                        {showUniversityDropdown && (
                                            <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                                {filteredUniversities.length > 0 ? (
                                                    filteredUniversities.map((university) => (
                                                        <div
                                                            key={university.id}
                                                            onClick={() => handleUniversitySelect(university)}
                                                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer"
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
                                    </div>
                                    {selectedUniversity && (
                                        <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                                            ✓ Đã chọn: {selectedUniversity.name}
                                        </div>
                                    )}
                                </div>

                                {/* Major Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        <BookOpen className="w-4 h-4 inline mr-2" />
                                        Ngành học (tùy chọn)
                                    </label>
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
                                            disabled={!selectedUniversity}
                                            className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />

                                        {showMajorDropdown && selectedUniversity && (
                                            <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                                {availableMajors.length > 0 ? (
                                                    availableMajors.map((major) => (
                                                        <div
                                                            key={major.id}
                                                            onClick={() => handleMajorSelect(major)}
                                                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer"
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
                                    </div>
                                    {selectedMajor && (
                                        <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                                            ✓ Đã chọn: {selectedMajor.name}
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        <FileText className="w-4 h-4 inline mr-2" />
                                        Giới thiệu bản thân (tùy chọn)
                                    </label>
                                    <textarea
                                        placeholder="Chia sẻ về bản thân, mục tiêu nghề nghiệp, hoặc những gì bạn muốn được hỗ trợ..."
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white resize-none"
                                        maxLength={500}
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        {formData.description.length}/500 ký tự
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-4 justify-center items-center pt-6">
                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex items-center gap-3 px-8 py-4 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Đang lưu...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-5 h-5" />
                                                Hoàn tất thiết lập
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>

                                    {/* Secondary Actions */}
                                    <div className="flex flex-col sm:flex-row gap-3 text-center">
                                        <button
                                            type="button"
                                            onClick={handleSkip}
                                            disabled={isLoading}
                                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200 disabled:opacity-50 text-sm"
                                        >
                                            <X className="w-4 h-4" />
                                            Bỏ qua, hoàn thành sau
                                        </button>

                                        <span className="text-gray-400 hidden sm:block">•</span>

                                        <button
                                            type="button"
                                            onClick={handleBackToRoleSelection}
                                            disabled={isLoading}
                                            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 disabled:opacity-50 text-sm"
                                        >
                                            ← Quay về chọn vai trò
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {/* Info box */}
                            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-white text-xs font-bold">💡</span>
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-blue-800 font-medium mb-1">
                                            Tất cả thông tin đều là tùy chọn
                                        </p>
                                        <p className="text-blue-700 text-xs leading-relaxed">
                                            Bạn có thể để trống và hoàn thành sau, hoặc chỉ điền những thông tin bạn muốn chia sẻ.
                                            Thông tin này giúp các mentor hiểu rõ hơn về bạn để đưa ra lời khuyên phù hợp.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-6">
                            <p className="text-xs text-gray-500">
                                Bước cuối cùng để hoàn thiện hồ sơ mentee của bạn
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}