'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';

interface LastNews {
    title: string;
    date: {
        day: string;
        month: string;
        year?: string;
    };
    excerpt?: string;
    readTime?: number;
    category?: string;
    href?: string;
    image?: string;
}

interface LastNewsCardProps {
    article: LastNews;
}

export const LastNewsCard = ({ article }: LastNewsCardProps) => {
    const readTime = article.readTime || 2;

    return (
        <div className="group">
            <Link href={article.href || '#'} className="block">
                <div className="relative p-3 bg-white border border-gray-100 rounded-lg hover:border-cyan-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    <div className="flex gap-3">
                        {/* Image Thumbnail */}
                        <div className="flex-shrink-0 w-20 relative overflow-hidden rounded-lg bg-gray-50 flex">
                            <Image
                                src={article.image || '/images/default-blog.jpg'}
                                alt={article.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                        </div>


                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                            {/* Title */}
                            <h4 className="text-sm font-semibold text-gray-800 group-hover:text-cyan-700 transition-colors duration-200 line-clamp-2 leading-tight">
                                {article.title}
                            </h4>

                            {/* Excerpt */}
                            {article.excerpt && (
                                <p className="text-xs text-gray-600 line-clamp-1 leading-relaxed">
                                    {article.excerpt}
                                </p>
                            )}

                            {/* Bottom row with category and read time */}
                            <div className="flex items-center justify-between">
                                {/* Category */}
                                {article.category && (
                                    <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs font-medium rounded group-hover:bg-cyan-200 transition-colors duration-200">
                                        {article.category}
                                    </span>
                                )}

                                {/* Read time */}
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock className="w-3 h-3 text-cyan-500" />
                                    <span>{readTime} phút</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hover accent border */}
                    <div className="absolute inset-0 border border-transparent group-hover:border-cyan-300/50 rounded-lg transition-colors duration-200" />
                </div>
            </Link>
        </div>
    );
};