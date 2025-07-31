'use client';
import React from 'react';

// interface Experience {
//     position: string;
//     company: string;
//     time: string;
// }

// interface Education {
//     degree: string;
//     school: string;
//     year: string;
// }

// interface Activities {
//     title: string;
//     description: string;
//     year: string;
// }

// interface Mentor {
//     id: number;
//     name: string;
//     role: string;
//     company: string;
//     image: string;
//     specialties: string[];
//     bio?: string;
//     experience?: Array<Experience>;
//     education?: Array<Education>;
//     activities?: Array<Activities>;
// }

// interface MentorDetailProps {
//     mentor: Mentor;
// }
interface Mentor {
    id: string;
    full_name: string;
    headline: string;
    avatar: string;
    skill: string[];
    description?: string;
    experience?: Array<{
        id: string;
        company: string;
        position: string;
        start_date: string;
        end_date: string;
        description?: string;
    }>;
    education?: Array<{
        id: string;
        school: string;
        degree: string;
        start_date: string;
        end_date: string;
        description?: string;
    }>;
    activities?: Array<{
        id: string;
        organization: string;
        role: string;
        activity_name: string;
        start_date: string;
        end_date: string;
        description?: string;
    }>;
}

interface MentorDetailProps {
    mentor: Mentor;
}

// export const MentorDetail: React.FC<MentorDetailProps> = ({ mentor }) => (
//     <div className="bg-white rounded-xl shadow-lg max-w-2xl mx-auto my-8">
//         {/* Header với background image và thông tin mentor */}
//         <div className="relative">
//             <div
//                 className="h-48 bg-gray-100 rounded-t-xl w-full"
//                 style={{
//                     backgroundImage: "url('/hrcompanion1-17.jpg')",
//                     backgroundSize: 'cover',
//                     backgroundPosition: 'center',
//                 }}
//             />

//             {/* Avatar và thông tin cơ bản */}
//             <div className="absolute left-6 top-24 flex items-start gap-4">
//                 <img
//                     src={mentor.avatar}
//                     alt={mentor.full_name}
//                     className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white"
//                 />
//                 <div className="mt-8">
//                     <h2 className="text-xl font-bold text-white drop-shadow-lg">{mentor.full_name}</h2>
//                     <p className="text-white drop-shadow-lg font-medium text-sm">{mentor.role} tại {mentor.company}</p>
//                 </div>
//             </div>

//         </div>

//         {/* Content sections */}
//         <div className="p-6 space-y-6">
//             {/* Giới thiệu bản thân */}
//             {mentor.description && (
//                 <div>
//                     <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b-2 border-cyan-600 pb-1 inline-block">
//                         GIỚI THIỆU BẢN THÂN
//                     </h3>
//                     <p className="text-gray-700 text-sm leading-relaxed">{mentor.description}</p>
//                 </div>
//             )}

//             {/* Kinh nghiệm làm việc */}
//             {mentor.experience && mentor.experience.length > 0 && (
//                 <div>
//                     <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b-2 border-cyan-600 pb-1 inline-block">
//                         KINH NGHIỆM LÀM VIỆC
//                     </h3>
//                     <div className="space-y-3">
//                         {mentor.experience.map((exp, idx) => (
//                             <div key={idx} className="flex items-start gap-3">
//                                 <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
//                                     <div className="w-2 h-2 bg-white rounded-full"></div>
//                                 </div>
//                                 <div className="flex-1">
//                                     <div className="flex items-center justify-between">
//                                         <div>
//                                             <p className="font-semibold text-gray-900 text-sm">{exp.position}</p>
//                                             <p className="text-teal-700 text-sm">{exp.company}</p>
//                                         </div>
//                                         <span className="text-gray-500 text-xs">{exp.}</span>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             )}

//             {/* Quá trình học tập */}
//             {mentor.education && mentor.education.length > 0 && (
//                 <div>
//                     <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b-2 border-cyan-600 pb-1 inline-block">
//                         QUÁ TRÌNH HỌC TẬP
//                     </h3>
//                     <div className="space-y-3">
//                         {mentor.education.map((edu, idx) => (
//                             <div key={idx} className="flex items-start gap-3">
//                                 <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
//                                     <div className="w-2 h-2 bg-white rounded-full"></div>
//                                 </div>
//                                 <div className="flex-1">
//                                     <div className="flex items-center justify-between">
//                                         <div>
//                                             <p className="font-semibold text-gray-900 text-sm">{edu.school}</p>
//                                             <p className="text-gray-600 text-sm">{edu.degree}</p>
//                                         </div>
//                                         <span className="text-gray-500 text-xs">{edu.year}</span>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             )}

//             {/* Hoạt động ngoại khóa */}
//             {mentor.activities && mentor.activities.length > 0 && (
//                 <div>
//                     <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b-2 border-cyan-600 pb-1 inline-block">
//                         HOẠT ĐỘNG
//                     </h3>
//                     <div className="space-y-3">
//                         {mentor.activities.map((act, idx) => (
//                             <div key={idx} className="flex items-start gap-3">
//                                 <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
//                                     <div className="w-2 h-2 bg-white rounded-full"></div>
//                                 </div>
//                                 <div className="flex-1">
//                                     <div className="flex items-center justify-between">
//                                         <div>
//                                             <p className="font-semibold text-gray-900 text-sm">{act.title}</p>
//                                             <p className="text-gray-600 text-sm">{act.description}</p>
//                                         </div>
//                                         <span className="text-gray-500 text-xs">{act.year}</span>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             )}
//         </div>
//     </div>
// );
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
                    src={mentor.avatar}
                    alt={mentor.full_name}
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                />
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-white drop-shadow-lg">{mentor.full_name}</h2>
                    <p className="text-white drop-shadow-lg font-medium text-sm">{mentor.headline}</p>
                </div>
            </div>
        </div>

        {/* Content sections */}
        <div className="p-6 space-y-6">
            {/* Giới thiệu bản thân */}
            {mentor.description && (
                <div>
                    <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b-2 border-cyan-600 pb-1 inline-block">
                        GIỚI THIỆU BẢN THÂN
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{mentor.description}</p>
                </div>
            )}

            {/* Kỹ năng */}
            {mentor.skill && (
                <div>
                    <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b-2 border-cyan-600 pb-1 inline-block">
                        KỸ NĂNG
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {mentor.skill.map((skill, idx) => (
                            <span
                                key={idx}
                                className="bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full text-sm font-medium"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Kinh nghiệm làm việc */}
            {mentor.experience && mentor.experience.length > 0 && (
                <div>
                    <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b-2 border-cyan-600 pb-1 inline-block">
                        KINH NGHIỆM LÀM VIỆC
                    </h3>
                    <div className="space-y-3">
                        {mentor.experience.map((exp, idx) => (
                            <div key={exp.id || idx} className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{exp.position}</p>
                                            <p className="text-teal-700 text-sm">{exp.company}</p>
                                        </div>
                                        <span className="text-gray-500 text-xs">
                                            {exp.start_date} - {exp.end_date || 'Hiện tại'}
                                        </span>
                                    </div>
                                    {exp.description && (
                                        <p className="text-gray-600 text-xs mt-1">{exp.description}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quá trình học tập */}
            {mentor.education && mentor.education.length > 0 && (
                <div>
                    <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b-2 border-cyan-600 pb-1 inline-block">
                        QUÁ TRÌNH HỌC TẬP
                    </h3>
                    <div className="space-y-3">
                        {mentor.education.map((edu, idx) => (
                            <div key={edu.id || idx} className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{edu.school}</p>
                                            <p className="text-gray-600 text-sm">{edu.degree}</p>
                                        </div>
                                        <span className="text-gray-500 text-xs">
                                            {edu.start_date} - {edu.end_date || 'Hiện tại'}
                                        </span>
                                    </div>
                                    {edu.description && (
                                        <p className="text-gray-600 text-xs mt-1">{edu.description}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Hoạt động ngoại khóa */}
            {mentor.activities && mentor.activities.length > 0 && (
                <div>
                    <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b-2 border-cyan-600 pb-1 inline-block">
                        HOẠT ĐỘNG
                    </h3>
                    <div className="space-y-3">
                        {mentor.activities.map((act, idx) => (
                            <div key={act.id || idx} className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{act.activity_name}</p>
                                            <p className="text-gray-600 text-sm">{act.organization}</p>
                                            <p className="text-gray-600 text-xs">{act.role}</p>
                                        </div>
                                        <span className="text-gray-500 text-xs">
                                            {act.start_date} - {act.end_date || 'Hiện tại'}
                                        </span>
                                    </div>
                                    {act.description && (
                                        <p className="text-gray-600 text-xs mt-1">{act.description}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
);