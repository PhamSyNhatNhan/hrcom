'use client';
import React from 'react';
import Link from 'next/link';

interface LastNews {
    title: string;
    date: {
        day: string;
        month: string;
        year?: string;
    };
    commentsOff?: boolean;
    href?: string; // optional
}

interface LastNewsCardProps {
    article: LastNews;
}

export const LastNewsCard = ({ article }: LastNewsCardProps) => (
    <div className="group">
        <Link href={article.href || '#'} className="block">
            <div className="flex gap-4">
                {/* Date Block */}
                <div className="flex-shrink-0 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 text-center px-3 py-2 rounded-lg group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-200">
                    <p className="text-lg font-bold text-blue-800 leading-none">
                        {article.date.day}
                    </p>
                    <p className="text-xs text-blue-600 uppercase font-medium">
                        {article.date.month}
                    </p>
                </div>

                {/* Article Content */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200 line-clamp-3 mb-2">
                        {article.title}
                    </h4>
                    {article.commentsOff && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                            Comments Off
                        </p>
                    )}
                </div>
            </div>
        </Link>
    </div>
);