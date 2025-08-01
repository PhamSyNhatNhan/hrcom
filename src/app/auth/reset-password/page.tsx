'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from "next/image";
import { createClient } from '@/utils/supabase/client';
import { Eye, EyeOff, Lock, Check, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Check if we have the required tokens from the URL
    useEffect(() => {
        const checkToken = async () => {
            const accessToken = searchParams.get('access_token');
            const refreshToken = searchParams.get('refresh_token');

            if (!accessToken || !refreshToken) {
                setIsValidToken(false);
                setError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
                return;
            }

            try {
                // Set the session with the tokens from URL
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (error) {
                    throw error;
                }

                setIsValidToken(true);
            } catch (err) {
                console.error('Token validation error:', err);
                setIsValidToken(false);
                setError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
            }
        };

        checkToken();
    }, [searchParams, supabase.auth]);

    const validateForm = () => {
        if (!newPassword.trim()) {
            setError('Vui lòng nhập mật khẩu mới');
            return false;
        }

        if (newPassword.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                throw error;
            }

            setSuccess(true);
        } catch (err: unknown) {
            console.error('Reset password error:', err);
            if (err instanceof Error) {
                if (err.message.includes('New password should be different')) {
                    setError('Mật khẩu mới phải khác với mật khẩu cũ');
                } else if (err.message.includes('Password should be at least')) {
                    setError('Mật khẩu phải có ít nhất 6 ký tự');
                } else {
                    setError('Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại.');
                }
            } else {
                setError('Có lỗi xảy ra. Vui lòng thử lại.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state while checking token
    if (isValidToken === null) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Đang xác thực...</p>
                </div>
            </div>
        );
    }

    // Invalid token state
    if (isValidToken === false) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="flex min-h-[calc(100vh-64px)]">
                    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                        <div className="max-w-md w-full">
                            <div className="bg-white py-8 px-8 shadow-lg rounded-xl">
                                <div className="text-center mb-8">
                                    <div className="flex justify-center mb-6">
                                        <Image
                                            src="/HR-Comapnion-logo.png"
                                            alt="Logo"
                                            width={160}
                                            height={50}
                                            className="h-auto w-auto"
                                        />
                                    </div>
                                </div>

                                <div className="text-center">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <AlertCircle className="w-8 h-8 text-red-600" />
                                    </div>

                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                        Link không hợp lệ
                                    </h2>

                                    <p className="text-gray-600 mb-6 leading-relaxed">
                                        Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
                                        Vui lòng yêu cầu một link mới.
                                    </p>

                                    <div className="space-y-4">
                                        <Link
                                            href="/auth/forgot-password"
                                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg inline-block text-center"
                                        >
                                            Yêu cầu link mới
                                        </Link>

                                        <Link
                                            href="/auth/login"
                                            className="w-full text-cyan-600 hover:text-cyan-700 transition-colors py-2 text-sm font-medium inline-block text-center"
                                        >
                                            Quay lại đăng nhập
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="flex min-h-[calc(100vh-64px)]">
                    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                        <div className="max-w-md w-full">
                            <div className="bg-white py-8 px-8 shadow-lg rounded-xl">
                                <div className="text-center mb-8">
                                    <div className="flex justify-center mb-6">
                                        <Image
                                            src="/HR-Comapnion-logo.png"
                                            alt="Logo"
                                            width={160}
                                            height={50}
                                            className="h-auto w-auto"
                                        />
                                    </div>
                                </div>

                                <div className="text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Check className="w-8 h-8 text-green-600" />
                                    </div>

                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                        Đặt lại mật khẩu thành công!
                                    </h2>

                                    <p className="text-gray-600 mb-6 leading-relaxed">
                                        Mật khẩu của bạn đã được đặt lại thành công.
                                        Bạn có thể đăng nhập với mật khẩu mới.
                                    </p>

                                    <Link
                                        href="/auth/login"
                                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg inline-block text-center"
                                    >
                                        Đăng nhập ngay
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Reset password form
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex min-h-[calc(100vh-64px)]">
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md w-full">
                        <div className="bg-white py-8 px-8 shadow-lg rounded-xl">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="flex justify-center mb-6">
                                    <Image
                                        src="/HR-Comapnion-logo.png"
                                        alt="Logo"
                                        width={160}
                                        height={50}
                                        className="h-auto w-auto"
                                    />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Đặt lại mật khẩu
                                </h2>
                                <p className="text-gray-600">
                                    Nhập mật khẩu mới cho tài khoản của bạn
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <div className="flex items-center">
                                        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                                        <span className="text-sm text-red-700">{error}</span>
                                    </div>
                                </div>
                            )}

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                {/* New Password Input */}
                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Mật khẩu mới
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="newPassword"
                                            name="newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            required
                                            disabled={isLoading}
                                            className="block w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isLoading}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password Input */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Xác nhận mật khẩu mới
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            required
                                            disabled={isLoading}
                                            className="block w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            placeholder="Nhập lại mật khẩu mới"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isLoading}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Password Requirements */}
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-sm text-blue-800 font-medium mb-2">Yêu cầu mật khẩu:</p>
                                    <ul className="text-sm text-blue-700 space-y-1">
                                        <li className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full mr-2 ${newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            Tối thiểu 6 ký tự
                                        </li>
                                        <li className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full mr-2 ${newPassword === confirmPassword && newPassword.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            Mật khẩu xác nhận phải khớp
                                        </li>
                                    </ul>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang cập nhật...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-5 h-5 mr-2" />
                                            Đặt lại mật khẩu
                                        </>
                                    )}
                                </button>

                                {/* Back to Login Link */}
                                <div className="text-center pt-2">
                                    <Link
                                        href="/auth/login"
                                        className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors duration-200"
                                    >
                                        Quay lại đăng nhập
                                    </Link>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-6">
                            <p className="text-xs text-gray-500">
                                Bạn chưa có tài khoản?{' '}
                                <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
                                    Đăng ký ngay
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}