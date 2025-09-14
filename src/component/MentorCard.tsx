'use client'
import React from 'react';
import { User, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Mentor {
    id: string;
    full_name: string;
    headline?: string;
    avatar?: string;
    skill?: string[];
    description?: string;
    published?: boolean;
    created_at?: string;
}

interface MentorCardProps {
    mentor: Mentor;
}

export const MentorCard = ({ mentor }: MentorCardProps) => {
    const skills = Array.isArray(mentor.skill)
        ? mentor.skill.filter(skill => skill && skill.trim())
        : [];

    const truncateDescription = (text?: string, maxLength: number = 120) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (
        <div className="group relative">
            <Link href={`/mentor/${mentor.id}`} className="block">
                <div className="bg-white hover:bg-cyan-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-cyan-200 cursor-pointer transform hover:-translate-y-2 hover:scale-[1.02] relative">

                    {/* Header with Avatar */}
                    <div className="relative bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-8 text-center text-white">
                        {/* Avatar */}
                        <div className="relative inline-block mb-4">
                            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/30 shadow-xl">
                                {mentor.avatar ? (
                                    <Image
                                        src={mentor.avatar}
                                        alt={mentor.full_name}
                                        width={96}
                                        height={96}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-white/20 flex items-center justify-center">
                                        <User className="w-10 h-10 text-white" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Name */}
                        <h3 className="text-xl font-bold mb-2">{mentor.full_name}</h3>

                        {/* Rating */}
                        <div className="flex items-center justify-center space-x-1 text-amber-300">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                            <span className="text-xs text-white/80 ml-1">(4.9)</span>
                        </div>

                        {/* Decorative elements */}
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                            <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/10 rounded-full"></div>
                            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-white/5 rounded-full"></div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="relative p-6 space-y-4">
                        {/* Headline */}
                        <div className="text-center min-h-[2.5rem] flex items-center justify-center">
                            {mentor.headline ? (
                                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                    {mentor.headline}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400 italic">
                                    Chưa cập nhật tiêu đề chuyên môn
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        {mentor.description && (
                            <div className="text-center">
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {truncateDescription(mentor.description)}
                                </p>
                            </div>
                        )}

                        {/* Skills */}
                        <div className="min-h-[4rem]">
                            {skills.length > 0 ? (
                                <>
                                    <div className="flex items-center justify-center space-x-1 mb-2">
                                        <Star className="w-3 h-3 text-cyan-600" />
                                        <span className="text-xs font-medium text-gray-700">Chuyên môn</span>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-1">
                                        {skills.slice(0, 3).map((skill, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 text-xs rounded-full font-medium border border-cyan-200 hover:from-cyan-200 hover:to-blue-200 transition-all duration-300"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                        {skills.length > 3 && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200 font-medium">
                                                +{skills.length - 3} khác
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
                                    <span className="px-3 py-2 bg-gray-50 text-gray-400 text-xs rounded-full border border-gray-200 italic">
                                        Chưa cập nhật kỹ năng
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
            </Link>
        </div>
    );
};
