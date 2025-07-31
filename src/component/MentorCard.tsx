'use client'
import React from 'react';
import { User } from 'lucide-react';
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
    // Safely handle skills array
    const skills = Array.isArray(mentor.skill)
        ? mentor.skill.filter(skill => skill && skill.trim())
        : [];

    return (
        <Link href={`/mentor/${mentor.id}`} className="block">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-cyan-300 cursor-pointer transform hover:-translate-y-1 hover:bg-gradient-to-br hover:from-white hover:to-cyan-50">
                {/* Main Content */}
                <div className="p-6 text-center">
                    {/* Avatar - với viền và shadow */}
                    <div className="flex justify-center mb-4">
                        <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white shadow-lg border-2 border-gray-100">
                            {mentor.avatar ? (
                                <Image
                                    src={mentor.avatar}
                                    alt={mentor.full_name}
                                    width={112}
                                    height={112}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                    <User className="w-12 h-12 text-white" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Name */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 hover:text-cyan-700 transition-colors duration-200">
                        {mentor.full_name}
                    </h3>

                    {/* Headline */}
                    {mentor.headline ? (
                        <p className="text-sm text-cyan-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                            {mentor.headline}
                        </p>
                    ) : (
                        <div className="h-10 mb-4"></div>
                    )}

                    {/* Skills */}
                    {skills.length > 0 ? (
                        <div className="min-h-[3rem] flex items-center justify-center">
                            <div className="flex flex-wrap justify-center gap-1">
                                {skills.slice(0, 3).map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-cyan-100 hover:text-cyan-700 transition-colors duration-200 border border-gray-200"
                                    >
                                        {skill}
                                    </span>
                                ))}
                                {skills.length > 3 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md border border-gray-200">
                                        +{skills.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="min-h-[3rem] flex items-center justify-center">
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md border border-gray-200">
                                Chưa cập nhật kỹ năng
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};