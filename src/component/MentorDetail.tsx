'use client';
import React from 'react';

interface Experience {
    position: string;
    company: string;
    time: string;
}

interface Education {
    degree: string;
    school: string;
    year: string;
}

interface Activities {
    title: string;
    description: string;
    year: string;
}

interface Mentor {
    id: number;
    name: string;
    role: string;
    company: string;
    image: string;
    specialties: string[];
    bio?: string;
    experience?: Array<Experience>;
    education?: Array<Education>;
    activities?: Array<Activities>;
}

interface MentorDetailProps {
    mentor: Mentor;
}

export const MentorDetail: React.FC<MentorDetailProps> = ({ mentor }) => (
    <div className="bg-white rounded-xl shadow-lg max-w-2xl mx-auto my-8">
        {/* Header với background image và thông tin mentor */}
        <div className="relative">
            <div
                className="h-48 bg-gray-100 rounded-t-xl w-full"
                style={{
                    backgroundImage: "url('/hrcompanion1-17.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            
            {/* Avatar và thông tin cơ bản */}
            <div className="absolute left-6 top-24 flex items-start gap-4">
                <img
                    src={mentor.image}
                    alt={mentor.name}
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                />
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-white drop-shadow-lg">{mentor.name}</h2>
                    <p className="text-white drop-shadow-lg font-medium text-sm">{mentor.role} tại {mentor.company}</p>
                </div>
            </div>

        </div>

        {/* Content sections */}
        <div className="p-6 space-y-6">
            {/* Giới thiệu bản thân */}
            {mentor.bio && (
                <div>
                    <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b-2 border-teal-600 pb-1 inline-block">
                        GIỚI THIỆU BẢN THÂN
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{mentor.bio}</p>
                </div>
            )}

            {/* Kinh nghiệm làm việc */}
            {mentor.experience && mentor.experience.length > 0 && (
                <div>
                    <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b-2 border-teal-600 pb-1 inline-block">
                        KINH NGHIỆM LÀM VIỆC
                    </h3>
                    <div className="space-y-3">
                        {mentor.experience.map((exp, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{exp.position}</p>
                                            <p className="text-teal-700 text-sm">{exp.company}</p>
                                        </div>
                                        <span className="text-gray-500 text-xs">{exp.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quá trình học tập */}
            {mentor.education && mentor.education.length > 0 && (
                <div>
                    <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b-2 border-teal-600 pb-1 inline-block">
                        QUÁ TRÌNH HỌC TẬP
                    </h3>
                    <div className="space-y-3">
                        {mentor.education.map((edu, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{edu.school}</p>
                                            <p className="text-gray-600 text-sm">{edu.degree}</p>
                                        </div>
                                        <span className="text-gray-500 text-xs">{edu.year}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Hoạt động ngoại khóa */}
            {mentor.activities && mentor.activities.length > 0 && (
                <div>
                    <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b-2 border-teal-600 pb-1 inline-block">
                        HOẠT ĐỘNG
                    </h3>
                    <div className="space-y-3">
                        {mentor.activities.map((act, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{act.title}</p>
                                            <p className="text-gray-600 text-sm">{act.description}</p>
                                        </div>
                                        <span className="text-gray-500 text-xs">{act.year}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
);