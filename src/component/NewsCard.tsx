'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight, FileImage } from 'lucide-react';

interface NewsCardProps {
    image?: string;
    title: string;
    excerpt: string;
    category: string;
    date: {
        day: string;
        month: string;
        year: string;
    };
    href?: string;
    readTime?: number;
}

export const NewsCard = ({ image, title, excerpt, category, date, href, readTime = 2 }: NewsCardProps) => {
    const formattedDate = `${date.day} Tháng ${date.month}, ${date.year}`;

    return (
        <article className="group bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-gray-100 hover:border-cyan-200">
            {/* Featured Image or Placeholder - Increased height */}
            <div className="relative overflow-hidden h-60 md:h-72">
                {image ? (
                    <>
                        <Image
                            src={image}
                            alt={title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            quality={85}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                        {/* Category badge on image */}
                        <div className="absolute top-4 left-4">
                            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-cyan-700 text-sm font-semibold rounded-full shadow-lg">
                                {category}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-center text-gray-400">
                            <FileImage className="w-16 h-16 mx-auto mb-3 opacity-40" />
                            <p className="text-sm font-medium">Không có ảnh</p>
                        </div>

                        {/* Category badge for no-image case */}
                        <div className="absolute top-4 left-4">
                            <span className="px-3 py-1.5 bg-cyan-100 text-cyan-700 text-sm font-semibold rounded-full shadow-sm">
                                {category}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Article Content - Reduced padding to maintain card size */}
            <div className="p-6">
                {/* Meta info - Always show read time */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-cyan-500" />
                        <span className="text-sm text-gray-500 font-medium">{formattedDate}</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-500" />
                        <span className="text-sm text-gray-500 font-medium">{readTime} phút đọc</span>
                    </div>
                </div>

                {/* Title - Back to original size */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 line-clamp-2 leading-tight group-hover:text-cyan-700 transition-colors duration-200">
                    {title}
                </h2>

                {/* Excerpt - Back to original */}
                <div className="prose max-w-none mb-6">
                    <p className="text-gray-700 leading-relaxed text-lg line-clamp-1">{excerpt}</p>
                </div>

                {/* Read more button - Original style */}
                {href ? (
                    <Link href={href}>
                        <button
                            aria-label={`Đọc tiếp: ${title}`}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg group"
                        >
                            Đọc tiếp
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    </Link>
                ) : (
                    <button
                        disabled
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-500 font-medium rounded-lg cursor-not-allowed opacity-60"
                    >
                        Không khả dụng
                        <ArrowRight className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Bottom accent line */}
            <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
        </article>
    );
};