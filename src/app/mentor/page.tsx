'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { MentorCard } from '@/component/MentorCard';
import { SectionHeader } from '@/component/SectionHeader';
import { supabase } from '@/utils/supabase/client';
import { Search, Filter, X, ChevronLeft, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import { Mentor, MentorSortOption } from '@/types/mentor_user';

const MENTORS_PER_PAGE = 12;

const MentorPage = () => {
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState<MentorSortOption>('name');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    // All available skills for filter
    const [availableSkills, setAvailableSkills] = useState<string[]>([]);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedSkills, sortBy]);

    // Close sort dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.sort-dropdown-container')) {
                setShowSortDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll to top when currentPage changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    // Load mentors using RPC function
    const fetchMentors = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .rpc('get_mentors_with_stats');

            if (fetchError) {
                throw fetchError;
            }

            if (!data || data.length === 0) {
                setMentors([]);
                setAvailableSkills([]);
                return;
            }

            // Transform the data
            const transformedMentors: Mentor[] = data.map((mentor: any) => ({
                ...mentor,
                skills: mentor.skills || [],
                total_bookings: Number(mentor.total_bookings) || 0,
                completed_bookings: Number(mentor.completed_bookings) || 0,
                average_rating: Number(mentor.average_rating) || 0,
                total_reviews: Number(mentor.total_reviews) || 0
            }));

            setMentors(transformedMentors);

            // Extract all unique skills
            const allSkills = new Set<string>();
            transformedMentors.forEach(mentor => {
                if (mentor.skills && Array.isArray(mentor.skills)) {
                    mentor.skills.forEach(skill => {
                        if (skill && skill.name && skill.name.trim()) {
                            allSkills.add(skill.name.trim());
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

        // Search by name, headline, description, or skills
        if (debouncedSearchTerm.trim()) {
            const searchLower = debouncedSearchTerm.toLowerCase();
            filtered = filtered.filter(mentor => {
                const nameMatch = mentor.full_name.toLowerCase().includes(searchLower);
                const headlineMatch = mentor.headline?.toLowerCase().includes(searchLower);
                const descriptionMatch = mentor.description?.toLowerCase().includes(searchLower);
                const skillMatch = mentor.skills?.some(skill =>
                    skill.name.toLowerCase().includes(searchLower)
                );

                return nameMatch || headlineMatch || descriptionMatch || skillMatch;
            });
        }

        // Filter by selected skills
        if (selectedSkills.length > 0) {
            filtered = filtered.filter(mentor => {
                return selectedSkills.some(selectedSkill => {
                    return mentor.skills?.some(skill =>
                        skill.name.toLowerCase().includes(selectedSkill.toLowerCase())
                    );
                });
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
            case 'rating':
                filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
                break;
            case 'popular':
                filtered.sort((a, b) => (b.total_bookings || 0) - (a.total_bookings || 0));
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

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const toggleSkillFilter = (skill: string) => {
        setSelectedSkills(prev =>
            prev.includes(skill)
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedSkills([]);
        setSortBy('name');
        setCurrentPage(1);
    };

    const activeFilterCount = selectedSkills.length + (debouncedSearchTerm ? 1 : 0);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
                <style jsx>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                    .animate-spin {
                        animation: spin 1s linear infinite;
                    }
                `}</style>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-cyan-600 mx-auto mb-4"></div>
                    <p className="text-gray-700 text-lg font-medium">Đang tải danh sách mentor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={fetchMentors}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-50 via-white to-blue-50">
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }

                /* Smooth slide down/up animation - No jank solution */
                .filter-panel-wrapper {
                    display: grid;
                    transition: grid-template-rows 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .filter-panel-enter {
                    grid-template-rows: 0fr;
                }

                .filter-panel-active {
                    grid-template-rows: 1fr;
                }

                .filter-panel-content {
                    overflow: hidden;
                    transition: opacity 0.35s ease-out;
                }

                .filter-panel-enter .filter-panel-content {
                    opacity: 0;
                    transition: opacity 0.25s ease-in;
                }

                .filter-panel-active .filter-panel-content {
                    opacity: 1;
                    transition: opacity 0.35s ease-out 0.15s;
                }

                /* Custom dropdown animations */
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.2s ease-out;
                }

                /* Stagger animation for skill buttons */
                @keyframes skillFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

            `}</style>

            {/* Hero Section */}
            <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <SectionHeader
                        title="CỐ VẤN CHUYÊN MÔN"
                        subtitle="Mentor hay Cố vấn chuyên môn là chuyên gia cung cấp nhiều kiến thức chuyên môn và một loạt các kỹ năng đa dạng khi tuyển dụng, đảm bảo rằng bất kỳ hoạt động hàng ngày nào của công ty đều hoạt động trơn tru."
                    />

                    {/* Modern Search Section */}
                    <div className="mb-8 sm:mb-12 bg-white rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border border-gray-100">
                        {/* Search Bar - Single Row on Desktop */}
                        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                            {/* Main Search Input */}
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm mentor theo tên hoặc kỹ năng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 sm:pl-11 pr-10 sm:pr-12 py-3 sm:py-4 text-sm sm:text-base text-gray-900 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center"
                                    >
                                        <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                    </button>
                                )}
                            </div>

                            {/* Sort & Filter Row */}
                            <div className="flex items-stretch gap-2 sm:gap-3">
                                {/* Custom Sort Dropdown */}
                                <div className="relative flex-1 lg:flex-initial sort-dropdown-container">
                                    <button
                                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                                        className="w-full lg:w-auto flex items-center justify-between gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-50 hover:bg-white transition-all duration-200 text-gray-700 text-sm sm:text-base font-medium"
                                    >
                                        <span>
                                            {sortBy === 'name' && 'Theo tên'}
                                            {sortBy === 'newest' && 'Mới nhất'}
                                            {sortBy === 'oldest' && 'Cũ nhất'}
                                            {sortBy === 'rating' && 'Đánh giá'}
                                            {sortBy === 'popular' && 'Phổ biến'}
                                        </span>
                                        <TrendingUp className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showSortDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-slideDown">
                                            {[
                                                { value: 'name', label: 'Theo tên' },
                                                { value: 'newest', label: 'Mới nhất' },
                                                { value: 'oldest', label: 'Cũ nhất' },
                                                { value: 'rating', label: 'Đánh giá' },
                                                { value: 'popular', label: 'Phổ biến' }
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setSortBy(option.value as MentorSortOption);
                                                        setShowSortDropdown(false);
                                                    }}
                                                    className={`w-full text-left px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base transition-colors ${
                                                        sortBy === option.value
                                                            ? 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 font-semibold'
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Filter Button */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`relative flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-4 rounded-2xl transition-all duration-300 font-medium text-sm sm:text-base whitespace-nowrap transform hover:scale-105 active:scale-95 ${
                                        showFilters || activeFilterCount > 0
                                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg hover:shadow-xl'
                                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-md'
                                    }`}
                                >
                                    <Filter className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                                    <span>Kỹ năng</span>
                                    {activeFilterCount > 0 && (
                                        <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full min-w-[20px] sm:min-w-[24px] text-center shadow-lg animate-pulse">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Filter Panel with Smooth Animation */}
                        <div className={`filter-panel-wrapper ${showFilters ? 'filter-panel-active' : 'filter-panel-enter'}`}>
                            <div className="filter-panel-content">
                                <div className="border-t border-gray-100 pt-4 sm:pt-6 mt-4 sm:mt-6">
                                    <div className="flex items-center justify-between mb-4 sm:mb-5">
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600" />
                                            <span className="hidden sm:inline">Lọc theo kỹ năng</span>
                                            <span className="sm:hidden">Kỹ năng</span>
                                        </h3>
                                        {activeFilterCount > 0 && (
                                            <button
                                                onClick={clearFilters}
                                                className="text-xs sm:text-sm text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-1 transition-colors"
                                            >
                                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                                <span className="hidden sm:inline">Xóa tất cả</span>
                                                <span className="sm:hidden">Xóa</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {availableSkills.map((skill, index) => (
                                            <button
                                                key={skill}
                                                onClick={() => toggleSkillFilter(skill)}
                                                style={{
                                                    animation: showFilters ? `skillFadeIn 0.3s ease-out ${index * 0.03}s both` : 'none'
                                                }}
                                                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                                                    selectedSkills.includes(skill)
                                                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md transform scale-105'
                                                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:border-gray-300 hover:scale-105'
                                                }`}
                                            >
                                                {skill}
                                            </button>
                                        ))}
                                    </div>

                                    {selectedSkills.length > 0 && (
                                        <div className="mt-4 sm:mt-5 p-3 sm:p-4 bg-cyan-50 rounded-xl border border-cyan-100">
                                            <p className="text-xs sm:text-sm text-cyan-800 font-medium mb-2">Kỹ năng đã chọn:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedSkills.map((skill) => (
                                                    <span
                                                        key={skill}
                                                        className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white text-cyan-700 text-xs sm:text-sm font-medium rounded-lg border border-cyan-200 shadow-sm"
                                                    >
                                                        <span className="truncate max-w-[120px] sm:max-w-none">{skill}</span>
                                                        <button
                                                            onClick={() => toggleSkillFilter(skill)}
                                                            className="text-cyan-600 hover:text-cyan-800 transition-colors flex-shrink-0"
                                                        >
                                                            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Active Search Info */}
                        {(debouncedSearchTerm || selectedSkills.length > 0) && (
                            <div className="mt-4 sm:mt-5 p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-blue-800">
                                    <Search className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                    {debouncedSearchTerm && (
                                        <span className="break-all">Tìm: <strong>"{debouncedSearchTerm}"</strong></span>
                                    )}
                                    {debouncedSearchTerm && selectedSkills.length > 0 && <span>•</span>}
                                    {selectedSkills.length > 0 && (
                                        <span><strong>{selectedSkills.length}</strong> kỹ năng</span>
                                    )}
                                    <span>•</span>
                                    <span><strong>{filteredMentors.length}</strong> kết quả</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mentors Grid */}
                    {currentMentors.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
                                {currentMentors.map((mentor) => (
                                    <MentorCard key={mentor.id} mentor={mentor} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex flex-col items-center space-y-4 sm:space-y-6 py-6 sm:py-8">
                                    <div className="text-xs sm:text-sm text-gray-600 font-medium bg-white px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-sm border border-gray-100">
                                        Trang <span className="font-bold text-cyan-600">{currentPage}</span> / {totalPages}
                                        <span className="mx-2">•</span>
                                        <span className="font-bold text-cyan-600">{filteredMentors.length}</span> mentor
                                    </div>

                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-xl font-medium text-xs sm:text-base transition-all duration-200 ${
                                                currentPage === 1
                                                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                    : 'text-gray-700 bg-white hover:bg-gradient-to-r hover:from-cyan-600 hover:to-blue-600 hover:text-white shadow-sm hover:shadow-md border border-gray-200'
                                            }`}
                                        >
                                            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span className="hidden sm:inline">Trước</span>
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {getPageNumbers().map((pageNum, index) => (
                                                <React.Fragment key={index}>
                                                    {pageNum === '...' ? (
                                                        <span className="px-2 sm:px-4 py-2 text-gray-400 font-medium text-xs sm:text-base">...</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handlePageChange(pageNum as number)}
                                                            className={`min-w-[36px] sm:min-w-[44px] px-2 sm:px-4 py-2 sm:py-3 rounded-xl font-semibold text-xs sm:text-base transition-all duration-200 ${
                                                                currentPage === pageNum
                                                                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg scale-110'
                                                                    : 'text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-xl font-medium text-xs sm:text-base transition-all duration-200 ${
                                                currentPage === totalPages
                                                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                    : 'text-gray-700 bg-white hover:bg-gradient-to-r hover:from-cyan-600 hover:to-blue-600 hover:text-white shadow-sm hover:shadow-md border border-gray-200'
                                            }`}
                                        >
                                            <span className="hidden sm:inline">Sau</span>
                                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 sm:py-20">
                            <div className="max-w-md mx-auto px-4">
                                <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8">
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-full opacity-50 animate-pulse"></div>
                                    <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-gray-100">
                                        <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                                    </div>
                                </div>

                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                                    Không tìm thấy mentor
                                </h3>

                                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                                    {debouncedSearchTerm || selectedSkills.length > 0
                                        ? 'Không có mentor nào khớp với tiêu chí tìm kiếm của bạn. Hãy thử thay đổi từ khóa hoặc bộ lọc.'
                                        : 'Hiện tại chưa có mentor nào được xuất bản.'
                                    }
                                </p>

                                {(debouncedSearchTerm || selectedSkills.length > 0) && (
                                    <div className="space-y-4">
                                        <button
                                            onClick={clearFilters}
                                            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold text-sm sm:text-base hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                            Xóa tất cả bộ lọc
                                        </button>

                                        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
                                            {debouncedSearchTerm && (
                                                <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 rounded-lg">
                                                    Từ khóa: <span className="font-semibold text-gray-700">"{debouncedSearchTerm}"</span>
                                                </div>
                                            )}
                                            {selectedSkills.length > 0 && (
                                                <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 rounded-lg">
                                                    Kỹ năng: <span className="font-semibold text-gray-700">{selectedSkills.length} đã chọn</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default MentorPage;