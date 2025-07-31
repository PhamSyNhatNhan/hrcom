'use client';
import React from 'react';
import { Button } from '@/component/Button';
import { SectionHeader } from '@/component/SectionHeader';
import { ImageCarousel } from '@/component/ImageCarousel';
import Image from 'next/image';
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

const AboutPage = () => {
    return (
        <div>
            {/* Intro Section */}
            <section className="relative bg-white">
                <div className="relative w-full aspect-[16/9] sm:h-[500px] z-0">
                    <ImageCarousel
                        images={['/Background/luca-bravo-9l_326FISzk-unsplash-edited.jpg']}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 z-10"></div>

                    <div className="absolute inset-0 z-20 flex items-center justify-center lg:justify-center lg:pr-8 sm:lg:pl-110">
                        <div className="text-center lg:text-left lg:mr-8 sm:lg:mr-16">
                            <p className="text-sm text-white uppercase">HR Companion</p>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Về chúng tôi</h1>
                        </div>
                    </div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                    {/* Mobile layout */}
                    <div className="lg:hidden">
                        {/* Mobile image - overlapping background */}
                        <div className="relative -mt-15 z-30 mb-8">
                            <div className="relative w-4/4 max-w-sm aspect-[3/3] rounded-xl overflow-hidden shadow-xl mx-auto">
                                <Image
                                    src="/something/hrcompanion1-18.jpg"
                                    alt="About HR Companion"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        {/* Mobile text content */}
                        <div className="space-y-6">
                            <div className="text-gray-700 text-base leading-relaxed space-y-4">
                                <p>
                                    Được triển khai từ năm 2021, HR Companion là dự án cộng đồng phi lợi nhuận được vận hành bởi những người làm nhân sự tâm huyết, tận tụy với sứ mệnh giúp đỡ tất cả mọi người cải thiện, sửa các lỗi thường gặp khi viết CV/Resume, hiểu và làm tốt hơn kỹ năng phỏng vấn…
                                </p>
                                <p>
                                    Hoạt động liên tục định kỳ vào tối thứ 5 hàng tuần trong suốt hơn một năm vừa qua, chúng tôi đã tổ chức thành công 72 chương trình và hỗ trợ cải thiện gần hai ngàn lượt CV, đồng hành định hướng nghề nghiệp cho hàng chục ngàn bạn trẻ.
                                </p>
                                <p>
                                    Với đội ngũ hiện tại gần 45 mentor đều là các nhà tuyển dụng có nhiều kinh nghiệm đến từ các doanh nghiệp, tập đoàn khắp mọi miền tổ quốc, hoạt động đa dạng nhiều ngành nghề, HR Companion cũng là nơi các anh chị em HR giao lưu học hỏi, rèn luyện kỹ năng chuyên môn nghề nghiệp cho bản thân, mở rộng kết nối với cộng đồng..
                                </p>
                                <p>
                                    Bên cạnh đó, chúng tôi cũng tự hào là đơn vị tiên phong đồng hành cùng các trường đại học lớn trên toàn quốc trong công tác hỗ trợ các bạn sinh viên hiểu đúng về CV và phỏng vấn như: ĐH Ngoại thương, HV Tài chính, ĐH Giao thông Vận tải, ĐH Thương Mại, ĐH Xây dựng, ĐH Phenikaa…
                                </p>
                                <p>
                                    Nhằm chuyên nghiệp hóa & nâng cao chất lượng hoạt động, mở rộng phạm vi dự án, tăng cường hơn nữa các chương trình hợp tác giữa Dự án HR Companion với với các đơn vị, tổ chức trong và ngoài nước, các trường Đại học – Cao đẳng, các hệ thống mạng lưới cung cấp việc làm, từ tháng 4/2023, Ban Điều hành dự án The HR Companion chính thức thành lập <span className="font-bold">Công ty Cổ phần Doanh nghiệp Xã hội HR Companion</span> (Tên tiếng anh: <span className="font-bold">HR Companion Social Enterprise Joint Stock Company</span>).
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden lg:grid grid-cols-2 gap-12 items-start">
                        {/* Desktop image */}
                        <div className="relative -mt-90 z-30">
                            <div className="relative w-4/5 aspect-[3/3] rounded-xl overflow-hidden shadow-xl mx-auto lg:mx-0">
                                <Image
                                    src="/something/hrcompanion1-18.jpg"
                                    alt="About HR Companion"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        {/* Desktop text content */}
                        <div className="pt-12 space-y-6">
                            <div className="text-gray-700 text-base leading-relaxed space-y-4">
                                <p>
                                    Được triển khai từ năm 2021, HR Companion là dự án cộng đồng phi lợi nhuận được vận hành bởi những người làm nhân sự tâm huyết, tận tụy với sứ mệnh giúp đỡ tất cả mọi người cải thiện, sửa các lỗi thường gặp khi viết CV/Resume, hiểu và làm tốt hơn kỹ năng phỏng vấn…
                                </p>
                                <p>
                                    Hoạt động liên tục định kỳ vào tối thứ 5 hàng tuần trong suốt hơn một năm vừa qua, chúng tôi đã tổ chức thành công 72 chương trình và hỗ trợ cải thiện gần hai ngàn lượt CV, đồng hành định hướng nghề nghiệp cho hàng chục ngàn bạn trẻ.
                                </p>
                                <p>
                                    Với đội ngũ hiện tại gần 45 mentor đều là các nhà tuyển dụng có nhiều kinh nghiệm đến từ các doanh nghiệp, tập đoàn khắp mọi miền tổ quốc, hoạt động đa dạng nhiều ngành nghề, HR Companion cũng là nơi các anh chị em HR giao lưu học hỏi, rèn luyện kỹ năng chuyên môn nghề nghiệp cho bản thân, mở rộng kết nối với cộng đồng..
                                </p>
                                <p>
                                    Bên cạnh đó, chúng tôi cũng tự hào là đơn vị tiên phong đồng hành cùng các trường đại học lớn trên toàn quốc trong công tác hỗ trợ các bạn sinh viên hiểu đúng về CV và phỏng vấn như: ĐH Ngoại thương, HV Tài chính, ĐH Giao thông Vận tải, ĐH Thương Mại, ĐH Xây dựng, ĐH Phenikaa…
                                </p>
                                <p>
                                    Nhằm chuyên nghiệp hóa & nâng cao chất lượng hoạt động, mở rộng phạm vi dự án, tăng cường hơn nữa các chương trình hợp tác giữa Dự án HR Companion với với các đơn vị, tổ chức trong và ngoài nước, các trường Đại học – Cao đẳng, các hệ thống mạng lưới cung cấp việc làm, từ tháng 4/2023, Ban Điều hành dự án The HR Companion chính thức thành lập <span className="font-bold">Công ty Cổ phần Doanh nghiệp Xã hội HR Companion</span> (Tên tiếng anh: <span className="font-bold">HR Companion Social Enterprise Joint Stock Company</span>).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* Something Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-50 to-blue-50 pb-16">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Left */}
                        <div className="relative w-full lg:w-[50%] h-[400px]">
                            <div className="absolute top-0 left-0 w-[55%] h-[70%]">
                                <Image
                                    src="/something/cristiano-sousa-LNO1KyMzpCs-unsplash-450x600.jpg"
                                    alt="Moon Image"
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded-xl shadow-md"
                                />
                            </div>

                            <div className="absolute top-0 right-0 w-[40%] h-[35%]">
                                <Image
                                    src="/something/hrcompanion1-12-900x540.jpg"
                                    alt="Meeting Image"
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded-xl shadow-md"
                                />
                            </div>

                            <div className="absolute bottom-1 right-0 w-[60%] h-[50%]">
                                <Image
                                    src="/something/hrcompanion1-24-900x540.jpg"
                                    alt="Highlight Image"
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded-xl shadow-md"
                                />
                            </div>
                        </div>

                        {/* Right */}
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="w-full lg:w-3/4 xl:w-4/5 lg:ml-50 space-y-10">
                                <div>
                                    <h3 className="text-2xl sm:text-3xl font-bold text-[#2A2266] mb-2">Tầm nhìn</h3>
                                    <p className="text-gray-800 text-sm sm:text-base italic">
                                        “Trở thành doanh nghiệp xã hội hàng đầu giúp cho người lao động nâng cao năng lực ứng tuyển và chinh phục nhà tuyển dụng”.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-2xl sm:text-3xl font-bold text-[#2A2266] mb-2">Sứ mệnh</h3>
                                    <p className="text-gray-800 text-sm sm:text-base italic">
                                        “Xây dựng cộng đồng nhà tuyển dụng đồng hành cùng người lao động trên hành trình nâng cao năng lực và chinh phục việc làm mơ ước”
                                    </p>
                                </div>
                            </div>
                        </div>



                    </div>
                </div>
            </section>

            {/* Trip Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white pb-16">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Left */}
                        <div className="lg:w-1/2">
                            <div className="text-center lg:text-left space-y-6">
                                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                                    HÀNH TRÌNH HR COMPANION
                                </h2>
                                <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                                    Trong thời gian tới, Doanh nghiệp Xã hội HR Companion sẽ tiếp tục các hoạt động hướng tới hỗ trợ và đồng hành cùng các bạn ứng viên trên hành trình định hướng nghề nghiệp, tìm kiếm việc làm, cụ thể:
                                </p>
                                <div>
                                    <Button variant="secondary">LEARN MORE</Button>
                                </div>
                            </div>
                        </div>

                        {/* Right */}
                        <div className="lg:w-1/2">
                            <div className="grid grid-cols-[56px_1fr] gap-y-6 gap-x-6 font-medium text-gray-800 leading-relaxed">
                                {[
                                    {
                                        icon: "/icon/building-01-svgrepo-com.svg",
                                        text: "Tổ chức các chương trình đào tạo kỹ năng viết CV & phỏng vấn ứng tuyển chuyên nghiệp",
                                    },
                                    {
                                        icon: "/icon/note-favorite-svgrepo-com.svg",
                                        text: "Triển khai các hoạt động đào tạo kỹ năng mềm cho sinh viên và người đi làm",
                                    },
                                    {
                                        icon: "/icon/team-svgrepo-com.svg",
                                        text: "Là cầu nối triển khai các hoạt động hợp tác giữa các doanh nghiệp và các trường Đại học – Cao đẳng.",
                                    },
                                    {
                                        icon: "/icon/handshake-svgrepo-com.svg",
                                        text: "Hỗ trợ giới thiệu việc làm, kết nối ứng viên và nhà tuyển dụng",
                                    },
                                    {
                                        icon: "/icon/googlescholar-svgrepo-com.svg",
                                        text: "Thành lập, vận hành và kết nối các quỹ học bổng, quỹ hỗ trợ dành cho các bạn trẻ khó khăn",
                                    },
                                ].map((item, index) => (
                                    <React.Fragment key={index}>
                                        <div className="flex items-start justify-center pt-1">
                                            <Image
                                                src={item.icon}
                                                alt={`icon-${index}`}
                                                width={40}
                                                height={40}
                                                className="object-contain"
                                            />
                                        </div>
                                        <p className="text-sm sm:text-[18px] lg:text-[20px] leading-snug">
                                            {index + 1}. {item.text}
                                        </p>
                                    </React.Fragment>
                                ))}
                            </div>
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

export default AboutPage;
