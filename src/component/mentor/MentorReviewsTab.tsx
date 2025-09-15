'use client';
import React from 'react';
import Image from 'next/image';
import {
    Star,
    MessageSquare,
    Users
} from 'lucide-react';

interface MentorReview {
    id: string;
    rating: number;
    comment?: string;
    is_published: boolean;
    created_at: string;
    profiles?: {
        full_name: string;
        image_url?: string;
    };
}

interface MentorReviewsTabProps {
    reviews: MentorReview[];
    average_rating?: number;
    total_reviews?: number;
}

const MentorReviewsTab: React.FC<MentorReviewsTabProps> = ({
                                                               reviews,
                                                               average_rating,
                                                               total_reviews
                                                           }) => {
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${
                    i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
            />
        ));
    };

    if (!reviews || reviews.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Chưa có đánh giá nào
                </h3>
                <p className="text-gray-600">
                    Hãy là người đầu tiên đánh giá mentor này sau khi tham gia buổi tư vấn.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overview Stats */}
            {(average_rating || total_reviews) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Tổng quan đánh giá
                            </h3>
                            <div className="flex items-center space-x-4">
                                {average_rating && average_rating > 0 && (
                                    <div className="flex items-center space-x-2">
                                        <div className="flex">
                                            {renderStars(Math.round(average_rating))}
                                        </div>
                                        <span className="text-2xl font-bold text-gray-900">
                                            {average_rating.toFixed(1)}
                                        </span>
                                    </div>
                                )}
                                {total_reviews && total_reviews > 0 && (
                                    <div className="text-gray-600">
                                        dựa trên {total_reviews} đánh giá
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Star className="w-8 h-8 text-yellow-600 fill-current" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                                {review.profiles?.image_url ? (
                                    <Image
                                        src={review.profiles.image_url}
                                        alt={review.profiles.full_name}
                                        width={48}
                                        height={48}
                                        className="rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-white font-semibold text-lg">
                                            {review.profiles?.full_name?.charAt(0) || 'A'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-gray-900">
                                        {review.profiles?.full_name || 'Ẩn danh'}
                                    </h4>
                                    <span className="text-sm text-gray-500">
                                        {formatDate(review.created_at)}
                                    </span>
                                </div>

                                <div className="flex items-center space-x-1 mb-3">
                                    {renderStars(review.rating)}
                                    <span className="text-sm text-gray-600 ml-2">
                                        ({review.rating}/5)
                                    </span>
                                </div>

                                {review.comment && (
                                    <blockquote className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border-l-4 border-cyan-500">
                                        "{review.comment}"
                                    </blockquote>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Load More (if needed) */}
            {total_reviews && total_reviews > reviews.length && (
                <div className="text-center py-4">
                    <p className="text-gray-500">
                        Hiển thị {reviews.length} trên {total_reviews} đánh giá
                    </p>
                </div>
            )}
        </div>
    );
};

export default MentorReviewsTab;