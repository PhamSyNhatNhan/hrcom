'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User, Clock, Bookmark, ChevronRight } from 'lucide-react';
import { Post, extractTextFromContent, getPostTypeLabel } from '@/lib/posts';

interface PostCardProps {
    post: Post;
    showAuthor?: boolean;
    showExcerpt?: boolean;
    showBookmark?: boolean;
    className?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
                                                      post,
                                                      showAuthor = true,
                                                      showExcerpt = true,
                                                      showBookmark = false,
                                                      className = ''
                                                  }) => {
    const excerpt = extractTextFromContent(post.content);

    const getReadingTime = (content: string): number => {
        const text = extractTextFromContent(content);
        const wordsPerMinute = 200;
        const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    };

    const readingTime = getReadingTime(post.content || '');

    return (
        <Link href={`/posts/${post.id}`}>
            <article className={`
                group bg-white rounded-2xl shadow-lg overflow-hidden 
                transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl
                border border-gray-100 hover:border-cyan-200 hover:bg-gradient-to-br hover:from-white hover:to-cyan-50/20
                aspect-square flex flex-col relative
                ${className}
            `}>
                {/* Background Image */}
                {post.thumbnail && (
                    <div className="absolute inset-0">
                        <Image
                            src={post.thumbnail}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
                    </div>
                )}

                {/* Fallback gradient if no image */}
                {!post.thumbnail && (
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600" />
                )}

                {/* Top Section - Type Badge & Reading Time */}
                <div className="relative z-10 p-5 flex justify-between items-start">
                    <span className={`
                        px-3 py-2 text-xs font-bold rounded-full backdrop-blur-md shadow-lg border
                        ${post.type === 'activity'
                        ? 'bg-emerald-500/90 text-white border-emerald-400/30'
                        : 'bg-blue-500/90 text-white border-blue-400/30'
                    }
                    `}>
                        {getPostTypeLabel(post.type)}
                    </span>

                    <div className="flex items-center gap-1 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                        <Clock className="w-3 h-3" />
                        {readingTime} phút
                    </div>
                </div>

                {/* Main Content - Bottom Section */}
                <div className="relative z-10 p-5 mt-auto">
                    {/* Date & Category Info */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1 text-xs text-white/90 font-medium">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.created_at).toLocaleDateString('vi-VN')}
                        </div>
                        {showBookmark && (
                            <button className="text-white/70 hover:text-yellow-400 transition-colors">
                                <Bookmark className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-cyan-300 transition-colors leading-tight">
                        {post.title}
                    </h3>

                    {/* Excerpt */}
                    {showExcerpt && excerpt && (
                        <p className="text-white/90 text-sm leading-relaxed line-clamp-2 mb-4">
                            {excerpt}
                        </p>
                    )}

                    {/* Author Section */}
                    {showAuthor && post.profiles && (
                        <div className="flex items-center justify-between pt-4 border-t border-white/20">
                            <div className="flex items-center gap-3">
                                {post.profiles.image_url ? (
                                    <Image
                                        src={post.profiles.image_url}
                                        alt={post.profiles.full_name}
                                        width={32}
                                        height={32}
                                        className="rounded-full object-cover ring-2 ring-white/40"
                                    />
                                ) : (
                                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-white/95">
                                        {post.profiles.full_name}
                                    </p>

                                </div>
                            </div>
                            {/*
                            <div className="flex items-center gap-2 text-xs text-white/80 group-hover:text-cyan-300 transition-colors font-medium">
                               <span>Đọc thêm</span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                            */}
                        </div>
                    )}
                </div>

                {/* Hover Overlay Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Corner Decoration */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </article>
        </Link>
    );
};