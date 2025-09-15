'use client';
import React from 'react';
import Image from 'next/image';
import {
    Building,
    GraduationCap,
    Award,
    Calendar,
    Users,
    Briefcase
} from 'lucide-react';

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

interface MentorProfileTabProps {
    description?: string;
    skills: MentorSkill[];
    work_experiences: MentorWorkExperience[];
    educations: MentorEducation[];
    activities: MentorActivity[];
}

const MentorProfileTab: React.FC<MentorProfileTabProps> = ({
                                                               description,
                                                               skills,
                                                               work_experiences,
                                                               educations,
                                                               activities
                                                           }) => {
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

    const calculateDuration = (startDate: string, endDate?: string) => {
        if (!startDate) return '';

        try {
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
        } catch {
            return '';
        }
    };

    return (
        <div className="space-y-8">
            {/* About */}
            {description && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <Users className="w-5 h-5 text-cyan-600" />
                        <span>Giới thiệu</span>
                    </h3>
                    <div className="prose prose-gray max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {description}
                        </p>
                    </div>
                </div>
            )}

            {/* Skills */}
            {skills && skills.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Kỹ năng chuyên môn
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                            <span
                                key={skill.id}
                                className="px-3 py-1.5 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 rounded-full text-sm font-medium border border-cyan-200"
                                title={skill.description}
                            >
                                {skill.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Work Experience */}
            {work_experiences && work_experiences.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                        <Briefcase className="w-5 h-5 text-indigo-600" />
                        <span>Kinh nghiệm làm việc</span>
                    </h3>
                    <div className="space-y-6">
                        {work_experiences.map((exp, index) => (
                            <div key={exp.id} className="relative">
                                {index !== work_experiences.length - 1 && (
                                    <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200"></div>
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
                                        <h4 className="text-lg font-semibold text-gray-900">{exp.position}</h4>
                                        <p className="text-indigo-600 font-medium">{exp.company}</p>
                                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                            <span className="flex items-center space-x-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : 'Hiện tại'}</span>
                                            </span>
                                            {exp.start_date && (
                                                <span>({calculateDuration(exp.start_date, exp.end_date)})</span>
                                            )}
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
            {educations && educations.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                        <GraduationCap className="w-5 h-5 text-emerald-600" />
                        <span>Học vấn</span>
                    </h3>
                    <div className="space-y-6">
                        {educations.map((edu, index) => (
                            <div key={edu.id} className="relative">
                                {index !== educations.length - 1 && (
                                    <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200"></div>
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
                                        <h4 className="text-lg font-semibold text-gray-900">{edu.degree}</h4>
                                        <p className="text-emerald-600 font-medium">{edu.school}</p>
                                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                            <span className="flex items-center space-x-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : 'Hiện tại'}</span>
                                            </span>
                                            {edu.start_date && (
                                                <span>({calculateDuration(edu.start_date, edu.end_date)})</span>
                                            )}
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
            {activities && activities.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                        <Award className="w-5 h-5 text-violet-600" />
                        <span>Hoạt động & Thành tích</span>
                    </h3>
                    <div className="space-y-6">
                        {activities.map((activity, index) => (
                            <div key={activity.id} className="relative">
                                {index !== activities.length - 1 && (
                                    <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200"></div>
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
                                        <h4 className="text-lg font-semibold text-gray-900">{activity.activity_name}</h4>
                                        <p className="text-violet-600 font-medium">
                                            {activity.role} tại {activity.organization}
                                        </p>
                                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                            <span className="flex items-center space-x-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDate(activity.start_date)} - {activity.end_date ? formatDate(activity.end_date) : 'Hiện tại'}</span>
                                            </span>
                                            {activity.start_date && (
                                                <span>({calculateDuration(activity.start_date, activity.end_date)})</span>
                                            )}
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
        </div>
    );
};

export default MentorProfileTab;