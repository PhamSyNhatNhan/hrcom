// src/component/admin/mentor_booking/BookingTab.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
    Edit,
    Trash2,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    XCircle,
    Clock,
    Mail,
    Phone,
    Calendar,
    User,
    Video,
    Coffee,
    MapPin,
    Star,
    AlertCircle,
    MessageSquare
} from 'lucide-react';
import { BookingWithReview, BookingStatus } from '@/types/mentor_booking_admin';

interface BookingTabProps {
    bookings: BookingWithReview[];
    loading: boolean;
    submitting: boolean;
    expandedItem: string | null;
    onToggleExpand: (id: string) => void;
    onEdit: (booking: BookingWithReview) => void;
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, status: BookingStatus, notes?: string) => void;
}

export const BookingTab: React.FC<BookingTabProps> = ({
                                                          bookings,
                                                          loading,
                                                          submitting,
                                                          expandedItem,
                                                          onToggleExpand,
                                                          onEdit,
                                                          onDelete,
                                                          onUpdateStatus,
                                                      }) => {
    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'confirmed': return <CheckCircle className="w-4 h-4" />;
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    // Get session type icon
    const getSessionTypeIcon = (type: string) => {
        switch (type) {
            case 'online': return <Video className="w-4 h-4" />;
            case 'offline': return <Coffee className="w-4 h-4" />;
            case 'hybrid': return <MapPin className="w-4 h-4" />;
            default: return <Video className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Không có booking nào
                </h3>
                <p className="text-gray-600">
                    Chưa có booking mentor nào trong hệ thống.
                </p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-200">
            {bookings.map((booking) => (
                <div key={booking.id} className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            {/* Header with User Info and Status */}
                            <div className="flex items-center gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                    {booking.profiles?.image_url ? (
                                        <Image
                                            src={booking.profiles.image_url}
                                            alt={booking.profiles.full_name}
                                            width={40}
                                            height={40}
                                            className="rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900">
                                            {booking.profiles?.full_name || 'Người dùng ẩn danh'}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            Mentor: {booking.mentors?.full_name || 'Chưa xác định'}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                  {getStatusIcon(booking.status)}
                                    {booking.status === 'pending' && 'Chờ xác nhận'}
                                    {booking.status === 'confirmed' && 'Đã xác nhận'}
                                    {booking.status === 'completed' && 'Hoàn thành'}
                                    {booking.status === 'cancelled' && 'Đã hủy'}
                </span>
                            </div>

                            {/* Booking Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="truncate">{booking.contact_email}</span>
                                </div>
                                {booking.contact_phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span>{booking.contact_phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span>{booking.duration} phút</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getSessionTypeIcon(booking.session_type)}
                                    <span className="capitalize">{booking.session_type}</span>
                                </div>
                            </div>

                            {/* Scheduled Date */}
                            {booking.scheduled_date && (
                                <div className="flex items-center gap-2 text-sm mb-2">
                                    <Calendar className="w-4 h-4 text-green-600" />
                                    <span className="text-green-600">
                    <strong>Lịch hẹn:</strong> {new Date(booking.scheduled_date).toLocaleString('vi-VN')}
                  </span>
                                </div>
                            )}

                            {/* Created Date */}
                            <div className="text-sm mb-2">
                                <strong>Ngày tạo:</strong> {new Date(booking.created_at).toLocaleString('vi-VN')}
                            </div>

                            {/* Notes */}
                            {booking.user_notes && (
                                <div className="text-sm text-gray-600 mb-2">
                                    <strong>Ghi chú từ user:</strong> {booking.user_notes}
                                </div>
                            )}

                            {booking.mentor_notes && (
                                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg mb-2">
                                    <strong>Phản hồi từ mentor:</strong> {booking.mentor_notes}
                                </div>
                            )}

                            {booking.admin_notes && (
                                <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg mb-2">
                                    <strong>Ghi chú admin:</strong> {booking.admin_notes}
                                </div>
                            )}

                            {/* Review Section - Show if booking is completed and has review */}
                            {booking.status === 'completed' && booking.mentor_reviews && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MessageSquare className="w-5 h-5 text-blue-600" />
                                        <h5 className="font-semibold text-gray-900">Đánh giá từ người dùng</h5>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            booking.mentor_reviews.is_published
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                      {booking.mentor_reviews.is_published ? 'Công khai' : 'Riêng tư'}
                    </span>
                                    </div>

                                    {/* Rating Stars */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex items-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-4 h-4 ${
                                                        star <= booking.mentor_reviews!.rating
                                                            ? 'text-yellow-400 fill-current'
                                                            : 'text-gray-300'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-600">
                      ({booking.mentor_reviews.rating}/5 sao)
                    </span>
                                    </div>

                                    {/* Review Comment */}
                                    {booking.mentor_reviews.comment && (
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-700">{booking.mentor_reviews.comment}</p>
                                        </div>
                                    )}

                                    {/* Review Date */}
                                    <div className="text-xs text-gray-500 mt-2">
                                        Đánh giá lúc: {new Date(booking.mentor_reviews.created_at).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 ml-4">
                            <button
                                onClick={() => onToggleExpand(booking.id)}
                                className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50"
                                title="Xem chi tiết"
                            >
                                {expandedItem === booking.id ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </button>

                            <button
                                onClick={() => onEdit(booking)}
                                className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                                title="Chỉnh sửa"
                                disabled={submitting}
                            >
                                <Edit className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => onDelete(booking.id)}
                                className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                                title="Xóa"
                                disabled={submitting}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Quick Status Actions */}
                    {expandedItem === booking.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-wrap gap-2">
                                {booking.status === 'pending' && (
                                    <button
                                        onClick={() => onUpdateStatus(booking.id, 'confirmed')}
                                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                        disabled={submitting}
                                    >
                                        Xác nhận
                                    </button>
                                )}

                                {booking.status === 'confirmed' && (
                                    <button
                                        onClick={() => onUpdateStatus(booking.id, 'completed')}
                                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                        disabled={submitting}
                                    >
                                        Hoàn thành
                                    </button>
                                )}

                                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                    <button
                                        onClick={() => {
                                            const reason = prompt('Lý do hủy:');
                                            if (reason !== null) {
                                                onUpdateStatus(booking.id, 'cancelled', reason);
                                            }
                                        }}
                                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                                        disabled={submitting}
                                    >
                                        Hủy
                                    </button>
                                )}

                                {(booking.status === 'cancelled' || booking.status === 'completed') && (
                                    <button
                                        onClick={() => onUpdateStatus(booking.id, 'pending')}
                                        className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
                                        disabled={submitting}
                                    >
                                        Đặt lại chờ xác nhận
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};