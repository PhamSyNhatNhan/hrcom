'use client';
import React from 'react';

import { SectionHeader } from '@/component/SectionHeader';
import { ActivityCard} from '@/component/ActivityCard';



const activities = [
    {
        href: '/',
        imageSrc: '/hrcompanion1-1-900x540.jpg',
        imageAlt: 'img alt',
        title: 'Đào tạo viết CV & phỏng vấn',
        description:
            'Tổ chức các khoá đào tạo kỹ năng viết CV & phỏng vấn ứng tuyển chuyên nghiệp',
    },
    {
        href: '/',
        imageSrc: '/hrcompanion1-10-900x540.jpg',
        imageAlt: 'img alt',
        title: 'Đào tạo kỹ năng mềm',
        description:
            'Triển khai các hoạt động đào tạo kỹ năng mềm cho sinh viên và người đi làm',
    },
    {
        href: '/',
        imageSrc: '/hrcompanion1-11-900x540.jpg',
        imageAlt: 'img alt',
        title: 'Kết nối doanh nghiệp - trường học',
        description:
            'Là cầu nối triển khai các hoạt động hợp tác giữa các doanh nghiệp và các trường ĐH-CĐ',
    },
    {
        href: '/',
        imageSrc: '/hrcompanion1-12-900x540.jpg',
        imageAlt: 'img alt',
        title: 'Giới thiệu việc làm & kết nối tuyển dụng',
        description:
            'Hỗ trợ giới thiệu việc làm, kết nối ứng viên và nhà tuyển dụng',
    },
    {
        href: '/',
        imageSrc: '/hrcompanion1-14-900x540.jpg',
        imageAlt: 'img alt',
        title: 'Quỹ học bổng & hỗ trợ',
        description:
            'Thành lập, vận hành và kết nối các quỹ học bổng, quỹ hỗ trợ dành cho các bạn khó khăn',
    },
    {
        href: '/',
        imageSrc: '/hrcompanion1-17.jpg',
        imageAlt: 'img alt',
        title: 'Mạng lưới tư vấn & mentor đồng hành',
        description:
            'Thiết lập mạng tư vấn viên, mentor đồng hành cùng DN và ứng viên',
    },
];


const PostPage = () => {
    return (
        <div>
            {/* Activity Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white pb-16">
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

        </div>
    );
};

export default PostPage;
