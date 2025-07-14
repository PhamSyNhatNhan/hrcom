'use client';
import React from 'react';
import { SectionHeader } from '@/component/SectionHeader';
import { ImageCarousel } from '@/component/ImageCarousel';
import {PartnerCard} from "@/component/PartnerCard";

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

const PartnerPage = () => {
    return (
        <div>
            {/* Intro Section */}
            <section className="relative bg-white">
                <div className="relative w-full aspect-[16/9] sm:h-[500px] z-0">
                    <ImageCarousel
                        images={['/Background/hrcompanion1-22.jpg']}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 z-10"></div>

                    <div className="absolute inset-0 z-20 flex items-center justify-center px-4 lg:px-16">
                        <div className="text-left max-w-5xl w-full">
                            <p className="text-sm sm:text-lg text-white/90 uppercase tracking-wide mb-2">HR Companion</p>
                            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                                Đối tác
                            </h1>
                            <p className="text-sm sm:text-lg line-clamp-4 sm:line-clamp-none text-white/95 leading-relaxed max-w-4xl">
                                Chúng tôi cũng tự hào là đơn vị tiên phong đồng hành cùng các trường đại học lớn trên toàn quốc trong công tác hỗ trợ các bạn sinh viên hiểu đúng về CV và phỏng vấn như: ĐH Ngoại thương, HV Tài chính, ĐH Giao thông Vận tải, ĐH Thương Mại, ĐH Xây dựng, ĐH Phenikaa…
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Partner Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white pb-16">
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
        </div>
    );
};

export default PartnerPage;
