'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MentorDetail } from '@/component/MentorDetail';
import { createClient } from '@/utils/supabase/client'; 

const supabase = createClient()

// Dữ liệu mẫu, bạn có thể thay bằng dữ liệu thực tế
// const mentors = [
//     {
//         id: 1,
//         name: 'Nhật Lệ',
//         role: 'HR Manager',
//         company: 'VinGroup',
//         rating: 4.9,
//         sessions: 120,
//         price: '600k',
//         image: '/4-400x400.png',
//         specialties: ['Tuyển dụng', 'Quản trị nhân sự', 'Văn hóa doanh nghiệp'],
//         bio: 'Mentor có nhiều năm kinh nghiệm trong lĩnh vực nhân sự, sẵn sàng chia sẻ và hỗ trợ bạn phát triển sự nghiệp.',
//         experience: [
//             { position: 'HR Manager', company: 'VinGroup', time: '2020 - nay' },
//             { position: 'HR Executive', company: 'FPT', time: '2018 - 2020' },
//         ],
//         education: [
//             { degree: 'Cử nhân Quản trị Kinh doanh', school: 'Đại học Quốc gia Hà Nội', year: '2014 - 2018' },
//             { degree: 'Thạc sĩ Quản trị Nhân sự', school: 'Đại học Kinh tế Quốc dân', year: '2019 - 2021' },
//         ],
//         activities: [
//             { title: 'Diễn giả tại hội thảo HR Tech', description: 'Chia sẻ về xu hướng công nghệ trong quản trị nhân sự.', year: '2021' },
//             { title: 'Tổ chức workshop phỏng vấn hiệu quả', description: 'Hướng dẫn kỹ năng phỏng vấn cho sinh viên.', year: '2020' },
//         ],
//     },
//     {
//         id: 2,
//         name: 'Đông Dương',
//         role: 'People Partner',
//         company: 'FPT Software',
//         rating: 4.9,
//         sessions: 120,
//         price: '600k',
//         image: '/5-400x400.png',
//         specialties: ['Tuyển dụng', 'Quản trị nhân sự', 'Văn hóa doanh nghiệp'],
//         bio: 'Mentor có nhiều năm kinh nghiệm trong lĩnh vực nhân sự, sẵn sàng chia sẻ và hỗ trợ bạn phát triển sự nghiệp.',
//         experience: [
//             { position: 'People Partner', company: 'FPT Software', time: '2020 - nay' },
//             { position: 'HR Executive', company: 'VinGroup', time: '2018 - 2020' },
//         ],
//         education: [
//             { degree: 'Cử nhân Quản trị Kinh doanh', school: 'Đại học Quốc gia Hà Nội', year: '2014 - 2018' },
//             { degree: 'Thạc sĩ Quản trị Nhân sự', school: 'Đại học Kinh tế Quốc dân', year: '2019 - 2021' },
//         ],
//         activities: [
//             { title: 'Diễn giả tại hội thảo HR Tech', description: 'Chia sẻ về xu hướng công nghệ trong quản trị nhân sự.', year: '2021' },
//             { title: 'Tổ chức workshop phỏng vấn hiệu quả', description: 'Hướng dẫn kỹ năng phỏng vấn cho sinh viên.', year: '2020' },
//         ],
//     },
//     // ...mentor khác
// ];

// export default function MentorDetailPage() {
//     const { id } = useParams();
//     const mentor = mentors.find(m => m.id === Number(id));
//     if (!mentor) return <div>Mentor không tồn tại</div>;
//     return <MentorDetail mentor={mentor} />;
// }
export default function MentorDetailPage() {
    const { id } = useParams();
    const [mentor, setMentor] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMentor = async () => {
            // Lấy thông tin mentor
            const { data: mentorData, error: mentorError } = await supabase
                .from('mentors')
                .select('*')
                .eq('id', id)
                .single();

            // Lấy kinh nghiệm làm việc
            const { data: experiences } = await supabase
                .from('mentor_work_experiences')
                .select('*')
                .eq('mentor_id', id);

            // Lấy học vấn
            const { data: educations } = await supabase
                .from('mentor_educations')
                .select('*')
                .eq('mentor_id', id);

            // Lấy hoạt động
            const { data: activities } = await supabase
                .from('mentor_activities')
                .select('*')
                .eq('mentor_id', id);

            if (mentorError || !mentorData) {
                setMentor(null);
            } else {
                setMentor({
                    ...mentorData,
                    experience: experiences || [],
                    education: educations || [],
                    activities: activities || [],
                });
            }
            setLoading(false);
        };
        if (id) fetchMentor();
    }, [id]);

    if (loading) return <div>Đang tải...</div>;
    if (!mentor) return <div>Mentor không tồn tại</div>;
    return <MentorDetail mentor={mentor} />;
}