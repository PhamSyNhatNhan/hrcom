'use client';
import React, { useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import Image from 'next/image';

import {
    Search,
    Filter,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    Mail,
    Phone,
    Calendar,
    User,
    FileText,
    MessageSquare,
    RefreshCw
} from 'lucide-react';

interface MentorRegistration {
    id: string;
    user_id: string;
    email: string;
    phone?: string;
    notes?: string;
    admin_notes?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    profiles?: {
        full_name: string;
        image_url?: string;
    };
}

interface MentorRegistrationsTabProps {
    registrations: MentorRegistration[];
    setRegistrations: React.Dispatch<React.SetStateAction<MentorRegistration[]>>;
    loading: boolean;
    onReload: () => void;
    showNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
}

const MentorRegistrationsTab: React.FC<MentorRegistrationsTabProps> = ({
                                                                           registrations,
                                                                           setRegistrations,
                                                                           loading,
                                                                           onReload,
                                                                           showNotification
                                                                       }) => {
    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [expandedRegistration, setExpandedRegistration] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [adminNotes, setAdminNotes] = useState<{[key: string]: string}>({});

    // Filter registrations
    const filteredRegistrations = registrations.filter(registration => {
        const matchesSearch =
            registration.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            registration.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (registration.phone && registration.phone.includes(searchTerm));

        const matchesStatus = statusFilter === 'all' || registration.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Get status counts
    const statusCounts = {
        all: registrations.length,
        pending: registrations.filter(r => r.status === 'pending').length,
        approved: registrations.filter(r => r.status === 'approved').length,
        rejected: registrations.filter(r => r.status === 'rejected').length
    };

    // Update registration status and auto-create mentor profile if approved
    const updateRegistrationStatus = async (
        registrationId: string,
        newStatus: 'approved' | 'rejected',
        notes?: string
    ) => {
        try {
            setProcessingId(registrationId);

            const updateData: any = {
                status: newStatus,
                updated_at: new Date().toISOString()
            };

            if (notes) {
                updateData.admin_notes = notes;
            }

            // Update registration status
            const { error } = await supabase
                .from('mentor_registrations')
                .update(updateData)
                .eq('id', registrationId);

            if (error) throw error;

            // Update local state
            setRegistrations(prev =>
                prev.map(reg =>
                    reg.id === registrationId
                        ? { ...reg, status: newStatus, admin_notes: notes || reg.admin_notes }
                        : reg
                )
            );

            // Auto-create mentor profile if approved
            if (newStatus === 'approved') {
                const registration = registrations.find(r => r.id === registrationId);
                if (registration) {
                    await createMentorProfile(registration);
                }
            }

            // Clear admin notes input
            setAdminNotes(prev => ({ ...prev, [registrationId]: '' }));

            showNotification('success', `Đăng ký đã được ${newStatus === 'approved' ? 'phê duyệt' : 'từ chối'} thành công!${newStatus === 'approved' ? ' Hồ sơ mentor đã được tạo tự động.' : ''}`);

        } catch (error) {
            console.error('Error updating registration status:', error);
            showNotification('error', 'Lỗi khi cập nhật trạng thái đăng ký: ' + (error as Error).message);
        } finally {
            setProcessingId(null);
        }
    };

    // Create mentor profile for approved registration
    const createMentorProfile = async (registration: MentorRegistration) => {
        if (!registration.profiles) {
            console.error('Không tìm thấy thông tin profile của người dùng');
            return;
        }

        try {
            // Check if mentor profile already exists
            const { data: existingMentor, error: checkError } = await supabase
                .from('mentors')
                .select('id')
                .eq('email', registration.email)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existingMentor) {
                console.log('Mentor profile đã tồn tại cho email này');
                return;
            }

            // Create mentor profile
            const { data: newMentor, error: createError } = await supabase
                .from('mentors')
                .insert([{
                    email: registration.email,
                    full_name: registration.profiles.full_name,
                    avatar: registration.profiles.image_url || null,
                    phone_number: registration.phone || null,
                    headline: '',
                    description: '',
                    published: false
                }])
                .select('id')
                .single();

            if (createError) throw createError;

            // Create profile_mentor relation
            const { error: relationError } = await supabase
                .from('profile_mentor')
                .insert([{
                    profile_id: registration.user_id,
                    mentor_id: newMentor.id
                }]);

            if (relationError) throw relationError;

            // Update user role to mentor in auth.users metadata
            const { error: roleError } = await supabase.auth.admin.updateUserById(
                registration.user_id,
                {
                    user_metadata: { role: 'mentor' }
                }
            );

            // If admin API fails, try updating via profiles table or RPC
            if (roleError) {
                console.warn('Could not update user role via admin API, trying alternative method:', roleError);

                // Try updating via a custom RPC function (if available)
                try {
                    const { error: rpcError } = await supabase
                        .rpc('update_user_role', {
                            target_user_id: registration.user_id,
                            new_role: 'mentor'
                        });

                    if (rpcError) {
                        console.warn('RPC update also failed:', rpcError);
                    }
                } catch (rpcErr) {
                    console.warn('RPC function not available or failed:', rpcErr);
                }
            }

            console.log('Mentor profile và liên kết đã được tạo thành công!');

        } catch (error) {
            console.error('Error creating mentor profile:', error);
            showNotification('error', 'Lỗi khi tạo mentor profile: ' + (error as Error).message);
        }
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Chờ duyệt
                    </span>
                );
            case 'approved':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Đã duyệt
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Từ chối
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Đăng ký trở thành Mentor</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Xem xét và phê duyệt các đăng ký mentor từ người dùng
                    </p>
                </div>
                <button
                    onClick={onReload}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <FileText className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Tổng đăng ký</p>
                            <p className="text-lg font-semibold text-gray-900">{statusCounts.all}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Clock className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Chờ duyệt</p>
                            <p className="text-lg font-semibold text-yellow-600">{statusCounts.pending}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CheckCircle className="h-6 w-6 text-green-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Đã duyệt</p>
                            <p className="text-lg font-semibold text-green-600">{statusCounts.approved}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <XCircle className="h-6 w-6 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Từ chối</p>
                            <p className="text-lg font-semibold text-red-600">{statusCounts.rejected}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, email, SĐT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="pending">Chờ duyệt</option>
                            <option value="approved">Đã duyệt</option>
                            <option value="rejected">Từ chối</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Registrations List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Đang tải...</p>
                    </div>
                ) : filteredRegistrations.length === 0 ? (
                    <div className="p-8 text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                            {searchTerm || statusFilter !== 'all' ? 'Không có đăng ký nào phù hợp' : 'Chưa có đăng ký nào'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredRegistrations.map((registration) => (
                            <div key={registration.id} className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            {registration.profiles?.image_url ? (
                                                <Image
                                                    src={registration.profiles.image_url}
                                                    alt={registration.profiles?.full_name || 'User'}
                                                    width={48}
                                                    height={48}
                                                    className="rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                    <User className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>

                                        {/* User Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {registration.profiles?.full_name || 'Chưa có tên'}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                                        <div className="flex items-center gap-1">
                                                            <Mail className="w-4 h-4" />
                                                            <span>{registration.email}</span>
                                                        </div>
                                                        {registration.phone && (
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="w-4 h-4" />
                                                                <span>{registration.phone}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>{new Date(registration.created_at).toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {getStatusBadge(registration.status)}
                                            </div>

                                            {/* Registration Notes Preview */}
                                            {registration.notes && (
                                                <div className="bg-gray-50 rounded-lg p-3 mt-2">
                                                    <p className="text-sm text-gray-700 line-clamp-3">
                                                        {registration.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => setExpandedRegistration(
                                                expandedRegistration === registration.id ? null : registration.id
                                            )}
                                            className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>

                                        {/* Quick Actions for Pending */}
                                        {registration.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => updateRegistrationStatus(registration.id, 'approved')}
                                                    disabled={processingId === registration.id}
                                                    className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 disabled:opacity-50"
                                                    title="Phê duyệt và tự động tạo mentor"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => updateRegistrationStatus(registration.id, 'rejected')}
                                                    disabled={processingId === registration.id}
                                                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                                                    title="Từ chối đăng ký"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedRegistration === registration.id && (
                                    <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
                                        {/* Full Registration Notes */}
                                        {registration.notes && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                    <FileText className="w-4 h-4" />
                                                    Thông tin chia sẻ từ người đăng ký:
                                                </h4>
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                        {registration.notes}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Admin Notes Section */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4" />
                                                Ghi chú admin:
                                            </h4>

                                            {registration.admin_notes && (
                                                <div className="bg-blue-50 rounded-lg p-4 mb-3">
                                                    <p className="text-sm text-blue-900">
                                                        {registration.admin_notes}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <textarea
                                                    placeholder="Thêm ghi chú admin (tùy chọn)..."
                                                    value={adminNotes[registration.id] || ''}
                                                    onChange={(e) => setAdminNotes(prev => ({
                                                        ...prev,
                                                        [registration.id]: e.target.value
                                                    }))}
                                                    rows={3}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {registration.status === 'pending' && (
                                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                                <button
                                                    onClick={() => updateRegistrationStatus(
                                                        registration.id,
                                                        'approved',
                                                        adminNotes[registration.id]
                                                    )}
                                                    disabled={processingId === registration.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {processingId === registration.id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4" />
                                                    )}
                                                    Phê duyệt & Tạo Mentor
                                                </button>

                                                <button
                                                    onClick={() => updateRegistrationStatus(
                                                        registration.id,
                                                        'rejected',
                                                        adminNotes[registration.id]
                                                    )}
                                                    disabled={processingId === registration.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {processingId === registration.id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    ) : (
                                                        <XCircle className="w-4 h-4" />
                                                    )}
                                                    Từ chối
                                                </button>
                                            </div>
                                        )}

                                        {/* Approved Status Display */}
                                        {registration.status === 'approved' && (
                                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                    <span className="text-sm font-medium text-green-800">Đã phê duyệt</span>
                                                </div>
                                                <p className="text-sm text-green-700">
                                                    Hồ sơ mentor và liên kết đã được tạo tự động. User này đã được cấp quyền mentor.
                                                </p>
                                                {registration.admin_notes && (
                                                    <div className="mt-2 p-2 bg-white rounded border">
                                                        <p className="text-sm text-green-800">
                                                            <strong>Ghi chú admin:</strong> {registration.admin_notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Rejected Status Display */}
                                        {registration.status === 'rejected' && registration.admin_notes && (
                                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-sm text-red-800">
                                                    <strong>Lý do từ chối:</strong> {registration.admin_notes}
                                                </p>
                                            </div>
                                        )}

                                        {/* Metadata */}
                                        <div className="text-xs text-gray-500 pt-4 border-t border-gray-100">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <div>
                                                    <strong>Đăng ký lúc:</strong> {new Date(registration.created_at).toLocaleString('vi-VN')}
                                                </div>
                                                <div>
                                                    <strong>Cập nhật cuối:</strong> {new Date(registration.updated_at).toLocaleString('vi-VN')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">ℹ</span>
                        </div>
                    </div>
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Hướng dẫn xử lý đăng ký:</p>
                        <ul className="space-y-1 text-xs">
                            <li>• <strong>Phê duyệt:</strong> Tự động tạo hồ sơ mentor, liên kết profile và cấp quyền mentor</li>
                            <li>• <strong>Từ chối:</strong> Không chấp nhận đăng ký (người dùng có thể đăng ký lại)</li>
                            <li>• <strong>Quick Actions:</strong> Click biểu tượng ✓ hoặc ✕ để xử lý nhanh</li>
                            <li>• <strong>Ghi chú admin:</strong> Thêm lý do hoặc feedback cho quyết định của bạn</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentorRegistrationsTab;