'use client';
import React from 'react';
import Link from 'next/link';
import { Clock, Calendar } from 'lucide-react';

interface LastNews {
    title: string;
    date: {
        day: string;
        month: string;
        year?: string;
    };
    excerpt?: string;
    readTime?: number;
    views?: number;
    category?: string;
    href?: string;
}

interface LastNewsCardProps {
    article: LastNews;
}

export const LastNewsCard = ({ article }: LastNewsCardProps) => {
    const readTime = article.readTime || Math.ceil((article.excerpt?.length || 0) / 200) || 2;
    const views = article.views || Math.floor(Math.random() * 500) + 50;

    return (
        <div className="group">
            <Link href={article.href || '#'} className="block">
                <div className="flex gap-4 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200">
                    {/* Date Block */}
                    <div className="flex-shrink-0 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 text-center px-3 py-2 rounded-lg group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-200 shadow-sm">
                        <p className="text-lg font-bold text-blue-800 leading-none">
                            {article.date.day}
                        </p>
                        <p className="text-xs text-blue-600 uppercase font-medium">
                            {article.date.month}
                        </p>
                    </div>

                    {/* Article Content */}
                    <div className="flex-1 min-w-0">


                        {/* Title */}
                        <h4 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 mb-2 leading-tight">
                            {article.title}
                        </h4>

                        {/* Excerpt */}
                        {article.excerpt && (
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed">
                                {article.excerpt}
                            </p>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{article.date.year || '2024'}</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{readTime} phút đọc</span>
                            </div>

                        </div>

                        {/* Read More Link */}
                        <div className="mt-2">
                            <span className="text-xs text-blue-600 group-hover:text-blue-700 font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1">
                                Đọc thêm →
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
};