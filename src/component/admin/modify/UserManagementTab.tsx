'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import {
    Search,
    ShieldCheck,
    ShieldX,
    User,
    Crown,
    Mail,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Users,
    RefreshCw,
    Phone
} from 'lucide-react';
import Image from 'next/image';

interface UserProfile {
    id: string;
    full_name: string;
    image_url?: string;
    phone_number?: string;
    created_at: string;
    updated_at: string;
    role?: 'user' | 'admin' | 'superadmin';
    email?: string;
}

interface UserManagementTabProps {
    showNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
}

// Helper functions
function getErrorMessage(err: unknown): string {
    if (!err) return 'Unknown error';
    if (err instanceof Error) return err.message;

    // Supabase PostgrestError thường có thuộc tính không enumerable
    try {
        const msg =
            // @ts-ignore
            err?.message ||
            // @ts-ignore
            err?.error_description ||
            // @ts-ignore
            err?.hint ||
            // stringify toàn bộ props (kể cả non-enumerable)
            JSON.stringify(err, Object.getOwnPropertyNames(err));
        return typeof msg === 'string' ? msg : JSON.stringify(msg);
    } catch {
        try {
            return JSON.stringify(err);
        } catch {
            return String(err);
        }
    }
}


const UserManagementTab: React.FC<UserManagementTabProps> = ({ showNotification }) => {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin' | 'superadmin'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmAction, setConfirmAction] = useState<{
        userId: string;
        action: 'promote' | 'demote';
        userEmail: string;
    } | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const pageSize = 20;
    const totalPages = Math.ceil(filteredUsers.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

    // Load users - Sử dụng RPC function
    const loadUsers = async () => {
        try {
            setLoading(true);
            console.log('Loading users via RPC function (admin_get_users_with_roles)...');

            // Quan trọng: dùng throwOnError để không bị {} mơ hồ
            const { data } = await supabase
                .rpc('admin_get_users_with_roles')
                .throwOnError();

            if (!data || data.length === 0) {
                setUsers([]);
                setFilteredUsers([]);
                return;
            }

            const processedUsers = (data as any[]).map((u) => ({
                id: u.id, // RPC đã SELECT au.id AS id
                full_name: u.full_name ?? 'Chưa cập nhật tên',
                image_url: u.image_url ?? undefined,
                phone_number: u.phone_number ?? undefined,
                created_at: u.created_at,
                updated_at: u.updated_at ?? u.created_at,
                role: (u.role as 'user' | 'admin' | 'superadmin') ?? 'user',
                email: u.email ?? '',
            }));

            const sortedUsers = processedUsers.sort((a: any, b: any) => {
                const order: Record<string, number> = { superadmin: 0, admin: 1, user: 2 };
                const ao = order[a.role] ?? 3;
                const bo = order[b.role] ?? 3;
                return ao !== bo
                    ? ao - bo
                    : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            setUsers(sortedUsers);
            setFilteredUsers(sortedUsers);
            console.log(`Successfully loaded ${sortedUsers.length} users`);
        } catch (err) {
            // In ra toàn bộ object lỗi để dễ debug
            console.error('Error loading users (raw):', err);
            showNotification('error', 'Không thể tải danh sách người dùng: ' + getErrorMessage(err));
            setUsers([]);
            setFilteredUsers([]);
        } finally {
            setLoading(false);
        }
    };



    // Filter users
    useEffect(() => {
        let filtered = users;

        // Filter by search term
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(user => {
                const emailMatch = user.email?.toLowerCase().includes(searchLower);
                const nameMatch = user.full_name?.toLowerCase().includes(searchLower);
                const phoneMatch = user.phone_number?.includes(searchTerm);
                return emailMatch || nameMatch || phoneMatch;
            });
        }

        // Filter by role
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        setFilteredUsers(filtered);
        setCurrentPage(1);
    }, [users, searchTerm, roleFilter]);

    // CHANGED
    const promoteToAdmin = async (userId: string) => {
        try {
            setActionLoading(userId);
            console.log('Promoting user to admin:', userId);

            // ✅ Đổi sang RPC đúng
            const { data, error } = await supabase.rpc('admin_update_user_role', {
                target_user_id: userId,
                new_role: 'admin',
            });

            console.log('Update RPC Response:', { data, error });

            if (error) throw new Error(error.message);
            if (!data?.success) throw new Error(data?.error || 'Failed to update role');

            // Update local state
            setUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, role: 'admin' as const } : user
            ));

            showNotification('success', 'Đã nâng cấp người dùng thành Admin');
        } catch (error) {
            console.error('Error promoting user:', error);
            showNotification('error', getErrorMessage(error));
        } finally {
            setActionLoading(null);
            setConfirmAction(null);
        }
    };


    // Demote user to user - Sử dụng RPC function
    // CHANGED
    const demoteToUser = async (userId: string) => {
        try {
            setActionLoading(userId);
            console.log('Demoting user to user:', userId);

            // ✅ Đổi sang RPC đúng
            const { data, error } = await supabase.rpc('admin_update_user_role', {
                target_user_id: userId,
                new_role: 'user',
            });

            console.log('Update RPC Response:', { data, error });

            if (error) throw new Error(error.message);
            if (!data?.success) throw new Error(data?.error || 'Failed to update role');

            // Update local state
            setUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, role: 'user' as const } : user
            ));

            showNotification('success', 'Đã hạ cấp Admin về User');
        } catch (error) {
            console.error('Error demoting user:', error);
            showNotification('error', getErrorMessage(error));
        } finally {
            setActionLoading(null);
            setConfirmAction(null);
        }
    };


    // Get role badge
    const getRoleBadge = (role?: string) => {
        switch (role) {
            case 'superadmin':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        <Crown className="w-3 h-3 mr-1" />
                        Super Admin
                    </span>
                );
            case 'admin':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Admin
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        <User className="w-3 h-3 mr-1" />
                        User
                    </span>
                );
        }
    };

    // Can perform actions
    const canPromote = (user: UserProfile) => user.role === 'user';
    const canDemote = (user: UserProfile) => user.role === 'admin' && user.id !== currentUser?.id;

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    if (loading) {
        return (
            <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Đang tải danh sách người dùng...</p>
            </div>
        );
    }

    return (
        <>
            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo email, tên hoặc SĐT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Role Filter */}
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tất cả quyền hạn</option>
                        <option value="superadmin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                    </select>

                    {/* Refresh Button */}
                    <button
                        onClick={loadUsers}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>

                    {/* Stats */}
                    <div className="text-sm text-gray-600">
                        Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} / {filteredUsers.length} người dùng
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Người dùng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quyền hạn
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ngày tham gia
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thao tác
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {currentUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                                <div className="flex items-center">
                                    {user.image_url ? (
                                        <Image
                                            src={user.image_url}
                                            alt=""
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 rounded-full mr-4"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                                            <User className="w-5 h-5 text-gray-500" />
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {user.full_name || 'Chưa cập nhật tên'}
                                        </div>
                                        {user.id === currentUser?.id && (
                                            <div className="text-xs text-blue-600 font-medium">
                                                (Bạn)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                    <div>
                                        <span className="text-sm text-gray-900">{user.email || 'Chưa có email'}</span>
                                        {user.phone_number && (
                                            <div className="flex items-center text-xs text-gray-500 mt-1">
                                                <Phone className="w-3 h-3 mr-1" />
                                                {user.phone_number}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {getRoleBadge(user.role)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {new Date(user.created_at).toLocaleDateString('vi-VN')}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                    {canPromote(user) && (
                                        <button
                                            onClick={() => setConfirmAction({
                                                userId: user.id,
                                                action: 'promote',
                                                userEmail: user.email || ''
                                            })}
                                            disabled={actionLoading === user.id}
                                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 disabled:opacity-50"
                                            title="Nâng lên Admin"
                                        >
                                            {actionLoading === user.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <ShieldCheck className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}
                                    {canDemote(user) && (
                                        <button
                                            onClick={() => setConfirmAction({
                                                userId: user.id,
                                                action: 'demote',
                                                userEmail: user.email || ''
                                            })}
                                            disabled={actionLoading === user.id}
                                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50"
                                            title="Hạ xuống User"
                                        >
                                            {actionLoading === user.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <ShieldX className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}
                                    {!canPromote(user) && !canDemote(user) && (
                                        <span className="text-xs text-gray-400">Không có thao tác</span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Hiển thị {startIndex + 1} đến {Math.min(endIndex, filteredUsers.length)} trong tổng số {filteredUsers.length} người dùng
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Trước
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let page;
                                    if (totalPages <= 5) {
                                        page = i + 1;
                                    } else if (currentPage <= 3) {
                                        page = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        page = totalPages - 4 + i;
                                    } else {
                                        page = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handlePageChange(page)}
                                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                                                currentPage === page
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sau
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredUsers.length === 0 && (
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Không tìm thấy người dùng
                    </h3>
                    <p className="text-gray-600">
                        {searchTerm || roleFilter !== 'all'
                            ? 'Không có người dùng nào phù hợp với bộ lọc hiện tại.'
                            : 'Không có người dùng nào trong hệ thống.'
                        }
                    </p>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                                    confirmAction.action === 'promote'
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'bg-red-100 text-red-600'
                                }`}>
                                    {confirmAction.action === 'promote' ? (
                                        <ShieldCheck className="w-6 h-6" />
                                    ) : (
                                        <ShieldX className="w-6 h-6" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {confirmAction.action === 'promote'
                                            ? 'Nâng cấp thành Admin'
                                            : 'Hạ cấp về User'
                                        }
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {confirmAction.userEmail}
                                    </p>
                                </div>
                            </div>

                            <div className={`p-4 rounded-lg mb-6 ${
                                confirmAction.action === 'promote'
                                    ? 'bg-blue-50 border border-blue-200'
                                    : 'bg-red-50 border border-red-200'
                            }`}>
                                <p className={`text-sm ${
                                    confirmAction.action === 'promote'
                                        ? 'text-blue-800'
                                        : 'text-red-800'
                                }`}>
                                    {confirmAction.action === 'promote'
                                        ? 'Người dùng này sẽ được nâng cấp thành Admin và có thể truy cập các tính năng quản trị.'
                                        : 'Admin này sẽ bị hạ cấp về User và mất quyền truy cập các tính năng quản trị.'
                                    }
                                </p>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setConfirmAction(null)}
                                    disabled={actionLoading === confirmAction.userId}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirmAction.action === 'promote') {
                                            promoteToAdmin(confirmAction.userId);
                                        } else {
                                            demoteToUser(confirmAction.userId);
                                        }
                                    }}
                                    disabled={actionLoading === confirmAction.userId}
                                    className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${
                                        confirmAction.action === 'promote'
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                >
                                    {actionLoading === confirmAction.userId && (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    )}
                                    {confirmAction.action === 'promote' ? 'Nâng cấp' : 'Hạ cấp'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserManagementTab;