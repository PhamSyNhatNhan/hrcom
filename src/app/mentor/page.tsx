'use client';
import React, { useEffect, useState } from 'react';
import { MentorCard } from '@/component/MentorCard';
import { SectionHeader } from '@/component/SectionHeader';
import { createClient } from '@/utils/supabase/client'; // 

const supabase = createClient();

// const featuredMentors = [
//     {
//         id: "5fd70631-e862-405c-907e-793d1914114f",
//         name: 'Nhật Lệ',
//         role: 'HR Manager',
//         company: 'VinGroup',
//         rating: 4.9,
//         sessions: 120,
//         price: '600k',
//         image: '/4-400x400.png',
//         specialties: ['Tuyển dụng', 'Quản trị nhân sự', 'Văn hóa doanh nghiệp'],
//     },
//     {
//         id: 2,
//         name: 'Đông Dương',
//         role: 'People Partner',
//         company: 'FPT Software',
//         rating: 4.8,
//         sessions: 98,
//         price: '500k',
//         image: '5-400x400.png',
//         specialties: ['Phát triển năng lực', 'Đánh giá hiệu suất', 'Tổ chức công việc'],
//     },
//     {
//         id: 3,
//         name: 'Nguyễn Thu Hà',
//         role: 'Talent Acquisition Lead',
//         company: 'Techcombank',
//         rating: 4.7,
//         sessions: 85,
//         price: '550k',
//         image: '/6-400x400.png',
//         specialties: ['Tuyển dụng chiến lược', 'Phỏng vấn', 'Onboarding'],
//     },
//     {
//         id: 4,
//         name: 'Nhật Lệ',
//         role: 'HR Manager',
//         company: 'VinGroup',
//         rating: 4.9,
//         sessions: 120,
//         price: '600k',
//         image: '/4-400x400.png',
//         specialties: ['Tuyển dụng', 'Quản trị nhân sự', 'Văn hóa doanh nghiệp'],
//     },
//     {
//         id: 5,
//         name: 'Đông Dương',
//         role: 'People Partner',
//         company: 'FPT Software',
//         rating: 4.8,
//         sessions: 98,
//         price: '500k',
//         image: '5-400x400.png',
//         specialties: ['Phát triển năng lực', 'Đánh giá hiệu suất', 'Tổ chức công việc'],
//     },
//     {
//         id: 6,
//         name: 'Nguyễn Thu Hà',
//         role: 'Talent Acquisition Lead',
//         company: 'Techcombank',
//         rating: 4.7,
//         sessions: 85,
//         price: '550k',
//         image: '/6-400x400.png',
//         specialties: ['Tuyển dụng chiến lược', 'Phỏng vấn', 'Onboarding'],
//     },
//     {
//         id: 7,
//         name: 'Nhật Lệ',
//         role: 'HR Manager',
//         company: 'VinGroup',
//         rating: 4.9,
//         sessions: 120,
//         price: '600k',
//         image: '/4-400x400.png',
//         specialties: ['Tuyển dụng', 'Quản trị nhân sự', 'Văn hóa doanh nghiệp'],
//     },
//     {
//         id: 8,
//         name: 'Đông Dương',
//         role: 'People Partner',
//         company: 'FPT Software',
//         rating: 4.8,
//         sessions: 98,
//         price: '500k',
//         image: '5-400x400.png',
//         specialties: ['Phát triển năng lực', 'Đánh giá hiệu suất', 'Tổ chức công việc'],
//     },
//     {
//         id: 9,
//         name: 'Nguyễn Thu Hà',
//         role: 'Talent Acquisition Lead',
//         company: 'Techcombank',
//         rating: 4.7,
//         sessions: 85,
//         price: '550k',
//         image: '/6-400x400.png',
//         specialties: ['Tuyển dụng chiến lược', 'Phỏng vấn', 'Onboarding'],
//     },
//     {
//         id: 10,
//         name: 'Nhật Lệ',
//         role: 'HR Manager',
//         company: 'VinGroup',
//         rating: 4.9,
//         sessions: 120,
//         price: '600k',
//         image: '/4-400x400.png',
//         specialties: ['Tuyển dụng', 'Quản trị nhân sự', 'Văn hóa doanh nghiệp'],
//     },
//     {
//         id: 11,
//         name: 'Đông Dương',
//         role: 'People Partner',
//         company: 'FPT Software',
//         rating: 4.8,
//         sessions: 98,
//         price: '500k',
//         image: '5-400x400.png',
//         specialties: ['Phát triển năng lực', 'Đánh giá hiệu suất', 'Tổ chức công việc'],
//     },
//     {
//         id: 12,
//         name: 'Nguyễn Thu Hà',
//         role: 'Talent Acquisition Lead',
//         company: 'Techcombank',
//         rating: 4.7,
//         sessions: 85,
//         price: '550k',
//         image: '/6-400x400.png',
//         specialties: ['Tuyển dụng chiến lược', 'Phỏng vấn', 'Onboarding'],
//     },
//     {
//         id: 13,
//         name: 'Nhật Lệ',
//         role: 'HR Manager',
//         company: 'VinGroup',
//         rating: 4.9,
//         sessions: 120,
//         price: '600k',
//         image: '/4-400x400.png',
//         specialties: ['Tuyển dụng', 'Quản trị nhân sự', 'Văn hóa doanh nghiệp'],
//     },
//     {
//         id: 14,
//         name: 'Đông Dương',
//         role: 'People Partner',
//         company: 'FPT Software',
//         rating: 4.8,
//         sessions: 98,
//         price: '500k',
//         image: '5-400x400.png',
//         specialties: ['Phát triển năng lực', 'Đánh giá hiệu suất', 'Tổ chức công việc'],
//     },
//     {
//         id: 15,
//         name: 'Nguyễn Thu Hà',
//         role: 'Talent Acquisition Lead',
//         company: 'Techcombank',
//         rating: 4.7,
//         sessions: 85,
//         price: '550k',
//         image: '/6-400x400.png',
//         specialties: ['Tuyển dụng chiến lược', 'Phỏng vấn', 'Onboarding'],
//     },
// ];


// const MentorPage = () => {
//     return (
//         <div>
//             {/* Hero Section */}
//             <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white pb-16">
//                 <div className="max-w-7xl mx-auto">
//                     <SectionHeader
//                         title="CỐ VẤN CHUYÊN MÔN"
//                         subtitle="Mentor hay Cố vấn chuyên môn là chuyên gia cung cấp nhiều kiến thức chuyên môn và một loạt các kỹ năng đa dạng khi tuyển dụng, đảm bảo rằng bất kỳ hoạt động hàng ngày nào của công ty đều hoạt động trơn tru.."
//                     />

//                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
//                         {featuredMentors.map((mentor) => (
//                             <MentorCard key={mentor.id} mentor={mentor} />
//                         ))}
//                     </div>

//                 </div>
//             </section>

//         </div>
//     );
// };

// export default MentorPage;
const MentorPage = () => {
    const [mentors, setMentors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMentors = async () => {
            const { data, error } = await supabase
                .from('mentors') // Đổi thành tên bảng mentors của bạn
                .select('*');
            if (error) {
                console.error('Lỗi lấy danh sách mentor:', error.message);
            } else {
                setMentors(data || []);
            }
            setLoading(false);
        };
        fetchMentors();
    }, []);

    return (
        <div>
            {/* Hero Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white pb-16">
                <div className="max-w-7xl mx-auto">
                    <SectionHeader
                        title="CỐ VẤN CHUYÊN MÔN"
                        subtitle="Mentor hay Cố vấn chuyên môn là chuyên gia cung cấp nhiều kiến thức chuyên môn và một loạt các kỹ năng đa dạng khi tuyển dụng, đảm bảo rằng bất kỳ hoạt động hàng ngày nào của công ty đều hoạt động trơn tru.."
                    />

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading ? (
                            <div>Đang tải...</div>
                        ) : (
                            mentors.map((mentor) => (
                                <MentorCard key={mentor.id} mentor={mentor} />
                            ))
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default MentorPage;