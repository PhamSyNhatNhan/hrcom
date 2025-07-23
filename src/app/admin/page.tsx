'use client';
import React from 'react';

import { ImageCarousel } from '@/component/ImageCarousel';
import Link from "next/link";

const HomePage = () => {
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
                                    Đây là admin page
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

                        </div>
                    </div>
                </div>
            </section>



        </div>
    );
};

export default HomePage;
