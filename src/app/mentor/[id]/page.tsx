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
    FileText,
    Calendar,
    Award,
    Briefcase,
    GraduationCap,
    TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import MentorProfileTab from '@/component/mentor/MentorProfileTab';
import MentorReviewsTab from '@/component/mentor/MentorReviewsTab';
import MentorRelated from '@/component/mentor/MentorRelated';
import type { MentorDetailData } from '@/types/mentor_detail_user';

type TabType = 'profile' | 'reviews';

export default function MentorDetailPage() {
    const { id } = useParams();
    const [mentor, setMentor] = useState<MentorDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        const fetchMentor = async () => {
            try {
                setLoading(true);
                setError(null);

                const { data, error: rpcError } = await supabase
                    .rpc('mentordetailpage_user_get_complete_data', {
                        p_mentor_id: id
                    });

                if (rpcError) {
                    console.error('Error fetching mentor data:', rpcError);
                    setError('Có lỗi xảy ra khi tải thông tin mentor');
                    return;
                }

                if (!data || data.length === 0) {
                    setError('Mentor không tồn tại hoặc chưa được công khai');
                    return;
                }

                const mentorData = data[0];

                const transformedMentor: MentorDetailData = {
                    id: mentorData.id,
                    full_name: mentorData.full_name,
                    email: mentorData.email,
                    avatar: mentorData.avatar,
                    phone_number: mentorData.phone_number,
                    headline: mentorData.headline,
                    description: mentorData.description,
                    published: mentorData.published,
                    created_at: mentorData.created_at,
                    updated_at: mentorData.updated_at,
                    total_bookings: Number(mentorData.total_bookings || 0),
                    completed_bookings: Number(mentorData.completed_bookings || 0),
                    average_rating: Number(mentorData.average_rating || 0),
                    total_reviews: Number(mentorData.total_reviews || 0),
                    skills: mentorData.skills || [],
                    work_experiences: mentorData.work_experiences || [],
                    educations: mentorData.educations || [],
                    activities: mentorData.activities || [],
                    reviews: mentorData.reviews || []
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

    const handleTabChange = (tab: TabType) => {
        if (tab === activeTab) return;

        setIsTransitioning(true);
        setTimeout(() => {
            setActiveTab(tab);
            setTimeout(() => {
                setIsTransitioning(false);
            }, 50);
        }, 200);
    };

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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-cyan-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-600 animate-spin"></div>
                    </div>
                    <p className="text-gray-700 font-medium">Đang tải thông tin mentor...</p>
                </div>
            </div>
        );
    }

    if (error || !mentor) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md mx-auto">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <EyeOff className="w-10 h-10 text-red-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Không tìm thấy mentor</h1>
                    <p className="text-gray-600 mb-8 leading-relaxed">{error || 'Mentor này không tồn tại hoặc chưa được công khai'}</p>
                    <Link
                        href="/mentor"
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Quay lại danh sách</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <Link
                    href="/mentor"
                    className="inline-flex items-center space-x-2 text-gray-600 hover:text-cyan-600 mb-6 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Quay lại danh sách</span>
                </Link>

                {/* Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 lg:gap-8">
                    {/* Left Column - 70% */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Profile Header Card */}
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                            {/* Cover with Avatar */}
                            <div className="relative bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-6 sm:px-8 py-8 sm:py-12">
                                {/* Decorative Background */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]"></div>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-y-32 -translate-x-32"></div>

                                <div className="relative flex flex-col sm:flex-row items-center sm:items-end space-y-6 sm:space-y-0 sm:space-x-6">
                                    {/* Avatar */}
                                    <div className="relative group">
                                        <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden ring-4 ring-white/30 shadow-2xl bg-white/10 flex-shrink-0 transform group-hover:scale-105 transition-transform duration-300">
                                            {mentor.avatar ? (
                                                <Image
                                                    src={mentor.avatar}
                                                    alt={mentor.full_name}
                                                    width={144}
                                                    height={144}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-cyan-400 to-blue-500">
                                                    <Camera className="w-14 h-14 text-white/80" />
                                                </div>
                                            )}
                                        </div>
                                        {mentor.average_rating > 0 && (
                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full shadow-lg flex items-center space-x-1 text-sm font-bold">
                                                <Star className="w-4 h-4 fill-current" />
                                                <span>{mentor.average_rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 text-center sm:text-left space-y-3 sm:space-y-4">
                                        <div>
                                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight">
                                                {mentor.full_name}
                                            </h1>
                                            {mentor.headline && (
                                                <p className="text-lg sm:text-xl text-cyan-50 font-medium leading-relaxed">
                                                    {mentor.headline}
                                                </p>
                                            )}
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4">
                                            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                                <Clock className="w-4 h-4 text-cyan-200" />
                                                <span className="text-sm text-white font-medium">
                                                    {formatDate(mentor.created_at)}
                                                </span>
                                            </div>

                                            {mentor.total_bookings > 0 && (
                                                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                                    <Users className="w-4 h-4 text-cyan-200" />
                                                    <span className="text-sm text-white">
                                                        <strong className="font-bold">{mentor.total_bookings}</strong> học viên
                                                    </span>
                                                </div>
                                            )}

                                            {mentor.completed_bookings > 0 && (
                                                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                                    <CheckCircle className="w-4 h-4 text-green-300" />
                                                    <span className="text-sm text-white">
                                                        <strong className="font-bold">{mentor.completed_bookings}</strong> hoàn thành
                                                    </span>
                                                </div>
                                            )}

                                            {mentor.total_reviews > 0 && (
                                                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                                    <MessageSquare className="w-4 h-4 text-cyan-200" />
                                                    <span className="text-sm text-white">
                                                        <strong className="font-bold">{mentor.total_reviews}</strong> đánh giá
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact & Action Section */}
                            <div className="px-6 sm:px-8 py-6 bg-gradient-to-br from-gray-50 to-white border-t border-gray-100">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 gap-4">
                                    {/* Contact Info */}
                                    <div className="flex flex-wrap items-center gap-4">
                                        {mentor.email && (
                                            <a
                                                href={`mailto:${mentor.email}`}
                                                className="group flex items-center space-x-2 text-gray-600 hover:text-cyan-600 transition-all duration-300 bg-white px-4 py-2 rounded-lg border border-gray-200 hover:border-cyan-300 hover:shadow-md"
                                            >
                                                <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                <span className="text-sm font-medium">{mentor.email}</span>
                                            </a>
                                        )}
                                        {mentor.phone_number && (
                                            <a
                                                href={`tel:${mentor.phone_number}`}
                                                className="group flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-all duration-300 bg-white px-4 py-2 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md"
                                            >
                                                <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                <span className="text-sm font-medium">{mentor.phone_number}</span>
                                            </a>
                                        )}
                                    </div>

                                    {/* CTA Button */}
                                    <Link
                                        href={`/mentor_booking?mentor=${mentor.id}`}
                                        className="group inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span>Đặt lịch ngay</span>
                                    </Link>
                                </div>

                                {/* Skills Section */}
                                {mentor.skills && mentor.skills.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <div className="flex items-center space-x-2 mb-4">
                                            <Award className="w-5 h-5 text-cyan-600" />
                                            <h3 className="text-base font-bold text-gray-800">Kỹ năng chuyên môn</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {mentor.skills.map((skill) => (
                                                <span
                                                    key={skill.id}
                                                    className="group relative px-4 py-2 bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 text-cyan-700 rounded-lg text-sm font-semibold border border-cyan-200 hover:border-cyan-300 transition-all duration-300 cursor-default hover:shadow-md transform hover:-translate-y-0.5"
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

                        {/* Quick Stats Cards */}
                        {(mentor.work_experiences.length > 0 || mentor.educations.length > 0 || mentor.activities.length > 0) && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {mentor.work_experiences.length > 0 && (
                                    <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center">
                                                <Briefcase className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-gray-900">{mentor.work_experiences.length}</p>
                                                <p className="text-sm text-gray-600 font-medium">Kinh nghiệm</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {mentor.educations.length > 0 && (
                                    <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                                                <GraduationCap className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-gray-900">{mentor.educations.length}</p>
                                                <p className="text-sm text-gray-600 font-medium">Học vấn</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {mentor.activities.length > 0 && (
                                    <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                                                <TrendingUp className="w-6 h-6 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-gray-900">{mentor.activities.length}</p>
                                                <p className="text-sm text-gray-600 font-medium">Hoạt động</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                            <nav className="flex border-b border-gray-200">
                                <button
                                    onClick={() => handleTabChange('profile')}
                                    className={`flex-1 py-4 px-6 font-semibold text-sm transition-all duration-300 relative ${
                                        activeTab === 'profile'
                                            ? 'text-cyan-600 bg-cyan-50/50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-center space-x-2">
                                        <FileText className="w-4 h-4" />
                                        <span>Hồ sơ</span>
                                    </div>
                                    {activeTab === 'profile' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                                    )}
                                </button>

                                <button
                                    onClick={() => handleTabChange('reviews')}
                                    className={`flex-1 py-4 px-6 font-semibold text-sm transition-all duration-300 relative ${
                                        activeTab === 'reviews'
                                            ? 'text-cyan-600 bg-cyan-50/50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-center space-x-2">
                                        <MessageSquare className="w-4 h-4" />
                                        <span>Đánh giá</span>
                                        {mentor.total_reviews > 0 && (
                                            <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                {mentor.total_reviews}
                                            </span>
                                        )}
                                    </div>
                                    {activeTab === 'reviews' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                                    )}
                                </button>
                            </nav>

                            {/* Tab Content with Smooth Transition */}
                            <div className="p-6 sm:p-8">
                                <div
                                    className={`transition-opacity duration-200 ${
                                        isTransitioning ? 'opacity-0' : 'opacity-100'
                                    }`}
                                >
                                    {activeTab === 'profile' && (
                                        <MentorProfileTab
                                            description={mentor.description}
                                            skills={[]}
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
                    </div>

                    {/* Right Column - 30% */}
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