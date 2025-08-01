'use client';
import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { resendConfirmation } from '@/lib/auth';
import { Check, AlertCircle, Mail, RefreshCw, Clock } from 'lucide-react';

function ConfirmEmailClientPage() {
    'use client';

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const searchParams = useSearchParams();
    const supabase = createClient();

    const email = searchParams.get('email') || localStorage.getItem('confirmation_email') || '';

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    useEffect(() => {
        const checkConfirmation = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.email_confirmed_at) {
                    setConfirmed(true);
                    setMessage('Email của bạn đã được xác thực thành công!');
                }
            } catch (error) {
                console.error('Error checking confirmation:', error);
            }
        };
        checkConfirmation();
    }, [supabase.auth]);

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
            if (error) throw new Error(error);

            setMessage('Email xác thực đã được gửi lại! Vui lòng kiểm tra hộp thư.');
            setResendCooldown(60);
        } catch (err) {
            console.error('Resend confirmation error:', err);
            if (err instanceof Error) {
                if (err.message.includes('Email rate limit exceeded')) {
                    setError('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 5 phút.');
                    setResendCooldown(300);
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
                <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
                    <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-lg text-center">
                        <Image src="/HR-Comapnion-logo.png" alt="Logo" width={160} height={50} className="mx-auto mb-6" />
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Email đã được xác thực!</h2>
                        <p className="text-gray-600 mb-8">Chào mừng bạn đến với HR Companion! Tài khoản của bạn đã được kích hoạt thành công.</p>
                        <Link href="/auth/login" className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-4 rounded-xl inline-block hover:from-cyan-600 hover:to-blue-700 transition-all duration-300">
                            Đăng nhập ngay
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
                <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-lg">
                    <div className="text-center mb-8">
                        <Image src="/HR-Comapnion-logo.png" alt="Logo" width={160} height={50} className="mx-auto mb-6" />
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Xác thực email của bạn</h2>
                        <p className="text-gray-600">Chúng tôi đã gửi email xác thực đến địa chỉ của bạn</p>
                    </div>

                    {email && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl text-center">
                            <p className="text-sm text-gray-600">Email được gửi đến:</p>
                            <p className="text-lg font-semibold">{email}</p>
                        </div>
                    )}

                    {message && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center">
                            <Check className="h-5 w-5 text-green-400 mr-2" />
                            <span className="text-sm text-green-700">{message}</span>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                            <span className="text-sm text-red-700">{error}</span>
                        </div>
                    )}

                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 mb-6">
                        <li>Kiểm tra hộp thư email của bạn</li>
                        <li>Tìm email từ HR Companion</li>
                        <li>Nhấp vào link "Xác thực email"</li>
                        <li>Quay lại trang này để hoàn tất</li>
                    </ol>

                    <button
                        onClick={handleResendConfirmation}
                        disabled={isLoading || resendCooldown > 0}
                        className="w-full flex justify-center items-center py-3 px-4 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
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

                    <div className="text-center mt-4 space-y-2">
                        <Link href="/auth/login" className="text-sm text-cyan-600 hover:text-cyan-700 block">
                            Quay lại đăng nhập
                        </Link>
                        <Link href="/auth/register" className="text-sm text-gray-500 hover:text-gray-700 block">
                            Đăng ký với email khác
                        </Link>
                    </div>

                    <div className="text-center mt-6 p-4 bg-blue-50 rounded-xl">
                        <p className="text-sm text-blue-800 mb-2 font-medium">Không nhận được email?</p>
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
    );
}

export default function ConfirmEmailPage() {
    return (
        <Suspense fallback={<div className="text-center py-10">Đang tải trang xác thực email...</div>}>
            <ConfirmEmailClientPage />
        </Suspense>
    );
}
