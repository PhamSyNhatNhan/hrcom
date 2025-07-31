'use client';
import React from 'react';
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

const partners = [
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

const featuredMentors = [
    {
        id: 1,
        name: 'Nhật Lệ',
        role: 'HR Manager',
        company: 'VinGroup',
        rating: 4.9,
        sessions: 120,
        price: '600k',
        image: '/4-400x400.png',
        specialties: ['Tuyển dụng', 'Quản trị nhân sự', 'Văn hóa doanh nghiệp'],
    },
    {
        id: 2,
        name: 'Đông Dương',
        role: 'People Partner',
        company: 'FPT Software',
        rating: 4.8,
        sessions: 98,
        price: '500k',
        image: '5-400x400.png',
        specialties: ['Phát triển năng lực', 'Đánh giá hiệu suất', 'Tổ chức công việc'],
    },
    {
        id: 3,
        name: 'Nguyễn Thu Hà',
        role: 'Talent Acquisition Lead',
        company: 'Techcombank',
        rating: 4.7,
        sessions: 85,
        price: '550k',
        image: '/6-400x400.png',
        specialties: ['Tuyển dụng chiến lược', 'Phỏng vấn', 'Onboarding'],
    },
];

const stats = [
    {icon: UserCheck, value: '89', label: 'Mentor đồng hành',},
    {icon: BookOpenCheck, value: '120', label: 'Hướng dẫn',},
    {icon: FileText, value: '15000+', label: 'SV tham gia chỉnh sửa CV',},
    {icon: Mic, value: '15000+', label: 'Đăng ký cuộc phỏng vấn',},
];

const activities = [
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



const HomePage = () => {
    // Load featured posts from database
    const {
        posts: featuredBlogPosts,
        loading: blogLoading
    } = usePublishedPosts({
        type: 'blog',
        limit: 4
    });

    return (
        <div>
            {/* Intro Section */}
            <section className="relative bg-gradient-to-r from-cyan-50 to-blue-50 pb-16">
                {/* Background Image Carousel - responsive aspect ratio */}
                <div className="relative w-full aspect-[16/9] sm:h-[500px] z-0">
                    <ImageCarousel
                        images={[
                            '/Background/hr-companion-bannerB01.jpg',
                            '/Background/hr-companion-bannerB02.jpg',
                            '/Background/hr-companion-bannerB03.jpg',
                        ]}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 z-10" />
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

                    <div className="mt-16 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {activities.map((activity, index) => (
                            <ActivityCard key={index} activity={activity} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Mentor Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-50 to-blue-50 pb-16">
                <div className="max-w-7xl mx-auto">
                    <SectionHeader
                        title="CỐ VẤN CHUYÊN MÔN"
                        subtitle="Mentor hay Cố vấn chuyên môn là chuyên gia cung cấp nhiều kiến thức chuyên môn và một loạt các kỹ năng đa dạng khi tuyển dụng, đảm bảo rằng bất kỳ hoạt động hàng ngày nào của công ty đều hoạt động trơn tru.."
                    />

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredMentors.map((mentor) => (
                            <MentorCard key={mentor.id} mentor={mentor} />
                        ))}
                    </div>
                    <div className="text-center mt-12">
                        <Link href="/mentor">
                            <Button variant="secondary">ALL MENTOR HR COMPANION</Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Partner Section */}
            <section id="partner-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-white pb-16">
                <div className="max-w-7xl mx-auto">
                    <SectionHeader
                        title="ĐỐI TÁC HR COMPANION"
                        subtitle="HR Companion tự hào hợp tác cùng các tổ chức, doanh nghiệp và chuyên gia để lan tỏa giá trị bền vững trong quản trị nhân sự."
                    />

                    <div className="flex flex-wrap justify-center gap-6">
                        {partners.map((partner, index) => (
                            <div key={index} className="w-40 sm:w-48 md:w-52">
                                <PartnerCard partner={partner} />
                            </div>
                        ))}
                    </div>
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
                                        variant="compact"
                                        showAuthor={false}
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

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-600 to-blue-700 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6">Tham Gia HR Companion Ngay Hôm Nay</h2>
                    <p className="text-xl mb-8">
                        Giải quyết vấn đề nhân sự, nâng cao hiệu suất & phát triển đội ngũ mạnh mẽ.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/auth/register">
                            <Button variant="secondary" size="lg" className="bg-white text-cyan-600">
                                Đăng Ký Miễn Phí
                            </Button>
                        </Link>
                        <Link href="https://www.facebook.com/HRCompanion.vn/">
                            <Button variant="outline" size="lg" className="border-white text-white">
                                Trở Thành Chuyên Gia
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;