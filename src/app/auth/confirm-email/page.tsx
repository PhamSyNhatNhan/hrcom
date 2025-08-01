'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from "next/image";
import { createClient } from '@/utils/supabase/client';
import { resendConfirmation } from '@/lib/auth';
import { Check, AlertCircle, Mail, RefreshCw, Clock } from 'lucide-react';

export default function EmailConfirmationPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const searchParams = useSearchParams();
    const supabase = createClient();

    // Get email from URL params or localStorage
    const email = searchParams.get('email') || localStorage.getItem('confirmation_email') || '';

    // Countdown timer for resend cooldown
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Check if user is already confirmed on mount
    useEffect(() => {
        const checkConfirmation = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && user.email_confirmed_at) {
                    setConfirmed(true);
                    setMessage('Email của bạn đã được xác thực thành công!');
                }
            } catch (error) {
                console.error('Error checking confirmation:', error);
            }
        };

        checkConfirmation();
    }, [supabase.auth]);

    // Listen for auth state changes (when user clicks confirm link)
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
                    setConfirmed(true);
                    setMessage('Email đã được xác thực thành công! Bạn có thể đăng nhập ngay bây giờ.');
                    setError('');
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const handleResendConfirmation = async () => {
        if (!email) {
            setError('Không tìm thấy địa chỉ email. Vui lòng đăng ký lại.');
            return;
        }

        if (resendCooldown > 0) {
            setError(`Vui lòng đợi ${resendCooldown} giây trước khi gửi lại.`);
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const { error } = await resendConfirmation(email);

            if (error) {
                throw new Error(error);
            }

            setMessage('Email xác thực đã được gửi lại! Vui lòng kiểm tra hộp thư.');
            setResendCooldown(60); // 60 seconds cooldown
        } catch (err) {
            console.error('Resend confirmation error:', err);
            if (err instanceof Error) {
                if (err.message.includes('Email rate limit exceeded')) {
                    setError('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 5 phút.');
                    setResendCooldown(300); // 5 minutes cooldown
                } else if (err.message.includes('User not found')) {
                    setError('Không tìm thấy tài khoản với email này. Vui lòng đăng ký lại.');
                } else {
                    setError('Có lỗi xảy ra khi gửi email. Vui lòng thử lại.');
                }
            } else {
                setError('Có lỗi xảy ra. Vui lòng thử lại.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (confirmed) {
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
                                        Email đã được xác thực!
                                    </h2>

                                    <p className="text-gray-600 mb-8 leading-relaxed">
                                        Chào mừng bạn đến với HR Companion! Tài khoản của bạn đã được kích hoạt thành công.
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
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Mail className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Xác thực email của bạn
                                </h2>
                                <p className="text-gray-600">
                                    Chúng tôi đã gửi email xác thực đến địa chỉ của bạn
                                </p>
                            </div>

                            {/* Email Display */}
                            {email && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-600 text-center">
                                        Email được gửi đến:
                                    </p>
                                    <p className="text-lg font-semibold text-gray-900 text-center">
                                        {email}
                                    </p>
                                </div>
                            )}

                            {/* Success Message */}
                            {message && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <div className="flex items-center">
                                        <Check className="h-5 w-5 text-green-400 mr-2" />
                                        <span className="text-sm text-green-700">{message}</span>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <div className="flex items-center">
                                        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                                        <span className="text-sm text-red-700">{error}</span>
                                    </div>
                                </div>
                            )}

                            {/* Instructions */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Hướng dẫn xác thực:
                                </h3>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                                    <li>Kiểm tra hộp thư email của bạn</li>
                                    <li>Tìm email từ HR Companion</li>
                                    <li>Nhấp vào link "Xác thực email" trong email</li>
                                    <li>Quay lại trang này để hoàn tất</li>
                                </ol>
                            </div>

                            {/* Resend Button */}
                            <div className="space-y-4">
                                <button
                                    onClick={handleResendConfirmation}
                                    disabled={isLoading || resendCooldown > 0}
                                    className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang gửi...
                                        </>
                                    ) : resendCooldown > 0 ? (
                                        <>
                                            <Clock className="w-5 h-5 mr-2" />
                                            Gửi lại sau {resendCooldown}s
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-5 h-5 mr-2" />
                                            Gửi lại email xác thực
                                        </>
                                    )}
                                </button>

                                {/* Alternative Actions */}
                                <div className="text-center space-y-2">
                                    <Link
                                        href="/auth/login"
                                        className="block text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors duration-200"
                                    >
                                        Quay lại đăng nhập
                                    </Link>
                                    <Link
                                        href="/auth/register"
                                        className="block text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                                    >
                                        Đăng ký với email khác
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Help Section */}
                        <div className="text-center mt-6 p-4 bg-blue-50 rounded-xl">
                            <p className="text-sm text-blue-800 mb-2">
                                <strong>Không nhận được email?</strong>
                            </p>
                            <ul className="text-xs text-blue-700 space-y-1">
                                <li>• Kiểm tra thư mục spam/junk</li>
                                <li>• Đảm bảo email chính xác</li>
                                <li>• Thử gửi lại sau vài phút</li>
                                <li>• Liên hệ hỗ trợ: info@hrcompanion.vn</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}