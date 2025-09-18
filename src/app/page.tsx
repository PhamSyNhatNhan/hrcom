'use client';
import React, { useState, useEffect } from 'react';
import {
    UserCheck,
    BookOpenCheck,
    FileText,
    Mic,
} from 'lucide-react';
import { StatCard } from '@/component/StatCard';
import { MentorCard } from '@/component/MentorCard';
import { Button } from '@/component/Button';
import { SectionHeader } from '@/component/SectionHeader';
import { ImageCarousel } from '@/component/ImageCarousel';
import { ActivityCard} from '@/component/ActivityCard';
import { PostCard } from '@/component/PostCard';
import { PartnerCard } from '@/component/PartnerCard';
import { usePublishedPosts } from '@/hooks/usePosts';
import Link from "next/link";
import { supabase } from '@/utils/supabase/client';
import { useAuthStore } from "@/stores/authStore";

const fallbackStats = [
    {icon: UserCheck, value: '89', label: 'Mentor đồng hành',},
    {icon: BookOpenCheck, value: '120', label: 'Hướng dẫn',},
    {icon: FileText, value: '15000+', label: 'SV tham gia chỉnh sửa CV',},
    {icon: Mic, value: '15000+', label: 'Đăng ký cuộc phỏng vấn',},
];

const fallbackPartners = [
    { imageSrc: '/partner/Logo-JobUp.jpg', href: '#' },
    { imageSrc: '/partner/logo-topcv.jpg', href: '#' },
    { imageSrc: '/partner/CareerBuilder_with-tagline-in-Vietnam.png', href: '#' },
    { imageSrc: '/partner/logo-IDM.png', href: '#' },
    { imageSrc: '/partner/FSOFT.png', href: '#' },
    { imageSrc: '/partner/GITIHON.png', href: '#' },
    { imageSrc: '/partner/Logo-DH-Phenikaa.jpg', href: '#' },
    { imageSrc: '/partner/Logo-DH-xaydung.jpg', href: '#' },
    { imageSrc: '/partner/Logo-HVTC.jpg', href: '#' },
    { imageSrc: '/partner/Logo-TMU.jpg', href: '#' },
];

const fallbackActivities = [
    {
        href: '/activity',
        imageSrc: '/hrcompanion1-1-900x540.jpg',
        imageAlt: 'img alt',
        title: 'Đào tạo viết CV & phỏng vấn',
        description:
            'Tổ chức các khoá đào tạo kỹ năng viết CV & phỏng vấn ứng tuyển chuyên nghiệp',
    },
    {
        href: '/activity',
        imageSrc: '/hrcompanion1-10-900x540.jpg',
        imageAlt: 'img alt',
        title: 'Đào tạo kỹ năng mềm',
        description:
            'Triển khai các hoạt động đào tạo kỹ năng mềm cho sinh viên và người đi làm',
    },
    {
        href: '/activity',
        imageSrc: '/hrcompanion1-11-900x540.jpg',
        imageAlt: 'img alt',
        title: 'Kết nối doanh nghiệp - trường học',
        description:
            'Là cầu nối triển khai các hoạt động hợp tác giữa các doanh nghiệp và các trường ĐH-CĐ',
    },
    {
        href: '/activity',
        imageSrc: '/hrcompanion1-12-900x540.jpg',
        imageAlt: 'img alt',
        title: 'Giới thiệu việc làm & kết nối tuyển dụng',
        description:
            'Hỗ trợ giới thiệu việc làm, kết nối ứng viên và nhà tuyển dụng',
    },
    {
        href: '/activity',
        imageSrc: '/hrcompanion1-14-900x540.jpg',
        imageAlt: 'img alt',
        title: 'Quỹ học bổng & hỗ trợ',
        description:
            'Thành lập, vận hành và kết nối các quỹ học bổng, quỹ hỗ trợ dành cho các bạn khó khăn',
    },
    {
        href: '/activity',
        imageSrc: '/hrcompanion1-17.jpg',
        imageAlt: 'img alt',
        title: 'Mạng lưới tư vấn & mentor đồng hành',
        description:
            'Thiết lập mạng tư vấn viên, mentor đồng hành cùng DN và ứng viên',
    },
];

// Fallback banners
const fallbackBanners = [
    {
        id: 'fallback-1',
        name: 'HR Companion Banner 1',
        image_url: '/Background/hr-companion-bannerB01.jpg',
        link_url: 'https://hrcompanion.vn',
        open_new_tab: true
    },
    {
        id: 'fallback-2',
        name: 'HR Companion Banner 2',
        image_url: '/Background/hr-companion-bannerB02.jpg',
        link_url: 'https://hrcompanion.vn',
        open_new_tab: true
    },
    {
        id: 'fallback-3',
        name: 'HR Companion Banner 3',
        image_url: '/Background/hr-companion-bannerB03.jpg',
        link_url: 'https://hrcompanion.vn',
        open_new_tab: true
    }
];

// Interfaces for database data
interface StatisticFromDB {
    id: string;
    name: string;
    icon: string;
    label: string;
    value: string;
    display_order: number;
}

interface ActivityFromDB {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    display_order: number;
}

interface PartnerFromDB {
    id: string;
    name: string;
    description?: string;
    logo_url: string;
    website_url?: string;
    display_order: number;
}

interface BannerFromDB {
    id: string;
    name: string;
    image_url: string;
    link_url?: string;
    open_new_tab: boolean;
    display_order: number;
}

// FIXED: Use same interface as MentorPage and MentorCard
interface MentorSkill {
    id: string;
    name: string;
    description?: string;
}

interface MentorFromDB {
    id: string;
    full_name: string;
    headline?: string;
    avatar?: string;
    skill?: string[]; // Legacy field
    skills?: MentorSkill[]; // New structure
    description?: string;
    published: boolean;
    created_at: string;
    // Statistics
    total_bookings?: number;
    completed_bookings?: number;
    average_rating?: number;
    total_reviews?: number;
}

// Homepage data structure
interface HomepageData {
    statistics: StatisticFromDB[];
    activities: ActivityFromDB[];
    partners: PartnerFromDB[];
    banners: BannerFromDB[];
}

// Helper function to map icon names to components
const getIconComponent = (iconName: string) => {
    switch (iconName) {
        case 'UserCheck':
            return UserCheck;
        case 'BookOpenCheck':
            return BookOpenCheck;
        case 'FileText':
            return FileText;
        case 'Mic':
            return Mic;
        default:
            return UserCheck;
    }
};

const HomePage = () => {
    // Load featured posts from database
    const {
        posts: featuredBlogPosts,
        loading: blogLoading
    } = usePublishedPosts({
        type: 'blog',
        limit: 4
    });

    // Homepage data states
    const [homepageData, setHomepageData] = useState<HomepageData | null>(null);
    const [homepageLoading, setHomepageLoading] = useState(true);
    const [homepageError, setHomepageError] = useState<string | null>(null);


    // Mentor states
    const [featuredMentors, setFeaturedMentors] = useState<MentorFromDB[]>([]);
    const [mentorsLoading, setMentorsLoading] = useState(true);
    const [mentorsError, setMentorsError] = useState<string | null>(null);

    const { user } = useAuthStore();
    const isLoggedIn = !!user;

    // Load homepage data using the SQL function
    useEffect(() => {
        const loadHomepageData = async () => {
            try {
                setHomepageLoading(true);
                setHomepageError(null);

                const { data, error } = await supabase.rpc('get_homepage_data');

                if (error) {
                    throw error;
                }

                if (data) {
                    setHomepageData(data);
                } else {
                    // Use fallback data if no data from database
                    setHomepageData({
                        statistics: [],
                        activities: [],
                        partners: [],
                        banners: []
                    });
                }
            } catch (err) {
                console.error('Error loading homepage data:', err);
                setHomepageError('Không thể tải dữ liệu trang chủ');
                // Set fallback data on error
                setHomepageData({
                    statistics: [],
                    activities: [],
                    partners: [],
                    banners: []
                });
            } finally {
                setHomepageLoading(false);
            }
        };

        loadHomepageData();
    }, []);

    // FIXED: Load featured mentors with statistics (same as MentorPage)
    useEffect(() => {
        const loadFeaturedMentors = async () => {
            try {
                setMentorsLoading(true);
                setMentorsError(null);

                // Fetch basic mentor data
                const { data: mentorsData, error: fetchError } = await supabase
                    .from('mentors')
                    .select('*')
                    .eq('published', true)
                    .order('created_at', { ascending: false })
                    .limit(4);

                if (fetchError) {
                    throw fetchError;
                }

                if (!mentorsData || mentorsData.length === 0) {
                    setFeaturedMentors([]);
                    return;
                }

                // Fetch additional data for each mentor in parallel (same logic as MentorPage)
                const mentorsWithStats = await Promise.all(
                    mentorsData.map(async (mentor) => {
                        try {
                            // Fetch skills from mentor_skill_relations
                            const { data: skillsData } = await supabase
                                .from('mentor_skill_relations')
                                .select(`
                                    mentor_skills (
                                        id,
                                        name,
                                        description
                                    )
                                `)
                                .eq('mentor_id', mentor.id);

                            // Fetch booking statistics
                            const { data: bookingsData } = await supabase
                                .from('mentor_bookings')
                                .select('id, status')
                                .eq('mentor_id', mentor.id);

                            // Fetch reviews and calculate average rating
                            const { data: reviewsData } = await supabase
                                .from('mentor_reviews')
                                .select('rating')
                                .eq('mentor_id', mentor.id)
                                .eq('is_published', true);

                            const totalBookings = bookingsData?.length || 0;
                            const completedBookings = bookingsData?.filter((b: any) => b.status === 'completed').length || 0;
                            const totalReviews = reviewsData?.length || 0;
                            const averageRating = totalReviews > 0 && reviewsData
                                ? reviewsData.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / totalReviews
                                : 0;

                            // Transform skills data
                            const skills = skillsData?.map((item: any) => item.mentor_skills).filter(Boolean) || [];

                            return {
                                ...mentor,
                                skills,
                                total_bookings: totalBookings,
                                completed_bookings: completedBookings,
                                average_rating: averageRating,
                                total_reviews: totalReviews
                            } as MentorFromDB;
                        } catch (err) {
                            console.error(`Error fetching data for mentor ${mentor.id}:`, err);
                            // Return mentor with basic data if stats fetch fails
                            return {
                                ...mentor,
                                skills: [],
                                total_bookings: 0,
                                completed_bookings: 0,
                                average_rating: 0,
                                total_reviews: 0
                            } as MentorFromDB;
                        }
                    })
                );

                setFeaturedMentors(mentorsWithStats);
            } catch (err) {
                console.error('Error loading featured mentors:', err);
                setMentorsError('Không thể tải danh sách mentor');
            } finally {
                setMentorsLoading(false);
            }
        };

        loadFeaturedMentors();
    }, []);

    // Get data with fallbacks
    const stats = homepageData?.statistics?.length
        ? homepageData.statistics.map(stat => ({
            icon: getIconComponent(stat.icon),
            value: stat.value,
            label: stat.label
        }))
        : fallbackStats;

    const activities = homepageData?.activities?.length
        ? homepageData.activities.map(activity => ({
            href: '/activity',
            imageSrc: activity.thumbnail,
            imageAlt: activity.title,
            title: activity.title,
            description: activity.description
        }))
        : fallbackActivities;

    const partners = homepageData?.partners?.length
        ? homepageData.partners.map(partner => ({
            imageSrc: partner.logo_url,
            href: partner.website_url || '#'
        }))
        : fallbackPartners;

    const banners = homepageData?.banners?.length
        ? homepageData.banners
        : fallbackBanners;

    return (
        <div>
            {/* Intro Section */}
            <section className="relative bg-gradient-to-r from-cyan-50 to-blue-50 pb-16">
                {/* Background Image Carousel - responsive aspect ratio */}
                <div className="relative w-full aspect-[16/9] sm:h-[500px]">
                    {homepageLoading ? (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                            <span className="ml-2 text-gray-600">Đang tải banner...</span>
                        </div>
                    ) : (
                        <ImageCarousel
                            banners={banners}
                            className="w-full h-full object-cover"
                            showArrows={true}
                            showDots={true}
                            autoPlay={true}
                            interval={4000}
                        />
                    )}

                    {/* Overlay gradient - tạo nền xám nhẹ cho toàn bộ banner nhưng không chặn click */}
                    <div className="absolute inset-0 bg-black/30 pointer-events-none" />
                </div>

                <div className="relative z-20 -mt-[80px] sm:-mt-[125px] px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white rounded-3xl p-8 shadow-2xl">
                            {/* Title & Description */}
                            <div className="text-center mb-8">
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-gray-800">
                                    Người đồng hành nhân sự
                                </h1>

                                <p className="text-base sm:text-lg text-gray-600 mb-6 max-w-[1006px] mx-auto leading-relaxed">
                                    <Link
                                        href="https://hrcompanion.vn"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline font-medium"
                                    >
                                        HR Companion
                                    </Link>{' '}
                                    là Doanh nghiệp xã hội – dự án cộng đồng phi lợi nhuận được vận hành bởi nhiều nhà tuyển dụng,
                                    nhân sự đang làm việc tại các công ty tập đoàn trên khắp cả nước với sứ mệnh nâng cao các hành
                                    trang ứng tuyển (kỹ năng viết CV, Kỹ năng phỏng vấn, tìm kiếm việc làm phù hợp) giúp ứng viên
                                    chinh phục được cơ hội việc làm mơ ước.
                                </p>
                            </div>

                            {/* Stats Section */}
                            {homepageLoading ? (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="text-center animate-pulse">
                                            <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-4"></div>
                                            <div className="h-8 bg-gray-200 rounded mb-2"></div>
                                            <div className="h-4 bg-gray-200 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    {stats.map((stat, index) => (
                                        <StatCard
                                            key={index}
                                            icon={stat.icon}
                                            value={stat.value}
                                            label={stat.label}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Activity Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <SectionHeader
                        title="HOẠT ĐỘNG NỔI BẬT HR COMPANION"
                        subtitle="Kết nối – Tư vấn – Đồng hành cùng mentor nhân sự giàu kinh nghiệm"
                    />

                    {homepageLoading ? (
                        <div className="mt-16 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="relative h-72 sm:h-80 md:h-96 rounded-xl bg-gray-200"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-16 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {activities.map((activity, index) => (
                                <ActivityCard key={index} activity={activity} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Mentor Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-50 to-blue-50 pb-16">
                <div className="max-w-7xl mx-auto">
                    <SectionHeader
                        title="CỐ VẤN CHUYÊN MÔN"
                        subtitle="Mentor hay Cố vấn chuyên môn là chuyên gia cung cấp nhiều kiến thức chuyên môn và một loạt các kỹ năng đa dạng khi tuyển dụng, đảm bảo rằng bất kỳ hoạt động hàng ngày nào của công ty đều hoạt động trơn tru."
                    />

                    {/* Mentor Loading State */}
                    {mentorsLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                            <span className="ml-2 text-gray-600">Đang tải mentor...</span>
                        </div>
                    ) : mentorsError ? (
                        <div className="text-center py-12">
                            <p className="text-red-600 mb-4">{mentorsError}</p>
                            <Link href="/mentor">
                                <Button variant="secondary">Xem tất cả mentor</Button>
                            </Link>
                        </div>
                    ) : featuredMentors.length > 0 ? (
                        <>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {featuredMentors.map((mentor) => (
                                    <MentorCard key={mentor.id} mentor={mentor} />
                                ))}
                            </div>
                            <div className="text-center mt-12">
                                <Link href="/mentor">
                                    <Button variant="secondary">TẤT CẢ MENTOR HR COMPANION</Button>
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-600 mb-6">Chưa có mentor nào được xuất bản.</p>
                            <Link href="/mentor">
                                <Button variant="secondary">Khám phá Mentor</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Partner Section */}
            <section id="partner-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-white pb-16">
                <div className="max-w-7xl mx-auto">
                    <SectionHeader
                        title="ĐỐI TÁC HR COMPANION"
                        subtitle="HR Companion tự hào hợp tác cùng các tổ chức, doanh nghiệp và chuyên gia để lan tỏa giá trị bền vững trong quản trị nhân sự."
                    />

                    {homepageLoading ? (
                        <div className="flex flex-wrap justify-center gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                                <div key={i} className="w-40 sm:w-48 md:w-52 animate-pulse">
                                    <div className="relative w-full h-24 sm:h-28 md:h-32 rounded-xl bg-gray-200"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-wrap justify-center gap-6">
                            {partners.map((partner, index) => (
                                <div key={index} className="w-40 sm:w-48 md:w-52">
                                    <PartnerCard partner={partner} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Blog Section - Use database posts */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-50 to-blue-50 pb-16">
                <div className="max-w-7xl mx-auto">
                    <SectionHeader
                        title="BLOG HR COMPANION"
                        subtitle="Chia sẻ kiến thức, kinh nghiệm và xu hướng mới nhất trong lĩnh vực nhân sự"
                    />

                    {blogLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">Đang tải bài viết...</span>
                        </div>
                    ) : featuredBlogPosts.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {featuredBlogPosts.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        showAuthor={true}
                                        showExcerpt={false}
                                    />
                                ))}
                            </div>
                            <div className="text-center mt-12">
                                <Link href="/blog">
                                    <Button variant="secondary">XEM TẤT CẢ BÀI VIẾT</Button>
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-600 mb-6">Chưa có bài viết blog nào được xuất bản.</p>
                            <Link href="/blog">
                                <Button variant="secondary">Khám phá Blog</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section - Only show for non-logged in users */}
            {!isLoggedIn && (
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-600 to-blue-700 text-white">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl font-bold mb-6">Tham Gia HR Companion Ngay Hôm Nay</h2>
                        <p className="text-xl mb-8">
                            Giải quyết vấn đề nhân sự, nâng cao hiệu suất & phát triển đội ngũ mạnh mẽ.
                        </p>
                        <div className="flex justify-center">
                            <Link href="/auth/register">
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    className="bg-white text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 transform hover:scale-105 transition-all duration-300 shadow-xl px-8 py-4 text-lg font-semibold border-2 border-transparent hover:border-cyan-200"
                                >
                                    Bắt Đầu Ngay
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default HomePage;