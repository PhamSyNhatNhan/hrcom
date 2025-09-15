'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';
import {
    Users,
    ArrowRight,
} from 'lucide-react';

interface RelatedMentor {
    id: string;
    full_name: string;
    headline?: string;
    avatar?: string;
    published?: boolean; // Thêm thuộc tính published
    average_rating?: number;
    total_bookings?: number;
    skills?: Array<{
        id: string;
        name: string;
    }>;
}

interface MentorRelatedProps {
    currentMentorId: string;
    currentMentorSkills: Array<{
        id: string;
        name: string;
    }>;
    limit?: number;
}

const MentorRelated: React.FC<MentorRelatedProps> = ({
                                                         currentMentorId,
                                                         currentMentorSkills = [],
                                                         limit = 3
                                                     }) => {
    const [relatedMentors, setRelatedMentors] = useState<RelatedMentor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelatedMentors = async () => {
            try {
                setLoading(true);

                // Lấy skill IDs từ mentor hiện tại
                const skillIds = currentMentorSkills.map(skill => skill.id);

                let mentorsData: any[] = [];

                if (skillIds.length > 0) {
                    // Tìm mentors có cùng skills
                    const { data: relatedBySkills, error: skillsError } = await supabase
                        .from('mentor_skill_relations')
                        .select(`
                            mentor_id,
                            mentors!inner (
                                id,
                                full_name,
                                headline,
                                avatar,
                                published
                            )
                        `)
                        .in('skill_id', skillIds)
                        .neq('mentor_id', currentMentorId);

                    if (skillsError) {
                        console.error('Error fetching related mentors by skills:', skillsError);
                    } else {
                        // Deduplicate mentors và type safety
                        const uniqueMentors = new Map();
                        relatedBySkills?.forEach(item => {
                            // Type assertion để TypeScript hiểu structure
                            const mentor = item.mentors as RelatedMentor;
                            if (mentor.published && !uniqueMentors.has(mentor.id)) {
                                uniqueMentors.set(mentor.id, mentor);
                            }
                        });
                        mentorsData = Array.from(uniqueMentors.values());
                    }
                }

                // Nếu không đủ mentors hoặc không có skills, lấy random mentors
                if (mentorsData.length < limit) {
                    const { data: randomMentors, error: randomError } = await supabase
                        .from('mentors')
                        .select('id, full_name, headline, avatar, published')
                        .eq('published', true)
                        .neq('id', currentMentorId)
                        .limit(limit * 2); // Lấy nhiều hơn để có thể filter

                    if (randomError) {
                        console.error('Error fetching random mentors:', randomError);
                    } else {
                        // Thêm random mentors vào danh sách (exclude những mentor đã có)
                        const existingIds = new Set(mentorsData.map(m => m.id));
                        const additionalMentors = (randomMentors || [])
                            .filter(m => !existingIds.has(m.id))
                            .slice(0, limit - mentorsData.length);

                        mentorsData = [...mentorsData, ...additionalMentors];
                    }
                }

                // Giới hạn số lượng mentors
                mentorsData = mentorsData.slice(0, limit);

                // Load additional data cho mỗi mentor
                const mentorsWithStats = await Promise.all(
                    mentorsData.map(async (mentor) => {
                        // Load skills
                        const { data: skillsData } = await supabase
                            .from('mentor_skill_relations')
                            .select(`
                                mentor_skills (
                                    id,
                                    name
                                )
                            `)
                            .eq('mentor_id', mentor.id)
                            .limit(3);

                        // Load statistics
                        const { data: bookingsData } = await supabase
                            .from('mentor_bookings')
                            .select('id, status')
                            .eq('mentor_id', mentor.id);

                        const { data: reviewsData } = await supabase
                            .from('mentor_reviews')
                            .select('rating')
                            .eq('mentor_id', mentor.id);

                        const totalBookings = bookingsData?.length || 0;
                        const averageRating = reviewsData?.length
                            ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
                            : 0;

                        // Type safety cho skills data
                        const skills = skillsData?.map(item => (item as any).mentor_skills).filter(Boolean) || [];

                        return {
                            ...mentor,
                            skills,
                            total_bookings: totalBookings,
                            average_rating: averageRating
                        } as RelatedMentor;
                    })
                );

                setRelatedMentors(mentorsWithStats);
            } catch (error) {
                console.error('Error fetching related mentors:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelatedMentors();
    }, [currentMentorId, currentMentorSkills, limit]);

    if (loading) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Có thể bạn quan tâm
                </h3>
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (relatedMentors.length === 0) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Có thể bạn quan tâm
                </h3>
                <div className="text-center py-6">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Không tìm thấy mentor liên quan</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                    Có thể bạn quan tâm
                </h3>
                <Link
                    href="/mentor"
                    className="text-cyan-600 hover:text-cyan-700 text-sm font-medium flex items-center space-x-1"
                >
                    <span>Xem tất cả</span>
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="space-y-3">
                {relatedMentors.map((mentor) => (
                    <div
                        key={mentor.id}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
                    >
                        <Link
                            href={`/mentor/${mentor.id}`}
                            className="flex items-center space-x-3 p-4 block"
                        >
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                    {mentor.avatar ? (
                                        <Image
                                            src={mentor.avatar}
                                            alt={mentor.full_name}
                                            width={48}
                                            height={48}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-cyan-400 to-blue-500">
                                            <span className="text-white font-semibold text-lg">
                                                {mentor.full_name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 hover:text-cyan-600 transition-colors">
                                    {mentor.full_name}
                                </h4>
                                {mentor.headline && (
                                    <p className="text-sm text-gray-600 line-clamp-1">
                                        {mentor.headline}
                                    </p>
                                )}
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MentorRelated;