'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface NewsCardProps {
    image: string;
    title: string;
    excerpt: string;
    category: string;
    date: {
        day: string;
        month: string;
        year: string;
    };
    href?: string;
}

export const NewsCard = ({ image, title, excerpt, category, date, href }: NewsCardProps) => {
    const formattedDate = `${date.day} Tháng ${date.month}, ${date.year}`;

    return (
        <article className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl">
            {/* Featured Image */}
            <div className="relative overflow-hidden">
                <Image
                    src={image}
                    alt={title}
                    width={800}
                    height={400}
                    className="w-full h-64 md:h-80 object-cover transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Article Content */}
            <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {category}
                    </span>
                    <span className="text-gray-500 text-sm">{formattedDate}</span>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 line-clamp-2">
                    {title}
                </h2>

                <div className="prose max-w-none mb-6">
                    <p className="text-gray-700 leading-relaxed text-lg line-clamp-4">{excerpt}</p>
                </div>

                {href ? (
                    <Link href={href}>
                        <button
                            aria-label={`Đọc tiếp: ${title}`}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 group"
                        >
                            CONTINUE READING
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </Link>
                ) : (
                    <button
                        disabled
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-300 text-white font-medium rounded-lg cursor-not-allowed"
                    >
                        CONTINUE READING
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
            </div>
        </article>
    );
};
