'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SectionHeader } from '@/component/SectionHeader';
import { NewsCard } from '@/component/NewsCard';
import { LastNewsCard } from '@/component/LastNewsCard';
import { usePublishedPostsPaginated, usePublishedPosts } from '@/hooks/usePosts';
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const POSTS_PER_PAGE = 6;

// Create a separate component for the news content that uses useSearchParams
const NewsContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get initial values from URL
    const initialPage = parseInt(searchParams.get('page') || '1');
    const initialSearch = searchParams.get('search') || '';

    // States for search and pagination
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearch);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            if (searchTerm !== initialSearch) {
                setCurrentPage(1); // Reset to first page when searching
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, initialSearch]);

    // Update URL when page or search changes
    useEffect(() => {
        const params = new URLSearchParams();

        if (currentPage > 1) {
            params.set('page', currentPage.toString());
        }

        if (debouncedSearchTerm) {
            params.set('search', debouncedSearchTerm);
        }

        const newUrl = params.toString() ? `?${params.toString()}` : '';
        const currentPath = window.location.pathname + window.location.search;
        const newPath = window.location.pathname + newUrl;

        if (currentPath !== newPath) {
            // Use replace to avoid creating too many history entries
            router.replace(newPath, { scroll: false });
        }
    }, [currentPage, debouncedSearchTerm, router]);

    // Load paginated activity posts với server-side pagination
    const {
        posts: currentPosts,
        loading,
        error,
        totalCount,
        totalPages
    } = usePublishedPostsPaginated({
        type: 'activity',
        page: currentPage,
        limit: POSTS_PER_PAGE,
        search: debouncedSearchTerm
    });

    // Load latest posts cho sidebar (chỉ 4 bài mới nhất)
    const {
        posts: latestPosts
    } = usePublishedPosts({
        type: 'activity',
        limit: 4 // Chỉ load 4 bài cho sidebar
    });

    // Convert posts to NewsCard format - Ưu tiên description
    const convertToNewsFormat = (post: any) => {
        // Ưu tiên description, nếu không có thì dùng content
        let excerpt = '';
        if (post.description) {
            excerpt = post.description;
        } else if (post.content?.blocks) {
            excerpt = post.content.blocks
                .filter((block: any) => block.type === 'paragraph')
                .map((block: any) => block.data?.text || '')
                .join(' ')
                .replace(/<[^>]*>/g, '');
        }

        return {
            date: {
                day: new Date(post.created_at).getDate().toString(),
                month: new Date(post.created_at).toLocaleDateString('vi-VN', { month: 'short' }),
                year: new Date(post.created_at).getFullYear().toString()
            },
            image: post.thumbnail || '/Image-not-found.png',
            title: post.title,
            excerpt: excerpt.substring(0, 200) + (excerpt.length > 200 ? '...' : '') || 'Nội dung hoạt động...',
            category: 'TIN TỨC & SỰ KIỆN',
            href: `/posts/${post.id}`
        };
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearSearch = () => {
        setSearchTerm('');
        setCurrentPage(1);
    };

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

    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const endIndex = Math.min(startIndex + POSTS_PER_PAGE, totalCount);

    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
            <SectionHeader
                title="TIN TỨC & SỰ KIỆN"
                subtitle="Cập nhật những tin tức mới nhất, sự kiện nổi bật và hoạt động đang diễn ra tại HR Companion."
            />

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content - Left Side */}
                    <div className="lg:col-span-2">
                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
                                <span className="ml-4 text-gray-600 text-lg">Đang tải tin tức...</span>
                            </div>
                        ) : error ? (
                            <div className="text-center py-20">
                                <div className="text-red-500 text-lg mb-4">Có lỗi xảy ra khi tải tin tức</div>
                                <p className="text-gray-600">{error}</p>
                            </div>
                        ) : currentPosts.length > 0 ? (
                            <>
                                {/* Search Results Info */}
                                {debouncedSearchTerm && (
                                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                        <p className="text-blue-800">
                                            Tìm thấy <strong>{totalCount}</strong> tin tức cho từ khóa "{debouncedSearchTerm}"
                                        </p>
                                    </div>
                                )}

                                {/* Posts Grid */}
                                <div className="space-y-8">
                                    {currentPosts.map((post) => {
                                        const newsFormat = convertToNewsFormat(post);
                                        return (
                                            <NewsCard
                                                key={post.id}
                                                image={newsFormat.image}
                                                title={newsFormat.title}
                                                excerpt={newsFormat.excerpt}
                                                category={newsFormat.category}
                                                date={newsFormat.date}
                                                href={newsFormat.href}
                                                readTime={Math.ceil(newsFormat.excerpt.length / 200)}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-12 flex flex-col items-center space-y-4">
                                        {/* Pagination Info */}
                                        <div className="text-sm text-gray-600">
                                            Hiển thị {startIndex + 1}-{endIndex} trong {totalCount} tin tức
                                            {currentPage > 1 && (
                                                <span className="ml-2 text-cyan-600">
                                                    (Trang {currentPage}/{totalPages})
                                                </span>
                                            )}
                                        </div>

                                        {/* Pagination Controls */}
                                        <div className="flex items-center space-x-2">
                                            {/* Previous Button */}
                                            <button
                                                onClick={() => {
                                                    if (currentPage > 1) {
                                                        handlePageChange(currentPage - 1);
                                                    }
                                                }}
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
                                                onClick={() => {
                                                    if (currentPage < totalPages) {
                                                        handlePageChange(currentPage + 1);
                                                    }
                                                }}
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

                                        {/* Quick jump to first page if not on first page */}
                                        {currentPage > 1 && (
                                            <button
                                                onClick={() => handlePageChange(1)}
                                                className="text-sm text-cyan-600 hover:text-cyan-700 transition-colors"
                                            >
                                                ← Về trang đầu
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-20">
                                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Search className="w-12 h-12 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {debouncedSearchTerm ? 'Không tìm thấy tin tức' : 'Chưa có tin tức & sự kiện'}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {debouncedSearchTerm
                                        ? `Không có tin tức nào khớp với từ khóa "${debouncedSearchTerm}"`
                                        : 'Hiện tại chưa có tin tức & sự kiện nào được xuất bản.'
                                    }
                                </p>
                                {debouncedSearchTerm && (
                                    <button
                                        onClick={clearSearch}
                                        className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                                    >
                                        Xem tất cả tin tức
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Right Side */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-8">
                            {/* Search Box */}
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    Tìm kiếm
                                </h3>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm tin tức..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                                    />
                                    <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-cyan-600 transition-colors">
                                        <Search className="w-5 h-5" />
                                    </button>
                                </div>
                                {searchTerm && (
                                    <div className="mt-3">
                                        <button
                                            onClick={clearSearch}
                                            className="text-sm text-cyan-600 hover:text-cyan-700 transition-colors"
                                        >
                                            Xóa tìm kiếm
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Latest News */}
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                                    TIN TỨC MỚI NHẤT
                                </h3>

                                <div className="space-y-6">
                                    {latestPosts.slice(0, 4).map((post) => {
                                        const newsFormat = convertToNewsFormat(post);
                                        return (
                                            <LastNewsCard
                                                key={post.id}
                                                article={{
                                                    title: newsFormat.title,
                                                    date: newsFormat.date,
                                                    href: newsFormat.href,
                                                    excerpt: newsFormat.excerpt.substring(0, 100) + '...',
                                                    category: 'Tin tức & Sự kiện',
                                                    readTime: Math.ceil(newsFormat.excerpt.length / 200),
                                                    image: newsFormat.image
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Loading fallback component
const NewsLoading = () => (
    <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
                <span className="ml-4 text-gray-600 text-lg">Đang tải...</span>
            </div>
        </div>
    </div>
);

// Main component with Suspense wrapper
const NewsPage = () => {
    return (
        <div>
            <Suspense fallback={<NewsLoading />}>
                <NewsContent />
            </Suspense>
        </div>
    );
};

export default NewsPage;