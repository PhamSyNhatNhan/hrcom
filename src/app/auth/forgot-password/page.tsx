'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from "next/image";
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Mail, Check } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email.trim()) {
            setError('Vui lòng nhập địa chỉ email');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Địa chỉ email không hợp lệ');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            if (error) {
                throw error;
            }

            setEmailSent(true);
            setMessage('Chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư.');
        } catch (err: unknown) {
            console.error('Forgot password error:', err);
            if (err instanceof Error) {
                if (err.message.includes('Email not confirmed')) {
                    setError('Email chưa được xác thực. Vui lòng kiểm tra email và xác thực tài khoản trước.');
                } else if (err.message.includes('Invalid email')) {
                    setError('Địa chỉ email không tồn tại trong hệ thống.');
                } else {
                    setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
                }
            } else {
                setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
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
                                        Email đã được gửi!
                                    </h2>

                                    <p className="text-gray-600 mb-6 leading-relaxed">
                                        Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến địa chỉ email <strong>{email}</strong>.
                                        Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
                                    </p>

                                    <div className="space-y-4">
                                        <Link
                                            href="/auth/login"
                                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg inline-block text-center"
                                        >
                                            Quay lại đăng nhập
                                        </Link>

                                        <button
                                            onClick={() => {
                                                setEmailSent(false);
                                                setEmail('');
                                                setMessage('');
                                                setError('');
                                            }}
                                            className="w-full text-cyan-600 hover:text-cyan-700 transition-colors py-2 text-sm font-medium"
                                        >
                                            Gửi lại email
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>Lưu ý:</strong> Email có thể đến muộn vài phút. Hãy kiểm tra cả thư mục spam/junk nếu không thấy email trong hộp thư chính.
                                    </p>
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
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Quên mật khẩu?
                                </h2>
                                <p className="text-gray-600">
                                    Nhập email để nhận hướng dẫn đặt lại mật khẩu
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <div className="flex items-center">
                                        <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
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
                                {/* Email Input */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Địa chỉ email
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            disabled={isLoading}
                                            className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            placeholder="Nhập địa chỉ email của bạn"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
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
                                            Đang gửi...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="w-5 h-5 mr-2" />
                                            Gửi hướng dẫn đặt lại mật khẩu
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