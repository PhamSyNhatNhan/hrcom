'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MentorDetail } from '@/component/MentorDetail';
import { supabase } from '@/utils/supabase/client';

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