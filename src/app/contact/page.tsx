'use client';
import React from 'react';

import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from '@/component/Button';
import { SectionHeader } from '@/component/SectionHeader';
import { ImageCarousel } from '@/component/ImageCarousel';
import Link from "next/link";
import Image from 'next/image';


const ContactPage = () => {
    return (
        <div>
            {/* Intro Section */}
            <section className="relative bg-white">
                <div className="relative w-full aspect-[4/5] sm:aspect-[16/8] md:h-[500px] z-0">
                    <ImageCarousel
                        images={['/Background/javari-services02.jpg']}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 z-10" />

                    <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-center px-6 py-8">
                        <h1 className="text-xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-4 leading-tight">
                            Liên hệ với chúng tôi
                        </h1>
                        <p className="text-sm sm:text-lg text-white/95 max-w-[300px] sm:max-w-2xl mb-8 sm:mb-8 leading-relaxed px-2">
                            Đừng ngần ngại liên hệ HR Companion để được tư vấn, hợp tác… cũng như cơ hội hợp tác
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8 text-white w-full max-w-4xl">
                            <div className="flex flex-col items-center text-center space-y-2">
                                <Mail className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
                                <p className="font-semibold text-xs sm:text-sm md:text-base">Send us an email</p>
                                <Link
                                    href="#"
                                    className="text-xs sm:text-sm md:text-base text-white/90 hover:text-white transition-colors break-all"
                                >
                                    info@hrcompanion.vn
                                </Link>
                            </div>

                            <div className="flex flex-col items-center text-center space-y-2">
                                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
                                <p className="font-semibold text-xs sm:text-sm md:text-base">Facebook</p>
                                <Link
                                    href="#"
                                    className="text-xs sm:text-sm md:text-base text-white/90 hover:text-white transition-colors break-all"
                                >
                                    facebook.com/hrcompanion.vn
                                </Link>
                            </div>

                            <div className="flex flex-col items-center text-center space-y-2">
                                <Phone className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
                                <p className="font-semibold text-xs sm:text-sm md:text-base">Website</p>
                                <Link
                                    href="#"
                                    className="text-xs sm:text-sm md:text-base text-white/90 hover:text-white transition-colors"
                                >
                                    hrcompanion.vn
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Follow Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <SectionHeader
                        title="Follow us"
                        subtitle="Tham gia cộng đồng cùng HR Companion"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <Link
                            href="#"
                            className="transform transition duration-300 hover:scale-105"
                        >
                            <Image
                                src="/contact/hrcompanion1-20-900x540.jpg"
                                alt="Facebook"
                                width={400}
                                height={300}
                                className="w-full h-auto object-cover rounded-lg shadow-md"
                            />
                        </Link>

                        <Link
                            href="#"
                            className="transform transition duration-300 hover:scale-105"
                        >
                            <Image
                                src="/contact/hrcompanion1-24-900x540.jpg"
                                alt="Twitter"
                                width={400}
                                height={300}
                                className="w-full h-auto object-cover rounded-lg shadow-md"
                            />
                        </Link>

                        <Link
                            href="#"
                            className="transform transition duration-300 hover:scale-105"
                        >
                            <Image
                                src="/contact/hrcompanion1-26-900x540.jpg"
                                alt="LinkedIn"
                                width={400}
                                height={300}
                                className="w-full h-auto object-cover rounded-lg shadow-md"
                            />
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-600 to-blue-700 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6">Tham Gia HRCompanion Ngay Hôm Nay</h2>
                    <p className="text-xl mb-8">
                        Giải quyết vấn đề nhân sự, nâng cao hiệu suất & phát triển đội ngũ mạnh mẽ.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button variant="secondary" size="lg" className="bg-white text-cyan-600">
                            Đăng Ký Miễn Phí
                        </Button>
                        <Button variant="outline" size="lg" className="border-white text-white">
                            Trở Thành Chuyên Gia
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ContactPage;
