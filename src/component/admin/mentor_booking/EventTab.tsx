// src/component/admin/mentor_booking/EventTab.tsx
'use client';

import React from 'react';
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
    MessageSquare,
    MapPinned,
    Users,
    Key
} from 'lucide-react';
import { EventRegistrationWithDetails, EventStatus } from '@/types/mentor_booking_admin';

interface EventTabProps {
    registrations: EventRegistrationWithDetails[];
    loading: boolean;
    submitting: boolean;
    expandedItem: string | null;
    onToggleExpand: (id: string) => void;
    onEdit: (registration: EventRegistrationWithDetails) => void;
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, status: EventStatus, notes?: string) => void;
    onCheckIn: (registrationId: string) => void;
}

export const EventTab: React.FC<EventTabProps> = ({
                                                      registrations,
                                                      loading,
                                                      submitting,
                                                      expandedItem,
                                                      onToggleExpand,
                                                      onEdit,
                                                      onDelete,
                                                      onUpdateStatus,
                                                      onCheckIn,
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

    // Get event type icon
    const getEventTypeIcon = (type: string) => {
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

    if (registrations.length === 0) {
        return (
            <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Không có đăng ký sự kiện nào
                </h3>
                <p className="text-gray-600">
                    Chưa có đăng ký sự kiện nào trong hệ thống.
                </p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-200">
            {registrations.map((registration) => (
                <div key={registration.id} className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            {/* Header with User Info and Status */}
                            <div className="flex items-center gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                    {registration.profiles?.image_url ? (
                                        <Image
                                            src={registration.profiles.image_url}
                                            alt={registration.profiles.full_name}
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
                                            {registration.profiles?.full_name || 'Người dùng ẩn danh'}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            Sự kiện: {registration.events?.title || 'Chưa xác định'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(registration.status)}`}>
                    {getStatusIcon(registration.status)}
                      {registration.status === 'pending' && 'Chờ xác nhận'}
                      {registration.status === 'confirmed' && 'Đã xác nhận'}
                      {registration.status === 'completed' && 'Hoàn thành'}
                      {registration.status === 'cancelled' && 'Đã hủy'}
                  </span>
                                    {registration.event_attendances && (
                                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Đã check-in
                    </span>
                                    )}
                                </div>
                            </div>

                            {/* Event Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="truncate">{registration.contact_email}</span>
                                </div>
                                {registration.contact_phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span>{registration.contact_phone}</span>
                                    </div>
                                )}
                                {registration.events?.event_type && (
                                    <div className="flex items-center gap-2">
                                        {getEventTypeIcon(registration.events.event_type)}
                                        <span className="capitalize">{registration.events.event_type}</span>
                                    </div>
                                )}
                            </div>

                            {/* Event Date */}
                            {registration.events?.event_date && (
                                <div className="flex items-center gap-2 text-sm mb-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <span className="text-blue-600">
                    <strong>Ngày sự kiện:</strong> {new Date(registration.events.event_date).toLocaleString('vi-VN')}
                  </span>
                                </div>
                            )}

                            {/* Event Location */}
                            {registration.events?.location && (
                                <div className="flex items-center gap-2 text-sm mb-2">
                                    <MapPinned className="w-4 h-4 text-gray-600" />
                                    <span><strong>Địa điểm:</strong> {registration.events.location}</span>
                                </div>
                            )}

                            {/* Registration Date */}
                            <div className="text-sm mb-2">
                                <strong>Ngày đăng ký:</strong> {new Date(registration.registered_at).toLocaleString('vi-VN')}
                            </div>

                            {/* Admin Notes */}
                            {registration.admin_notes && (
                                <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg mb-2">
                                    <strong>Ghi chú admin:</strong> {registration.admin_notes}
                                </div>
                            )}

                            {/* Check-in Information */}
                            {registration.event_attendances && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle className="w-5 h-5 text-purple-600" />
                                        <h5 className="font-semibold text-gray-900">Thông tin check-in</h5>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                                        <div>
                                            <strong>Thời gian check-in:</strong>{' '}
                                            {new Date(registration.event_attendances.checked_in_at).toLocaleString('vi-VN')}
                                        </div>
                                        <div>
                                            <strong>Phương thức:</strong>{' '}
                                            <span className="capitalize">{registration.event_attendances.check_in_method}</span>
                                        </div>
                                    </div>

                                    {registration.event_attendances.notes && (
                                        <div className="text-sm bg-purple-50 p-3 rounded-lg">
                                            <strong>Ghi chú check-in:</strong> {registration.event_attendances.notes}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Review Section - Show if attended and has review */}
                            {registration.event_attendances && registration.event_reviews && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MessageSquare className="w-5 h-5 text-blue-600" />
                                        <h5 className="font-semibold text-gray-900">Đánh giá từ người dùng</h5>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            registration.event_reviews.is_published
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                      {registration.event_reviews.is_published ? 'Công khai' : 'Riêng tư'}
                    </span>
                                    </div>

                                    {/* Rating Stars */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex items-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-4 h-4 ${
                                                        star <= registration.event_reviews!.rating
                                                            ? 'text-yellow-400 fill-current'
                                                            : 'text-gray-300'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-600">
                      ({registration.event_reviews.rating}/5 sao)
                    </span>
                                    </div>

                                    {/* Review Comment */}
                                    {registration.event_reviews.comment && (
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-700">{registration.event_reviews.comment}</p>
                                        </div>
                                    )}

                                    {/* Review Date */}
                                    <div className="text-xs text-gray-500 mt-2">
                                        Đánh giá lúc: {new Date(registration.event_reviews.created_at).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 ml-4">
                            <button
                                onClick={() => onToggleExpand(registration.id)}
                                className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50"
                                title="Xem chi tiết"
                            >
                                {expandedItem === registration.id ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </button>

                            <button
                                onClick={() => onEdit(registration)}
                                className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                                title="Chỉnh sửa"
                                disabled={submitting}
                            >
                                <Edit className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => onDelete(registration.id)}
                                className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                                title="Xóa"
                                disabled={submitting}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    {expandedItem === registration.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-wrap gap-2">
                                {/* Status Actions */}
                                {registration.status === 'pending' && (
                                    <button
                                        onClick={() => onUpdateStatus(registration.id, 'confirmed')}
                                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                        disabled={submitting}
                                    >
                                        Xác nhận
                                    </button>
                                )}

                                {/* Check-in Action */}
                                {registration.status === 'confirmed' && !registration.event_attendances && (
                                    <button
                                        onClick={() => onCheckIn(registration.id)}
                                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-1"
                                        disabled={submitting}
                                    >
                                        <Key className="w-4 h-4" />
                                        Check-in thủ công
                                    </button>
                                )}

                                {(registration.status === 'pending' || registration.status === 'confirmed') && (
                                    <button
                                        onClick={() => {
                                            const reason = prompt('Lý do hủy:');
                                            if (reason !== null) {
                                                onUpdateStatus(registration.id, 'cancelled', reason);
                                            }
                                        }}
                                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                                        disabled={submitting}
                                    >
                                        Hủy đăng ký
                                    </button>
                                )}

                                {registration.status === 'cancelled' && (
                                    <button
                                        onClick={() => onUpdateStatus(registration.id, 'pending')}
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