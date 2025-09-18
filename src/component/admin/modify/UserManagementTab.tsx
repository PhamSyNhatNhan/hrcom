'use client';
import React, { useState, useEffect, useMemo } from 'react';
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
    Phone,
    GraduationCap,
    AlertTriangle
} from 'lucide-react';
import Image from 'next/image';

interface UserProfile {
    id: string;
    full_name: string;
    image_url?: string;
    phone_number?: string;
    created_at: string;
    updated_at: string;
    role: 'user' | 'admin' | 'superadmin' | 'mentor';
    email: string;
    email_confirmed_at?: string;
    last_sign_in_at?: string;
}

interface UserManagementTabProps {
    showNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
}

// Helper function for error handling
function getErrorMessage(err: unknown): string {
    if (!err) return 'Unknown error';
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;

    try {
        return JSON.stringify(err);
    } catch {
        return String(err);
    }
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
}

// Error Boundary Wrapper Component
const ErrorBoundaryWrapper: React.FC<{ children: React.ReactNode; onRetry: () => void }> = ({
                                                                                                children,
                                                                                                onRetry
                                                                                            }) => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const handleError = (error: ErrorEvent) => {
            console.error('Global error caught:', error);
            setHasError(true);
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error('Unhandled promise rejection:', event.reason);
            setHasError(true);
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    if (hasError) {
        return (
            <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Có lỗi xảy ra
                </h3>
                <p className="text-gray-600 mb-4">
                    Trang đã gặp lỗi. Vui lòng thử làm mới.
                </p>
                <div className="flex gap-2 justify-center">
                    <button
                        onClick={() => setHasError(false)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Thử lại
                    </button>
                    <button
                        onClick={() => {
                            setHasError(false);
                            onRetry();
                        }}
                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        Làm mới dữ liệu
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

const UserManagementTab: React.FC<UserManagementTabProps> = ({ showNotification }) => {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin' | 'superadmin' | 'mentor'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmAction, setConfirmAction] = useState<{
        userId: string;
        action: 'promote' | 'demote';
        userEmail: string;
        userName: string;
        currentRole: string;
        newRole: string;
    } | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [loadingDebounce, setLoadingDebounce] = useState(false);

    const pageSize = 20;

    // Memoized filtered users to prevent unnecessary recalculations
    const filteredUsers = useMemo(() => {
        let filtered = users;

        // Filter by search term
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(user => {
                const emailMatch = user.email.toLowerCase().includes(searchLower);
                const nameMatch = user.full_name.toLowerCase().includes(searchLower);
                const phoneMatch = user.phone_number?.includes(searchTerm);
                return emailMatch || nameMatch || phoneMatch;
            });
        }

        // Filter by role
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        return filtered;
    }, [users, searchTerm, roleFilter]);

    const totalPages = Math.ceil(filteredUsers.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

    // Load users from RPC - removed useCallback to prevent reload issues
    const loadUsers = async () => {
        try {
            setLoading(true);
            console.log('Loading users via RPC function...');

            const { data, error } = await supabase
                .rpc('admin_get_users_with_roles');

            if (error) {
                throw new Error(error.message);
            }

            if (!data || data.length === 0) {
                setUsers([]);
                return;
            }

            const processedUsers: UserProfile[] = data.map((u: any) => ({
                id: u.id,
                full_name: u.full_name || 'Chưa cập nhật tên',
                image_url: u.image_url,
                phone_number: u.phone_number,
                created_at: u.created_at,
                updated_at: u.updated_at,
                role: u.role || 'user',
                email: u.email || '',
                email_confirmed_at: u.email_confirmed_at,
                last_sign_in_at: u.last_sign_in_at,
            }));

            // Sort by role priority, then by creation date
            const sortedUsers = processedUsers.sort((a, b) => {
                const roleOrder = { superadmin: 0, admin: 1, mentor: 2, user: 3 };
                const aOrder = roleOrder[a.role] ?? 4;
                const bOrder = roleOrder[b.role] ?? 4;

                if (aOrder !== bOrder) return aOrder - bOrder;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            setUsers(sortedUsers);
            console.log(`Successfully loaded ${sortedUsers.length} users`);
        } catch (err) {
            console.error('Error loading users:', err);
            showNotification('error', 'Không thể tải danh sách người dùng: ' + getErrorMessage(err));
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    // Debounced load users function
    const debouncedLoadUsers = useMemo(
        () => debounce(() => {
            if (!loadingDebounce) {
                setLoadingDebounce(true);
                loadUsers().finally(() => {
                    setTimeout(() => setLoadingDebounce(false), 1000);
                });
            }
        }, 300),
        [loadingDebounce]
    );

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter]);

    // Update user role via RPC
    const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
        try {
            setActionLoading(userId);
            console.log(`Updating user ${userId} role to ${newRole}`);

            const { data, error } = await supabase.rpc('admin_update_user_role', {
                target_user_id: userId,
                new_role: newRole,
            });

            console.log('Update RPC Response:', { data, error });

            if (error) {
                throw new Error(error.message);
            }

            if (!data?.success) {
                throw new Error(data?.error || 'Failed to update role');
            }

            // Update local state
            setUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ));

            const actionText = newRole === 'admin' ? 'nâng cấp lên Admin' : 'hạ cấp về User';
            showNotification('success', `Đã ${actionText} thành công`);

        } catch (error) {
            console.error('Error updating user role:', error);
            showNotification('error', `Không thể cập nhật quyền: ${getErrorMessage(error)}`);
        } finally {
            setActionLoading(null);
            setConfirmAction(null);
        }
    };

    // Get role badge with proper styling
    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'superadmin':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        <Crown className="w-3 h-3 mr-1" />
                        Super Admin
                    </span>
                );
            case 'admin':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Admin
                    </span>
                );
            case 'mentor':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        Mentor
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        <User className="w-3 h-3 mr-1" />
                        User
                    </span>
                );
        }
    };

    // Check if user can be promoted (user -> admin)
    const canPromote = (user: UserProfile) => {
        return user.role === 'user' && user.id !== currentUser?.id;
    };

    // Check if user can be demoted (admin -> user)
    const canDemote = (user: UserProfile) => {
        return user.role === 'admin' && user.id !== currentUser?.id;
    };

    // Check if user has any actions available
    const hasActions = (user: UserProfile) => {
        return canPromote(user) || canDemote(user);
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Generate pagination numbers
    const getPaginationNumbers = () => {
        const delta = 2; // Show 2 pages before and after current page
        const pages = [];
        const start = Math.max(1, currentPage - delta);
        const end = Math.min(totalPages, currentPage + delta);

        // Add first page if not in range
        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push('...');
        }

        // Add pages in range
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        // Add last page if not in range
        if (end < totalPages) {
            if (end < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    // Handle confirm action
    const handleAction = (user: UserProfile, action: 'promote' | 'demote') => {
        const newRole = action === 'promote' ? 'admin' : 'user';
        setConfirmAction({
            userId: user.id,
            action,
            userEmail: user.email,
            userName: user.full_name,
            currentRole: user.role,
            newRole
        });
    };

    // Execute confirmed action
    const executeAction = () => {
        if (confirmAction) {
            updateUserRole(confirmAction.userId, confirmAction.newRole as 'user' | 'admin');
        }
    };

    // Load users on component mount
    useEffect(() => {
        loadUsers();

        // Cleanup function to prevent memory leaks
        return () => {
            setLoading(false);
            setActionLoading(null);
        };
    }, []); // Empty dependency array - only run once

    if (loading) {
        return (
            <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Đang tải danh sách người dùng...</p>
            </div>
        );
    }

    return (
        <ErrorBoundaryWrapper onRetry={loadUsers}>
            {/* Filters Section */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    {/* Search Input */}
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
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">Tất cả quyền hạn</option>
                        <option value="superadmin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="mentor">Mentor</option>
                        <option value="user">User</option>
                    </select>

                    {/* Refresh Button */}
                    <button
                        onClick={debouncedLoadUsers}
                        disabled={loading || loadingDebounce}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${(loading || loadingDebounce) ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                </div>

                {/* Stats */}
                <div className="mt-4 text-sm text-gray-600">
                    Hiển thị {Math.min(startIndex + 1, filteredUsers.length)}-{Math.min(endIndex, filteredUsers.length)} / {filteredUsers.length} người dùng
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
                            Thông tin liên hệ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quyền hạn
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ngày tham gia
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thao tác
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {currentUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            {/* User Info */}
                            <td className="px-6 py-4">
                                <div className="flex items-center">
                                    {user.image_url ? (
                                        <Image
                                            src={user.image_url}
                                            alt={user.full_name}
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 rounded-full object-cover mr-4"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                                            <User className="w-5 h-5 text-gray-500" />
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {user.full_name}
                                        </div>
                                        {user.id === currentUser?.id && (
                                            <div className="text-xs text-blue-600 font-medium">
                                                (Bạn)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>

                            {/* Contact Info */}
                            <td className="px-6 py-4">
                                <div className="space-y-1">
                                    <div className="flex items-center text-sm text-gray-900">
                                        <Mail className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                                        <span className="truncate">{user.email}</span>
                                    </div>
                                    {user.phone_number && (
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Phone className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                                            <span>{user.phone_number}</span>
                                        </div>
                                    )}
                                </div>
                            </td>

                            {/* Role */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                {getRoleBadge(user.role)}
                            </td>

                            {/* Join Date */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {new Date(user.created_at).toLocaleDateString('vi-VN', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit'
                                    })}
                                </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-2">
                                    {canPromote(user) && (
                                        <button
                                            onClick={() => handleAction(user, 'promote')}
                                            disabled={actionLoading === user.id}
                                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
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
                                            onClick={() => handleAction(user, 'demote')}
                                            disabled={actionLoading === user.id}
                                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                                            title="Hạ xuống User"
                                        >
                                            {actionLoading === user.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <ShieldX className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}

                                    {!hasActions(user) && (
                                        <span className="text-xs text-gray-400 px-2 py-1">
                                                {user.role === 'mentor' ? 'Không điều chỉnh được' :
                                                    user.role === 'superadmin' ? 'Super Admin' :
                                                        user.id === currentUser?.id ? 'Tài khoản của bạn' :
                                                            'Không có thao tác'}
                                            </span>
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
                            Hiển thị <span className="font-medium">{Math.min(startIndex + 1, filteredUsers.length)}</span> đến{' '}
                            <span className="font-medium">{Math.min(endIndex, filteredUsers.length)}</span> trong tổng số{' '}
                            <span className="font-medium">{filteredUsers.length}</span> người dùng
                        </div>

                        <nav className="flex items-center gap-2">
                            {/* Previous Button */}
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Trước
                            </button>

                            {/* Page Numbers */}
                            <div className="flex gap-1">
                                {getPaginationNumbers().map((page, index) => (
                                    <React.Fragment key={index}>
                                        {page === '...' ? (
                                            <span className="px-3 py-2 text-sm text-gray-500">...</span>
                                        ) : (
                                            <button
                                                onClick={() => handlePageChange(page as number)}
                                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                                    currentPage === page
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Next Button */}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Sau
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </nav>
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
                    <p className="text-gray-600 mb-4">
                        {searchTerm || roleFilter !== 'all'
                            ? 'Không có người dùng nào phù hợp với bộ lọc hiện tại.'
                            : 'Không có người dùng nào trong hệ thống.'
                        }
                    </p>
                    {(searchTerm || roleFilter !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setRoleFilter('all');
                            }}
                            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            Xóa bộ lọc
                        </button>
                    )}
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
                                        {confirmAction.userName} ({confirmAction.userEmail})
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
                                        ? `Người dùng này sẽ được nâng từ ${confirmAction.currentRole} lên ${confirmAction.newRole} và có thể truy cập các tính năng quản trị.`
                                        : `Người dùng này sẽ bị hạ từ ${confirmAction.currentRole} xuống ${confirmAction.newRole} và mất quyền truy cập các tính năng quản trị.`
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
                                    onClick={executeAction}
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
        </ErrorBoundaryWrapper>
    );
};

export default UserManagementTab;