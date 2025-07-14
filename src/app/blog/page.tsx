'use client';
import React from 'react';

import { SectionHeader } from '@/component/SectionHeader';
import {Search} from "lucide-react";
import {LastNewsCard} from "@/component/LastNewsCard";
import {NewsCard} from "@/component/NewsCard";

const newsArticles = [
    {
        date: { day: '23', month: 'May', year: '2025' },
        image: '/news/4-716x600.jpg',
        title: 'HR Companion cùng lan toả giá trị văn hoá doanh nghiệp tại Chung kết cuộc thi "Tìm hiểu và Phát triển Văn hóa Doanh nghiệp"',
        excerpt: 'Tối ngày hôm nay, HR Companion hân hạnh tham gia với vai trò đơn vị bảo trợ chuyên môn trong Đêm Chung kết cuộc thi học thuật "Tìm hiểu và Phát triển Văn hóa Doanh nghiệp" do Liên chi Hội Sinh viên Khoa Quản trị Nhân lực – Trường Đại học Thương mại tổ chức...',
        category: 'TIN TỨC & SỰ KIỆN',
        commentsOff: true
    },
    {
        date: { day: '22', month: 'May', year: '2025' },
        image: '/news/497804859_656011187429239_5915974007074211028_n-900x540.jpg',
        title: 'HR COMPANION ĐỒNG HÀNH CÙNG INTERNSHIP RACE 2025 – TIẾP LỬA CHO NHỮNG BƯỚC CHÂN ĐẦU TIÊN TRÊN HÀNH TRÌNH NGHỀ NGHIỆP',
        excerpt: 'Ngày 22/05/2025, HR Companion vinh dự tham gia sự kiện Internship Race 2025 với vai trò nhà tài trợ, mang đến những cơ hội việc làm thực tập chất lượng cho sinh viên...',
        category: 'TIN TỨC & SỰ KIỆN',
        commentsOff: true
    },
    {
        date: { day: '21', month: 'May', year: '2025' },
        image: '/news/499394891_1125826616249774_2861140157073810716_n-600x600.jpg',
        title: 'HR COMPANION ĐỒNG HÀNH CÙNG YOU CAN 13 – TIẾP SỨC NGƯỜI TRẺ KHÁM PHÁ VÀ PHÁT TRIỂN BẢN THÂN',
        excerpt: 'Sự kiện You Can 13 đã diễn ra thành công tại Đại học Thương mại với sự tham gia của hàng trăm sinh viên. HR Companion tự hào đồng hành cùng chương trình...',
        category: 'TIN TỨC & SỰ KIỆN',
        commentsOff: true
    },
    {
        date: { day: '21', month: 'May', year: '2025' },
        image: '/news/499761306_660178527012505_8024589271091115619_n-800x600.jpg',
        title: 'HR COMPANION – LAN TỎA GIÁ TRỊ VĂN HÓA DOANH NGHIỆP CÙNG SINH VIÊN THƯƠNG MẠI',
        excerpt: 'Trong khuôn khổ hợp tác với Đại học Thương mại, HR Companion đã tổ chức buổi chia sẻ về văn hóa doanh nghiệp, thu hút sự quan tâm của đông đảo sinh viên...',
        category: 'TIN TỨC & SỰ KIỆN',
        commentsOff: true
    },
    {
        date: { day: '20', month: 'May', year: '2025' },
        image: '/news/500250534_658523760511315_4008171985461565929_n.jpg',
        title: 'DIỄN ĐÀN HỢP TÁC VÀ PHÁT TRIỂN – HỌC VIỆN TÀI CHÍNH 2025',
        excerpt: 'HR Companion tham gia Diễn đàn hợp tác và phát triển tại Học viện Tài chính, tạo cầu nối giữa doanh nghiệp và sinh viên trong lĩnh vực tài chính - kế toán...',
        category: 'TIN TỨC & SỰ KIỆN',
        commentsOff: true
    },
    {
        date: { day: '19', month: 'May', year: '2025' },
        image: '/news/497874936_655285117501846_2344791268701673285_n-800x600.jpg',
        title: 'HR COMPANION TẠI NGÀY HỘI VIỆC LÀM ĐẠI HỌC KINH TẾ QUỐC DẤN 2025',
        excerpt: 'Với vai trò doanh nghiệp tuyển dụng, HR Companion đã có mặt tại Ngày hội việc làm Đại học Kinh tế Quốc dân, mang đến nhiều cơ hội nghề nghiệp hấp dẫn...',
        category: 'TIN TỨC & SỰ KIỆN',
        commentsOff: true
    }
];


const BlogsPage = () => {
    return (
        <div>
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
                <SectionHeader
                    title="Category Archives: BLOG HR COMPANION"
                    subtitle="Đồng hành cùng những bước chuyển mình và hoạt động nổi bật của HR Companion."
                />

                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Main Content - Left Side */}
                        <div className="lg:col-span-2">
                            <div className="space-y-6">
                                {newsArticles.map((article, index) => (
                                    <NewsCard key={index} {...article} />
                                ))}
                            </div>
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
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        />
                                        <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600 transition-colors">
                                            <Search className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Latest News */}
                                <div className="bg-white rounded-2xl shadow-lg p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                                        TIN TỨC MỚI NHẤT
                                    </h3>

                                    <div className="space-y-6">
                                        {newsArticles.map((article, index) => (
                                            <LastNewsCard key={index} article={article} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default BlogsPage;
