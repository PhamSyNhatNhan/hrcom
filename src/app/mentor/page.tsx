'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { MentorCard } from '@/component/MentorCard';
import { SectionHeader } from '@/component/SectionHeader';
import { createClient } from '@/utils/supabase/client';
import { Search, Filter, Users, ChevronDown, X, ChevronLeft, ChevronRight } from 'lucide-react';

const supabase = createClient();
const MENTORS_PER_PAGE = 12;

interface Mentor {
    id: string;
    full_name: string;
    headline: string;
    avatar: string;
    skill: string[];
    description?: string;
    published: boolean;
    created_at: string;
}

const MentorPage = () => {
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'newest' | 'oldest'>('name');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);

    // All available skills for filter
    const [availableSkills, setAvailableSkills] = useState<string[]>([]);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reset to first page when searching
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedSkills, sortBy]);

    // Scroll to top when currentPage changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    // Load mentors from database
    const fetchMentors = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('mentors')
                .select('*')
                .eq('published', true)
                .order('created_at', { ascending: false });

            if (fetchError) {
                throw fetchError;
            }

            const mentorsData = data || [];
            setMentors(mentorsData);

            // Extract all unique skills
            const allSkills = new Set<string>();
            mentorsData.forEach(mentor => {
                if (mentor.skill && Array.isArray(mentor.skill)) {
                    mentor.skill.forEach((skill: string) => {
                        if (skill && skill.trim()) {
                            allSkills.add(skill.trim());
                        }
                    });
                }
            });
            setAvailableSkills(Array.from(allSkills).sort());

        } catch (err) {
            console.error('Error loading mentors:', err);
            setError('Không thể tải danh sách mentor. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMentors();
    }, []);

    // Filter and search mentors
    const filteredMentors = useMemo(() => {
        let filtered = mentors;

        // Search by name or skill
        if (debouncedSearchTerm.trim()) {
            const searchLower = debouncedSearchTerm.toLowerCase();
            filtered = filtered.filter(mentor => {
                const nameMatch = mentor.full_name.toLowerCase().includes(searchLower);
                const headlineMatch = mentor.headline?.toLowerCase().includes(searchLower);
                const skillMatch = mentor.skill?.some(skill =>
                    skill.toLowerCase().includes(searchLower)
                );
                const descriptionMatch = mentor.description?.toLowerCase().includes(searchLower);

                return nameMatch || headlineMatch || skillMatch || descriptionMatch;
            });
        }

        // Filter by selected skills
        if (selectedSkills.length > 0) {
            filtered = filtered.filter(mentor => {
                if (!mentor.skill || !Array.isArray(mentor.skill)) return false;
                return selectedSkills.some(selectedSkill =>
                    mentor.skill.some(mentorSkill =>
                        mentorSkill.toLowerCase().includes(selectedSkill.toLowerCase())
                    )
                );
            });
        }

        // Sort mentors
        switch (sortBy) {
            case 'name':
                filtered.sort((a, b) => a.full_name.localeCompare(b.full_name, 'vi'));
                break;
            case 'newest':
                filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                break;
        }

        return filtered;
    }, [mentors, debouncedSearchTerm, selectedSkills, sortBy]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredMentors.length / MENTORS_PER_PAGE);
    const startIndex = (currentPage - 1) * MENTORS_PER_PAGE;
    const endIndex = startIndex + MENTORS_PER_PAGE;
    const currentMentors = filteredMentors.slice(startIndex, endIndex);

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Handle skill filter toggle
    const toggleSkillFilter = (skill: string) => {
        setSelectedSkills(prev =>
            prev.includes(skill)
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedSkills([]);
        setSortBy('name');
        setCurrentPage(1);
    };

    // Get active filter count
    const activeFilterCount = selectedSkills.length + (debouncedSearchTerm ? 1 : 0);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Đang tải danh sách mentor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={fetchMentors}
                        className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Hero Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <SectionHeader
                        title="CỐ VẤN CHUYÊN MÔN"
                        subtitle="Mentor hay Cố vấn chuyên môn là chuyên gia cung cấp nhiều kiến thức chuyên môn và một loạt các kỹ năng đa dạng khi tuyển dụng, đảm bảo rằng bất kỳ hoạt động hàng ngày nào của công ty đều hoạt động trơn tru."
                    />

                    {/* Search and Filter Section */}
                    <div className="mb-12 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 shadow-sm">
                        {/* Search Bar */}
                        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
                            <div className="relative flex-1 max-w-lg">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm mentor theo tên hoặc kỹ năng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Sort */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                                    className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                                >
                                    <option value="name">Sắp xếp theo tên</option>
                                    <option value="newest">Mới nhất</option>
                                    <option value="oldest">Cũ nhất</option>
                                </select>

                                {/* Filter Toggle */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-colors ${
                                        showFilters || activeFilterCount > 0
                                            ? 'bg-cyan-600 text-white'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <Filter className="w-4 h-4" />
                                    <span>Lọc</span>
                                    {activeFilterCount > 0 && (
                                        <span className="bg-white text-cyan-600 px-2 py-1 rounded-full text-xs font-bold">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Filter Panel */}
                        {showFilters && (
                            <div className="border-t border-gray-200 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Lọc theo kỹ năng</h3>
                                    {activeFilterCount > 0 && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                                        >
                                            Xóa tất cả bộ lọc
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {availableSkills.map((skill) => (
                                        <button
                                            key={skill}
                                            onClick={() => toggleSkillFilter(skill)}
                                            className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                                                selectedSkills.includes(skill)
                                                    ? 'bg-cyan-600 text-white'
                                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {skill}
                                        </button>
                                    ))}
                                </div>

                                {selectedSkills.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-600 mb-2">Kỹ năng đã chọn:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedSkills.map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="inline-flex items-center px-3 py-1 bg-cyan-100 text-cyan-800 text-sm rounded-full"
                                                >
                                                    {skill}
                                                    <button
                                                        onClick={() => toggleSkillFilter(skill)}
                                                        className="ml-2 text-cyan-600 hover:text-cyan-800"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Search Results Info */}
                        {(debouncedSearchTerm || selectedSkills.length > 0) && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="text-sm text-cyan-600">
                                    {debouncedSearchTerm && (
                                        <span>Tìm kiếm: "{debouncedSearchTerm}"</span>
                                    )}
                                    {debouncedSearchTerm && selectedSkills.length > 0 && <span> • </span>}
                                    {selectedSkills.length > 0 && (
                                        <span>{selectedSkills.length} kỹ năng được chọn</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mentors Grid */}
                    {currentMentors.length > 0 ? (
                        <>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                                {currentMentors.map((mentor) => (
                                    <MentorCard key={mentor.id} mentor={mentor} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex flex-col items-center space-y-4">
                                    {/* Pagination Info */}
                                    <div className="text-sm text-gray-600">
                                        Trang {currentPage} của {totalPages} • {filteredMentors.length} mentor
                                    </div>

                                    {/* Pagination Controls */}
                                    <div className="flex items-center space-x-2">
                                        {/* Previous Button */}
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                                                currentPage === 1
                                                    ? 'text-gray-400 cursor-not-allowed'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" />
                                            Trước
                                        </button>

                                        {/* Page Numbers */}
                                        <div className="flex items-center space-x-1">
                                            {getPageNumbers().map((pageNum, index) => (
                                                <React.Fragment key={index}>
                                                    {pageNum === '...' ? (
                                                        <span className="px-3 py-2 text-gray-400">...</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handlePageChange(pageNum as number)}
                                                            className={`px-3 py-2 rounded-lg transition-colors ${
                                                                currentPage === pageNum
                                                                    ? 'bg-cyan-600 text-white'
                                                                    : 'text-gray-700 hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>

                                        {/* Next Button */}
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                                                currentPage === totalPages
                                                    ? 'text-gray-400 cursor-not-allowed'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            Sau
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <Search className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Không tìm thấy mentor
                            </h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                {debouncedSearchTerm || selectedSkills.length > 0
                                    ? 'Không có mentor nào khớp với tiêu chí tìm kiếm của bạn. Hãy thử thay đổi từ khóa hoặc bộ lọc.'
                                    : 'Hiện tại chưa có mentor nào được xuất bản.'
                                }
                            </p>
                            {(debouncedSearchTerm || selectedSkills.length > 0) && (
                                <button
                                    onClick={clearFilters}
                                    className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default MentorPage;