'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import Image from 'next/image';
import {
    Camera,
    Mail,
    Phone,
    Clock,
    Star,
    Users,
    CheckCircle,
    MessageSquare,
    ArrowLeft,
    EyeOff,
    ExternalLink,
    FileText,
    Calendar
} from 'lucide-react';
import Link from 'next/link';
import MentorProfileTab from '@/component/mentor/MentorProfileTab';
import MentorReviewsTab from '@/component/mentor/MentorReviewsTab';
import MentorRelated from '@/component/mentor/MentorRelated';

interface MentorWorkExperience {
    id: string;
    avatar?: string;
    company: string;
    position: string;
    start_date: string;
    end_date?: string;
    description: string[];
    published: boolean;
}

interface MentorEducation {
    id: string;
    avatar?: string;
    school: string;
    degree: string;
    start_date: string;
    end_date?: string;
    description: string[];
    published: boolean;
}

interface MentorActivity {
    id: string;
    avatar?: string;
    organization: string;
    role: string;
    activity_name: string;
    start_date: string;
    end_date?: string;
    description: string[];
    published: boolean;
}

interface MentorSkill {
    id: string;
    name: string;
    description?: string;
}

interface MentorReview {
    id: string;
    rating: number;
    comment?: string;
    is_published: boolean;
    created_at: string;
    profiles?: {
        full_name: string;
        image_url?: string;
    };
}

interface MentorData {
    id: string;
    full_name: string;
    email: string;
    avatar?: string;
    phone_number?: string;
    headline?: string;
    description?: string;
    published: boolean;
    created_at: string;
    updated_at: string;
    skills: MentorSkill[];
    work_experiences: MentorWorkExperience[];
    educations: MentorEducation[];
    activities: MentorActivity[];
    total_bookings?: number;
    completed_bookings?: number;
    average_rating?: number;
    total_reviews?: number;
    reviews?: MentorReview[];
}

type TabType = 'profile' | 'reviews';

export default function MentorDetailPage() {
    const { id } = useParams();
    const [mentor, setMentor] = useState<MentorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('profile');

    useEffect(() => {
        const fetchMentor = async () => {
            try {
                setLoading(true);
                setError(null);

                // Lấy thông tin mentor với related data
                const { data: mentorData, error: mentorError } = await supabase
                    .from('mentors')
                    .select(`
                        *,
                        mentor_work_experiences(*),
                        mentor_educations(*),
                        mentor_activities(*)
                    `)
                    .eq('id', id)
                    .eq('published', true)
                    .single();

                if (mentorError) {
                    console.error('Error fetching mentor:', mentorError);
                    if (mentorError.code === 'PGRST116') {
                        setError('Mentor không tồn tại hoặc chưa được công khai');
                    } else {
                        setError('Có lỗi xảy ra khi tải thông tin mentor');
                    }
                    return;
                }

                // Load skills từ mentor_skill_relations
                const { data: skillsData, error: skillsError } = await supabase
                    .from('mentor_skill_relations')
                    .select(`
                        mentor_skills (
                            id,
                            name,
                            description
                        )
                    `)
                    .eq('mentor_id', id);

                if (skillsError) {
                    console.error('Error loading skills:', skillsError);
                }

                // Load statistics
                const { data: bookingsData } = await supabase
                    .from('mentor_bookings')
                    .select('id, status')
                    .eq('mentor_id', id);

                const totalBookings = bookingsData?.length || 0;
                const completedBookings = bookingsData?.filter(b => b.status === 'completed').length || 0;

                // Load reviews và average rating - FIXED: Handle null case
                const { data: reviewsData } = await supabase
                    .from('mentor_reviews')
                    .select(`
                        id,
                        rating,
                        comment,
                        is_published,
                        created_at,
                        profiles (
                            full_name,
                            image_url
                        )
                    `)
                    .eq('mentor_id', id)
                    .eq('is_published', true)
                    .order('created_at', { ascending: false });

                const safeReviewsData = reviewsData || []; // Fix null issue
                const totalReviews = safeReviewsData.length;
                const averageRating = totalReviews > 0
                    ? safeReviewsData.reduce((sum, r) => sum + r.rating, 0) / totalReviews
                    : 0;

                // Transform data để match interface và filter published items
                const skills = skillsData?.map(item => item.mentor_skills).filter(Boolean) || [];

                const transformedMentor: MentorData = {
                    ...mentorData,
                    skills,
                    work_experiences: (mentorData.mentor_work_experiences || [])
                        .filter((exp: any) => exp.published)
                        .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()),
                    educations: (mentorData.mentor_educations || [])
                        .filter((edu: any) => edu.published)
                        .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()),
                    activities: (mentorData.mentor_activities || [])
                        .filter((act: any) => act.published)
                        .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()),
                    total_bookings: totalBookings,
                    completed_bookings: completedBookings,
                    average_rating: averageRating,
                    total_reviews: totalReviews,
                    reviews: safeReviewsData // Use safe data
                };

                setMentor(transformedMentor);
            } catch (err) {
                console.error('Unexpected error:', err);
                setError('Có lỗi không mong muốn xảy ra');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchMentor();
        }
    }, [id]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('vi-VN', {
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thông tin mentor...</p>
                </div>
            </div>
        );
    }

    if (error || !mentor) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <EyeOff className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy mentor</h1>
                    <p className="text-gray-600 mb-6">{error || 'Mentor này không tồn tại hoặc chưa được công khai'}</p>
                    <Link
                        href="/mentor"
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Quay lại danh sách</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Two Column Layout - 70% | 30% */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                    {/* Left Column - Mentor Profile - 70% */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Profile Header */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                            {/* Cover & Avatar */}
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-12 text-white relative">
                                {/* Background Pattern */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>

                                <div className="relative flex flex-col lg:flex-row items-center lg:items-end space-y-6 lg:space-y-0 lg:space-x-8">
                                    {/* Avatar */}
                                    <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/20 shadow-xl bg-white/10 flex-shrink-0">
                                        {mentor.avatar ? (
                                            <Image
                                                src={mentor.avatar}
                                                alt={mentor.full_name}
                                                width={128}
                                                height={128}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full w-full">
                                                <Camera className="w-12 h-12 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Basic Info */}
                                    <div className="flex-1 text-center lg:text-left">
                                        <h1 className="text-3xl lg:text-4xl font-bold mb-2">{mentor.full_name}</h1>
                                        {mentor.headline && (
                                            <p className="text-xl text-cyan-100 font-medium mb-4">{mentor.headline}</p>
                                        )}

                                        {/* Stats Row */}
                                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-cyan-100">
                                            {/* Always show join date */}
                                            <div className="flex items-center space-x-2">
                                                <Clock className="w-5 h-5" />
                                                <span>Tham gia {formatDate(mentor.created_at)}</span>
                                            </div>

                                            {/* Only show stats if they exist and > 0 */}
                                            {mentor.total_bookings > 0 && (
                                                <div className="flex items-center space-x-2">
                                                    <Users className="w-5 h-5" />
                                                    <span><strong className="text-white">{mentor.total_bookings}</strong> học viên</span>
                                                </div>
                                            )}

                                            {mentor.average_rating > 0 && (
                                                <div className="flex items-center space-x-2">
                                                    <Star className="w-5 h-5 text-yellow-300 fill-current" />
                                                    <span><strong className="text-white">{mentor.average_rating.toFixed(1)}</strong> điểm</span>
                                                </div>
                                            )}

                                            {mentor.completed_bookings > 0 && (
                                                <div className="flex items-center space-x-2">
                                                    <CheckCircle className="w-5 h-5" />
                                                    <span><strong className="text-white">{mentor.completed_bookings}</strong> hoàn thành</span>
                                                </div>
                                            )}

                                            {mentor.total_reviews > 0 && (
                                                <div className="flex items-center space-x-2">
                                                    <MessageSquare className="w-5 h-5" />
                                                    <span><strong className="text-white">{mentor.total_reviews}</strong> đánh giá</span>
                                                </div>
                                            )}

                                            {/* Show fallback message only if NO stats available */}
                                            {!mentor.total_bookings &&
                                                !mentor.average_rating &&
                                                !mentor.completed_bookings &&
                                                !mentor.total_reviews && (
                                                    <div className="flex items-center space-x-2 opacity-75">
                                                        <span className="text-sm">Mentor mới - chưa có dữ liệu thống kê</span>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact & Skills Section */}
                            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                                    {/* Contact Info */}
                                    <div className="flex flex-wrap items-center gap-6">
                                        {mentor.email && (
                                            <a
                                                href={`mailto:${mentor.email}`}
                                                className="flex items-center space-x-2 text-gray-600 hover:text-cyan-600 transition-colors"
                                            >
                                                <Mail className="w-4 h-4" />
                                                <span className="text-sm font-medium">{mentor.email}</span>
                                            </a>
                                        )}
                                        {mentor.phone_number && (
                                            <a
                                                href={`tel:${mentor.phone_number}`}
                                                className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
                                            >
                                                <Phone className="w-4 h-4" />
                                                <span className="text-sm font-medium">{mentor.phone_number}</span>
                                            </a>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => {
                                                // TODO: Implement booking functionality
                                                alert('Chức năng đặt lịch đang được phát triển');
                                            }}
                                            className="inline-flex items-center space-x-2 bg-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                                        >
                                            <Calendar className="w-4 h-4" />
                                            <span>Đặt lịch ngay</span>
                                        </button>

                                        {mentor.email && (
                                            <a
                                                href={`mailto:${mentor.email}`}
                                                className="inline-flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300"
                                            >
                                                <Mail className="w-4 h-4" />
                                                <span>Liên hệ</span>
                                                <ExternalLink className="w-4 h-4 opacity-50" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Skills */}
                                {mentor.skills && mentor.skills.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Kỹ năng chuyên môn:</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {mentor.skills.map((skill) => (
                                                <span
                                                    key={skill.id}
                                                    className="px-3 py-1 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 rounded-full text-sm font-medium border border-cyan-200"
                                                    title={skill.description}
                                                >
                                                    {skill.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tab Navigation - Separate Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <nav className="flex space-x-8 px-8 py-4">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === 'profile'
                                            ? 'border-cyan-500 text-cyan-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <FileText className="w-4 h-4" />
                                        <span>Hồ sơ</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === 'reviews'
                                            ? 'border-cyan-500 text-cyan-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <MessageSquare className="w-4 h-4" />
                                        <span>Đánh giá</span>
                                        {mentor.total_reviews > 0 && (
                                            <span className="bg-cyan-100 text-cyan-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                                {mentor.total_reviews}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content - Separate Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="p-8">
                                {activeTab === 'profile' && (
                                    <MentorProfileTab
                                        description={mentor.description}
                                        skills={mentor.skills}
                                        work_experiences={mentor.work_experiences}
                                        educations={mentor.educations}
                                        activities={mentor.activities}
                                    />
                                )}

                                {activeTab === 'reviews' && (
                                    <MentorReviewsTab
                                        reviews={mentor.reviews || []}
                                        average_rating={mentor.average_rating}
                                        total_reviews={mentor.total_reviews}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Related Mentors - 30% */}
                    <div className="lg:col-span-3">
                        <div className="sticky top-8">
                            <MentorRelated
                                currentMentorId={mentor.id}
                                currentMentorSkills={mentor.skills}
                                limit={3}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}