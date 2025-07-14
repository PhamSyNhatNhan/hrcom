'use client'
import React from 'react';
import { Star } from 'lucide-react';

interface Mentor {
    id: number;
    name: string;
    role: string;
    company: string;
    rating: number;
    sessions: number;
    price: string;
    image: string;
    specialties: string[];
}

interface MentorCardProps {
    mentor: Mentor;
}

export const MentorCard = ({ mentor }: MentorCardProps) => (
    <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100 hover:border-cyan-200 hover:scale-105 transform">
        <div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
                <img
                    src={mentor.image}
                    alt={mentor.name}
                    className="w-16 h-16 rounded-xl object-cover ring-4 ring-cyan-100"
                />
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{mentor.name}</h3>
                    <p className="text-cyan-600 font-medium">{mentor.role}</p>
                    <p className="text-gray-500 text-sm">{mentor.company}</p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="font-bold text-gray-900">{mentor.rating}</span>
                    <span className="text-gray-500">({mentor.sessions} sessions)</span>
                </div>
                <div className="text-cyan-600 font-bold text-lg">{mentor.price}/h</div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {mentor.specialties.map((specialty, index) => (
                    <span
                        key={index}
                        className="bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
            {specialty}
          </span>
                ))}
            </div>

            <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 font-medium group-hover:shadow-lg">
                Xem Hồ Sơ
            </button>
        </div>
    </div>
);