'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export interface Activity {
    href: string;
    imageSrc: string;
    imageAlt: string;
    title: string;
    description: string;
}

interface ActivityCardProps {
    activity: Activity;
}

export const ActivityCard = ({ activity }: ActivityCardProps) => (
    <Link href={activity.href}>
        <div className="block group cursor-pointer">
            <div className="relative h-72 sm:h-80 md:h-96 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">

                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={activity.imageSrc}
                        alt={activity.imageAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Blur Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-[45%] sm:h-[40%] z-10 pointer-events-none">
                    <div className="absolute -inset-px bg-gradient-to-t from-white/95 via-white/60 to-transparent rounded-b-xl" />
                    <div className="absolute -inset-px backdrop-blur-sm rounded-b-xl" />
                </div>

                {/* Text content */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6 flex flex-col justify-end">
                    <div className="h-15 sm:h-14 flex items-start pt-3 sm:pt-3">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight line-clamp-2 mt-1 sm:mt-0">
                            {activity.title}
                        </h3>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 mt-2 sm:mt-4 leading-snug line-clamp-3">{activity.description}</p>
                </div>

            </div>
        </div>
    </Link>
);