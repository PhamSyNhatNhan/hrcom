'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from "next/image";
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Lock, Check, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [resetComplete, setResetComplete] = useState(false);
    const [isProcessingCode, setIsProcessingCode] = useState(true);

    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    useEffect(() => {
        const handlePasswordReset = async () => {
            const code = searchParams.get('code');

            if (!code) {
                setError('Liên kết không hợp lệ hoặc thiếu mã xác thực.');
                setIsProcessingCode(false);
                return;
            }

            try {
                console.log('Processing reset code:', code);

                // Set cookie để báo middleware đây là recovery session
                document.cookie = 'sb-recovery-flow=true; path=/';

                // Đối với Supabase mới, code sẽ được xử lý tự động
                // Chỉ cần kiểm tra session sau khi code được exchange
                await new Promise(resolve => setTimeout(resolve, 1000)); // Đợi 1 giây để auth state update

                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (user && !userError) {
                    console.log('User authenticated for password reset:', user.email);
                    setIsProcessingCode(false);
                } else {
                    console.error('No authenticated user found:', userError);
                    setError('Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.');
                    setIsProcessingCode(false);
                }
            } catch (err) {
                console.error('Error processing reset code:', err);
                setError('Có lỗi xảy ra khi xử lý liên kết đặt lại mật khẩu.');
                setIsProcessingCode(false);
            }
        };

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change during reset:', event, session?.user?.email);

            if (event === 'SIGNED_IN' && session?.user) {
                console.log('User signed in during password reset flow');
                setIsProcessingCode(false);
            }
        });

        handlePasswordReset();

        return () => {
            subscription.unsubscribe();
        };
    }, [searchParams, supabase.auth]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validation
        if (!password.trim()) {
            setError('Vui lòng nhập mật khẩu mới');
            return;
        }

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                throw error;
            }

            setResetComplete(true);
            setMessage('Mật khẩu đã được đặt lại thành công!');

            // Clear recovery flag
            document.cookie = 'sb-recovery-flow=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

            // Clear session sau khi reset thành công để tránh auto-login
            setTimeout(async () => {
                await supabase.auth.signOut();
                router.push('/auth/login?message=' + encodeURIComponent('Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại.'));
            }, 2000);

        } catch (err: unknown) {
            console.error('Reset password error:', err);
            if (err instanceof Error) {
                if (err.message.includes('session_not_found') || err.message.includes('not authenticated')) {
                    setError('Phiên làm việc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.');
                } else if (err.message.includes('weak_password')) {
                    setError('Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.');
                } else {
                    setError('Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại.');
                }
            } else {
                setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state while processing code
    if (isProcessingCode) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang xử lý yêu cầu đặt lại mật khẩu...</p>
                </div>
            </div>
        );
    }

    // Success state
    if (resetComplete) {
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
                                        Thành công!
                                    </h2>

                                    <p className="text-gray-600 mb-6 leading-relaxed">
                                        Mật khẩu của bạn đã được đặt lại thành công.
                                        Bạn sẽ được chuyển hướng đến trang đăng nhập sau 3 giây.
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

    // Error state - invalid link or expired
    if (error && isProcessingCode === false) {
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
                                        Liên kết không hợp lệ
                                    </h2>

                                    <p className="text-gray-600 mb-6 leading-relaxed">
                                        {error}
                                    </p>

                                    <div className="space-y-4">
                                        <Link
                                            href="/auth/forgot-password"
                                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg inline-block text-center"
                                        >
                                            Yêu cầu đặt lại mật khẩu mới
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
                            {error && !isProcessingCode && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <div className="flex items-center">
                                        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                                        <span className="text-sm text-red-700">{error}</span>
                                    </div>
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

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                {/* Password Input */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Mật khẩu mới
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            required
                                            disabled={isLoading}
                                            className="block w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isLoading}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
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
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
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
                                            Đang xử lý...
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
                                        className="inline-flex items-center text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors duration-200"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Quay lại đăng nhập
                                    </Link>
                                </div>
                            </form>

                            {/* Help text */}
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Lưu ý:</strong> Nếu gặp vấn đề, vui lòng yêu cầu đặt lại mật khẩu mới.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}