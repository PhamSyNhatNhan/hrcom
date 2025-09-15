'use client'
import React from 'react';
import { User, Star, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface MentorSkill {
    id: string;
    name: string;
    description?: string;
}

interface Mentor {
    id: string;
    full_name: string;
    headline?: string;
    avatar?: string;
    skill?: string[]; // Legacy field - array of skill names
    skills?: MentorSkill[]; // New structure - array of skill objects
    description?: string;
    published?: boolean;
    created_at?: string;
    // Statistics
    total_bookings?: number;
    completed_bookings?: number;
    average_rating?: number;
    total_reviews?: number;
}

interface MentorCardProps {
    mentor: Mentor;
}

export const MentorCard = ({ mentor }: MentorCardProps) => {
    // Handle both skill formats for backward compatibility
    const getSkills = (): string[] => {
        // If we have the new skills structure, use it
        if (mentor.skills && Array.isArray(mentor.skills)) {
            return mentor.skills
                .map(skill => skill.name)
                .filter(name => name && name.trim());
        }

        // Fall back to legacy skill field
        if (mentor.skill && Array.isArray(mentor.skill)) {
            return mentor.skill.filter(skill => skill && skill.trim());
        }

        return [];
    };

    const skills = getSkills();

    const formatDate = (dateStr?: string) => {
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

    // Check if we have any statistics to show
    const hasStats = (mentor.total_bookings && mentor.total_bookings > 0) ||
        (mentor.average_rating && mentor.average_rating > 0) ||
        (mentor.total_reviews && mentor.total_reviews > 0);

    return (
        <div className="group relative">
            <Link href={`/mentor/${mentor.id}`} className="block">
                <div className="bg-white hover:bg-cyan-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-cyan-200 cursor-pointer transform hover:-translate-y-2 hover:scale-[1.02] relative">

                    {/* Header with Avatar */}
                    <div className="relative bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-6 text-center text-white">
                        {/* Avatar */}
                        <div className="relative inline-block mb-3">
                            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white/30 shadow-xl">
                                {mentor.avatar ? (
                                    <Image
                                        src={mentor.avatar}
                                        alt={mentor.full_name}
                                        width={80}
                                        height={80}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-white/20 flex items-center justify-center">
                                        <User className="w-8 h-8 text-white" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Name */}
                        <h3 className="text-lg font-bold mb-2 line-clamp-1">{mentor.full_name}</h3>

                        {/* Rating or Join Date */}
                        {hasStats ? (
                            <div className="flex items-center justify-center space-x-3 text-sm">
                                {mentor.average_rating && mentor.average_rating > 0 && (
                                    <div className="flex items-center space-x-1">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-3 h-3 ${
                                                        i < Math.round(mentor.average_rating!)
                                                            ? 'text-yellow-300 fill-current'
                                                            : 'text-white/30'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-white/90 text-xs">
                                            ({mentor.average_rating.toFixed(1)})
                                        </span>
                                    </div>
                                )}

                                {mentor.total_bookings && mentor.total_bookings > 0 && (
                                    <div className="flex items-center space-x-1">
                                        <Users className="w-3 h-3" />
                                        <span className="text-white/90 text-xs">{mentor.total_bookings}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center space-x-1 text-cyan-100">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs">
                                    Tham gia {formatDate(mentor.created_at)}
                                </span>
                            </div>
                        )}

                        {/* Decorative elements */}
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                            <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/10 rounded-full"></div>
                            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-white/5 rounded-full"></div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="relative p-4 space-y-3">
                        {/* Headline */}
                        <div className="text-center min-h-[2rem] flex items-center justify-center">
                            {mentor.headline ? (
                                <p className="text-sm text-gray-600 font-medium leading-relaxed line-clamp-2">
                                    {mentor.headline}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400 italic">
                                    Chưa cập nhật tiêu đề chuyên môn
                                </p>
                            )}
                        </div>

                        {/* Skills */}
                        <div className="min-h-[3rem]">
                            {skills.length > 0 ? (
                                <>
                                    <div className="flex items-center justify-center space-x-1 mb-2">
                                        <Star className="w-3 h-3 text-cyan-600" />
                                        <span className="text-xs font-medium text-gray-700">Chuyên môn</span>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-1">
                                        {skills.slice(0, 2).map((skill, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 text-xs rounded-full font-medium border border-cyan-200 hover:from-cyan-200 hover:to-blue-200 transition-all duration-300"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                        {skills.length > 2 && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200 font-medium">
                                                +{skills.length - 2}
                                            </span>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center">
                                    <div className="flex items-center justify-center space-x-1 mb-2">
                                        <Star className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs font-medium text-gray-500">Chuyên môn</span>
                                    </div>
                                    <span className="px-3 py-1 bg-gray-50 text-gray-400 text-xs rounded-full border border-gray-200 italic">
                                        Chưa cập nhật
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Statistics Footer */}
                        <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                                <span>{mentor.completed_bookings || 0} hoàn thành</span>
                                <span>{mentor.total_reviews || 0} đánh giá</span>
                            </div>
                        </div>
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
            </Link>
        </div>
    );
};