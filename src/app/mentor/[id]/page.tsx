'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import Image from 'next/image';
import {
    Camera,
    Mail,
    Phone,
    Building,
    GraduationCap,
    Award,
    Calendar,
    MapPin,
    Globe,
    ArrowLeft,
    Eye,
    EyeOff,
    Star,
    Clock,
    Users,
    Briefcase
} from 'lucide-react';
import Link from 'next/link';

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

interface MentorData {
    id: string;
    full_name: string;
    email: string;
    avatar?: string;
    phone_number?: string;
    headline?: string;
    description?: string;
    skill: string[];
    published: boolean;
    created_at: string;
    updated_at: string;
    work_experiences: MentorWorkExperience[];
    educations: MentorEducation[];
    activities: MentorActivity[];
}

export default function MentorDetailPage() {
    const { id } = useParams();
    const [mentor, setMentor] = useState<MentorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMentor = async () => {
            try {
                setLoading(true);
                setError(null);

                // Lấy thông tin mentor với tất cả related data
                const { data: mentorData, error: mentorError } = await supabase
                    .from('mentors')
                    .select(`
                        *,
                        mentor_work_experiences!inner(*),
                        mentor_educations!inner(*),
                        mentor_activities!inner(*)
                    `)
                    .eq('id', id)
                    .eq('published', true) // Chỉ hiển thị mentor public
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

                // Transform data để match interface
                const transformedMentor: MentorData = {
                    ...mentorData,
                    work_experiences: (mentorData.mentor_work_experiences || [])
                        .filter((exp: any) => exp.published)
                        .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()),
                    educations: (mentorData.mentor_educations || [])
                        .filter((edu: any) => edu.published)
                        .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()),
                    activities: (mentorData.mentor_activities || [])
                        .filter((act: any) => act.published)
                        .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
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
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            month: 'short',
            year: 'numeric'
        });
    };

    const calculateDuration = (startDate: string, endDate?: string) => {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();
        const diffInMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

        const years = Math.floor(diffInMonths / 12);
        const months = diffInMonths % 12;

        if (years > 0 && months > 0) {
            return `${years} năm ${months} tháng`;
        } else if (years > 0) {
            return `${years} năm`;
        } else {
            return `${months} tháng`;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thông tin mentor...</p>
                </div>
            </div>
        );
    }

    if (error || !mentor) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <EyeOff className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy mentor</h1>
                    <p className="text-gray-600 mb-6">{error || 'Mentor này không tồn tại hoặc chưa được công khai'}</p>
                    <Link
                        href="/mentors"
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Sidebar - Basic Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden sticky top-8">
                            {/* Avatar & Basic Info */}
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-8 text-white">
                                <div className="text-center">
                                    <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-white/20 shadow-lg bg-white/10">
                                        {mentor.avatar ? (
                                            <Image
                                                src={mentor.avatar}
                                                alt={mentor.full_name}
                                                width={128}
                                                height={128}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full w-full bg-white/20">
                                                <Camera className="w-12 h-12 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <h1 className="text-2xl font-bold mb-2">{mentor.full_name}</h1>
                                    {mentor.headline && (
                                        <p className="text-cyan-100 text-lg">{mentor.headline}</p>
                                    )}
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="p-6 space-y-4">
                                {mentor.email && (
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-cyan-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Email</p>
                                            <a
                                                href={`mailto:${mentor.email}`}
                                                className="text-gray-900 hover:text-cyan-600 transition-colors duration-200"
                                            >
                                                {mentor.email}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {mentor.phone_number && (
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <Phone className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Điện thoại</p>
                                            <a
                                                href={`tel:${mentor.phone_number}`}
                                                className="text-gray-900 hover:text-green-600 transition-colors duration-200"
                                            >
                                                {mentor.phone_number}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Tham gia</p>
                                        <p className="text-gray-900">{formatDate(mentor.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Skills */}
                            {mentor.skill && mentor.skill.length > 0 && (
                                <div className="px-6 pb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                                        <Star className="w-5 h-5 text-amber-500" />
                                        <span>Kỹ năng chuyên môn</span>
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {mentor.skill.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 rounded-full text-sm font-medium"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Content - Detailed Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* About */}
                        {mentor.description && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                                    <Users className="w-6 h-6 text-cyan-600" />
                                    <span>Giới thiệu</span>
                                </h2>
                                <div className="prose prose-gray max-w-none">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {mentor.description}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Work Experience */}
                        {mentor.work_experiences && mentor.work_experiences.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                                    <Briefcase className="w-6 h-6 text-indigo-600" />
                                    <span>Kinh nghiệm làm việc</span>
                                </h2>
                                <div className="space-y-6">
                                    {mentor.work_experiences.map((exp, index) => (
                                        <div key={exp.id} className="relative">
                                            {index !== mentor.work_experiences.length - 1 && (
                                                <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-200"></div>
                                            )}
                                            <div className="flex space-x-4">
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-indigo-100 border-2 border-white shadow-sm">
                                                        {exp.avatar ? (
                                                            <Image
                                                                src={exp.avatar}
                                                                alt={exp.company}
                                                                width={48}
                                                                height={48}
                                                                className="object-cover w-full h-full"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full w-full">
                                                                <Building className="w-6 h-6 text-indigo-600" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900">{exp.position}</h3>
                                                            <p className="text-indigo-600 font-medium">{exp.company}</p>
                                                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                                                <span className="flex items-center space-x-1">
                                                                    <Calendar className="w-4 h-4" />
                                                                    <span>{formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : 'Hiện tại'}</span>
                                                                </span>
                                                                <span>({calculateDuration(exp.start_date, exp.end_date)})</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {exp.description && exp.description.length > 0 && (
                                                        <div className="mt-3">
                                                            <ul className="space-y-1">
                                                                {exp.description.map((desc, descIndex) => (
                                                                    <li key={descIndex} className="text-gray-600 text-sm flex items-start space-x-2">
                                                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></span>
                                                                        <span>{desc}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education */}
                        {mentor.educations && mentor.educations.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                                    <GraduationCap className="w-6 h-6 text-emerald-600" />
                                    <span>Học vấn</span>
                                </h2>
                                <div className="space-y-6">
                                    {mentor.educations.map((edu, index) => (
                                        <div key={edu.id} className="relative">
                                            {index !== mentor.educations.length - 1 && (
                                                <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-200"></div>
                                            )}
                                            <div className="flex space-x-4">
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-emerald-100 border-2 border-white shadow-sm">
                                                        {edu.avatar ? (
                                                            <Image
                                                                src={edu.avatar}
                                                                alt={edu.school}
                                                                width={48}
                                                                height={48}
                                                                className="object-cover w-full h-full"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full w-full">
                                                                <GraduationCap className="w-6 h-6 text-emerald-600" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900">{edu.degree}</h3>
                                                            <p className="text-emerald-600 font-medium">{edu.school}</p>
                                                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                                                <span className="flex items-center space-x-1">
                                                                    <Calendar className="w-4 h-4" />
                                                                    <span>{formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : 'Hiện tại'}</span>
                                                                </span>
                                                                <span>({calculateDuration(edu.start_date, edu.end_date)})</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {edu.description && edu.description.length > 0 && (
                                                        <div className="mt-3">
                                                            <ul className="space-y-1">
                                                                {edu.description.map((desc, descIndex) => (
                                                                    <li key={descIndex} className="text-gray-600 text-sm flex items-start space-x-2">
                                                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></span>
                                                                        <span>{desc}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Activities */}
                        {mentor.activities && mentor.activities.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                                    <Award className="w-6 h-6 text-violet-600" />
                                    <span>Hoạt động</span>
                                </h2>
                                <div className="space-y-6">
                                    {mentor.activities.map((activity, index) => (
                                        <div key={activity.id} className="relative">
                                            {index !== mentor.activities.length - 1 && (
                                                <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-200"></div>
                                            )}
                                            <div className="flex space-x-4">
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-violet-100 border-2 border-white shadow-sm">
                                                        {activity.avatar ? (
                                                            <Image
                                                                src={activity.avatar}
                                                                alt={activity.activity_name}
                                                                width={48}
                                                                height={48}
                                                                className="object-cover w-full h-full"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full w-full">
                                                                <Award className="w-6 h-6 text-violet-600" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900">{activity.activity_name}</h3>
                                                            <p className="text-violet-600 font-medium">
                                                                {activity.role} tại {activity.organization}
                                                            </p>
                                                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                                                <span className="flex items-center space-x-1">
                                                                    <Calendar className="w-4 h-4" />
                                                                    <span>{formatDate(activity.start_date)} - {activity.end_date ? formatDate(activity.end_date) : 'Hiện tại'}</span>
                                                                </span>
                                                                <span>({calculateDuration(activity.start_date, activity.end_date)})</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {activity.description && activity.description.length > 0 && (
                                                        <div className="mt-3">
                                                            <ul className="space-y-1">
                                                                {activity.description.map((desc, descIndex) => (
                                                                    <li key={descIndex} className="text-gray-600 text-sm flex items-start space-x-2">
                                                                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full mt-2 flex-shrink-0"></span>
                                                                        <span>{desc}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contact CTA */}
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
                            <div className="text-center">
                                <h3 className="text-2xl font-bold mb-2">Bạn muốn được tư vấn?</h3>
                                <p className="text-cyan-100 mb-6">
                                    Hãy liên hệ trực tiếp với {mentor.full_name} để được hỗ trợ tốt nhất
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    {mentor.email && (
                                        <a
                                            href={`mailto:${mentor.email}`}
                                            className="inline-flex items-center space-x-2 bg-white text-cyan-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
                                        >
                                            <Mail className="w-5 h-5" />
                                            <span>Gửi Email</span>
                                        </a>
                                    )}
                                    {mentor.phone_number && (
                                        <a
                                            href={`tel:${mentor.phone_number}`}
                                            className="inline-flex items-center space-x-2 bg-white/10 border-2 border-white text-white px-6 py-3 rounded-xl font-medium hover:bg-white hover:text-cyan-600 transition-all duration-300 transform hover:scale-105"
                                        >
                                            <Phone className="w-5 h-5" />
                                            <span>Gọi điện</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}