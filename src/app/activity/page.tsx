'use client';
import React from 'react';
import { MentorCard } from '@/component/MentorCard';
import { Button } from '@/component/Button';
import { SectionHeader } from '@/component/SectionHeader';
import { ImageCarousel } from '@/component/ImageCarousel';
import Link from 'next/link';
import {ActivityCard} from "@/component/ActivityCard";


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

const activities = [
    {
        href: '#',
        imageSrc: '/hrcompanion1-1-900x540.jpg',
        imageAlt: 'img alt',
        title: 'Đào tạo viết CV & phỏng vấn',
        description:
            'Tổ chức các khoá đào tạo kỹ năng viết CV & phỏng vấn ứng tuyển chuyên nghiệp',
    },
    {
        href: '#',
        imageSrc: '/hrcompanion1-10-900x540.jpg',
        imageAlt: 'img alt',
        title: 'Đào tạo kỹ năng mềm',
        description:
            'Triển khai các hoạt động đào tạo kỹ năng mềm cho sinh viên và người đi làm',
    },
    {
        href: '#',
        imageSrc: '/hrcompanion1-11-900x540.jpg',
        imageAlt: 'img alt',
        title: 'Kết nối doanh nghiệp - trường học',
        description:
            'Là cầu nối triển khai các hoạt động hợp tác giữa các doanh nghiệp và các trường ĐH-CĐ',
    },
    {
        href: '#',
        imageSrc: '/hrcompanion1-12-900x540.jpg',
        imageAlt: 'img alt',
        title: 'Giới thiệu việc làm & kết nối tuyển dụng',
        description:
            'Hỗ trợ giới thiệu việc làm, kết nối ứng viên và nhà tuyển dụng',
    },
    {
        href: '#',
        imageSrc: '/hrcompanion1-14-900x540.jpg',
        imageAlt: 'img alt',
        title: 'Quỹ học bổng & hỗ trợ',
        description:
            'Thành lập, vận hành và kết nối các quỹ học bổng, quỹ hỗ trợ dành cho các bạn khó khăn',
    },
    {
        href: '#',
        imageSrc: '/hrcompanion1-17.jpg',
        imageAlt: 'img alt',
        title: 'Mạng lưới tư vấn & mentor đồng hành',
        description:
            'Thiết lập mạng tư vấn viên, mentor đồng hành cùng DN và ứng viên',
    },
];

const ActivityPage = () => {
    return (
        <div>
            {/* Intro Section */}
            <section className="relative bg-white">
                <div className="relative w-full aspect-[16/9] sm:h-[500px] z-0">
                    <ImageCarousel
                        images={['/Background/global-footprint.png']}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 z-10"></div>

                    <div className="absolute inset-0 z-20 flex items-center justify-center px-4 lg:px-16">
                        <div className="text-left max-w-5xl w-full">
                            <p className="text-sm sm:text-lg text-white/90 uppercase tracking-wide mb-2">HR Companion</p>
                            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                                Về chúng tôi
                            </h1>
                            <p className="text-sm sm:text-lg line-clamp-4 sm:line-clamp-none text-white/95 leading-relaxed max-w-4xl">
                                HR Companion được thành lập với sứ mệnh
                                <span className="font-semibold text-white"> Xây dựng cộng đồng nhà tuyển dụng đồng hành cùng người lao động trên hành trình nâng cao năng lực để trở nên tự tin hơn và chinh phục việc làm mơ ước</span>,
                                sẽ liên tục tổ chức các workshop chia sẻ kiến thức, định hướng nghề nghiệp đến cộng đồng nhằm giúp ứng viên nâng cao kỹ năng ứng tuyển và kết nối được việc làm phù hợp.
                            </p>
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


            {/* Hero Section */}
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
                            <Button variant="secondary">ALL MENTOR HR COMPANIAN</Button>
                        </Link>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default ActivityPage;

//ActivityPage