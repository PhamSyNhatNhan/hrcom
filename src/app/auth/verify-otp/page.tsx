'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from "next/image";
import { ArrowLeft, Mail, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/authStore';

function VerifyOtpContent() {
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { setUser } = useAuthStore();

    const email = searchParams.get('email') || '';
    const type = searchParams.get('type') || 'verification';

    // Cooldown timer for resend button
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Auto-focus on OTP input
    useEffect(() => {
        const otpInput = document.getElementById('otp');
        if (otpInput) {
            otpInput.focus();
        }
    }, []);

    const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!otp.trim()) {
            setError('Vui lòng nhập mã OTP');
            return;
        }

        if (otp.length !== 6) {
            setError('Mã OTP phải có 6 ký tự');
            return;
        }

        if (!email) {
            setError('Email không hợp lệ. Vui lòng thử lại từ trang đăng ký/đăng nhập.');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            console.log('🔐 Verifying OTP:', { email, otp, type });

            // ✅ XÁC THỰC OTP VỚI SUPABASE
            const { data, error } = await supabase.auth.verifyOtp({
                email: email,
                token: otp,
                type: type === 'registration' ? 'signup' : 'email'
            });

            if (error) {
                console.error('❌ OTP verification error:', error);

                if (error.message.includes('Token has expired') || error.message.includes('expired')) {
                    setError('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.');
                } else if (error.message.includes('Invalid token') || error.message.includes('invalid')) {
                    setError('Mã OTP không chính xác. Vui lòng kiểm tra lại.');
                } else if (error.message.includes('Email not confirmed')) {
                    setError('Email chưa được xác thực. Vui lòng kiểm tra lại mã OTP.');
                } else {
                    setError(`Có lỗi xảy ra: ${error.message}`);
                }
                return;
            }

            // ✅ KIỂM TRA DATA TRẢ VỀ
            if (data?.user && data?.session) {
                console.log('✅ OTP verification successful!');
                console.log('👤 User ID:', data.user.id);
                console.log('🔑 Session token:', data.session.access_token ? 'Present' : 'Missing');
                console.log('📧 Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');

                setMessage('Xác thực thành công! Đang chuyển đến trang thiết lập tài khoản...');

                // ✅ LẤY THÔNG TIN USER VÀ PROFILE
                try {
                    const userRole = data.user.user_metadata?.role || 'user';
                    console.log('👥 User role:', userRole);

                    // Lấy profile từ database
                    let profile = null;
                    try {
                        const { data: profileData, error: profileError } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', data.user.id)
                            .single();

                        if (!profileError && profileData) {
                            profile = profileData;
                            console.log('👤 Profile found:', profile.full_name);
                        } else {
                            console.log('⚠️ No profile found, will create basic user object');
                        }
                    } catch (profileError) {
                        console.warn('⚠️ Profile fetch failed:', profileError);
                    }

                    // ✅ TẠO USER OBJECT
                    const userWithProfile = {
                        id: data.user.id,
                        email: data.user.email!,
                        role: userRole as 'user' | 'mentor' | 'admin' | 'superadmin',
                        profile: profile || undefined,
                    };

                    // ✅ CẬP NHẬT ZUSTAND STORE
                    setUser(userWithProfile);
                    console.log('✅ User state updated in Zustand store');

                    // ✅ LUÔN CHUYỂN ĐẾN ROLE SELECTION AFTER OTP SUCCESS
                    setTimeout(() => {
                        console.log('🔄 Redirecting to role selection after OTP verification...');
                        router.push('/auth/onboarding/role-selection');
                    }, 1500);

                } catch (userSetupError) {
                    console.error('❌ Error setting up user after OTP:', userSetupError);
                    setError('Xác thực thành công nhưng có lỗi khi thiết lập tài khoản. Vui lòng đăng nhập lại.');
                }

            } else {
                console.error('❌ No user or session in OTP response:', {
                    hasUser: !!data?.user,
                    hasSession: !!data?.session
                });
                setError('Xác thực OTP thành công nhưng không thể thiết lập phiên đăng nhập. Vui lòng thử đăng nhập lại.');
            }

        } catch (err: unknown) {
            console.error('❌ Unexpected error during OTP verification:', err);
            if (err instanceof Error) {
                setError(`Có lỗi xảy ra: ${err.message}`);
            } else {
                setError('Có lỗi không xác định xảy ra. Vui lòng thử lại.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (!email) {
            setError('Email không hợp lệ');
            return;
        }

        if (resendCooldown > 0) {
            return;
        }

        setIsResending(true);
        setError('');
        setMessage('');

        try {
            console.log('📤 Resending OTP to:', email, 'Type:', type);

            // ✅ GỬI LẠI OTP
            const { error } = await supabase.auth.resend({
                type: type === 'registration' ? 'signup' : 'email_change',
                email: email
            });

            if (error) {
                console.error('❌ Resend OTP error:', error);
                if (error.message.includes('rate_limit') || error.message.includes('too_many_requests')) {
                    setError('Bạn đã yêu cầu gửi lại quá nhiều lần. Vui lòng chờ một chút.');
                } else {
                    setError('Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
                }
                return;
            }

            console.log('✅ OTP resent successfully');
            setMessage('Mã OTP mới đã được gửi đến email của bạn.');
            setResendCooldown(60);
            setOtp('');

        } catch (err: unknown) {
            console.error('❌ Resend OTP error:', err);
            setError('Có lỗi xảy ra khi gửi lại OTP.');
        } finally {
            setIsResending(false);
        }
    };

    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 6) {
            setOtp(value);
            if (error) setError('');
        }
    };

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
                                    Xác thực email
                                </h2>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Chúng tôi đã gửi mã OTP 6 ký tự đến email <br />
                                    <strong className="text-gray-800">{email}</strong>
                                </p>
                                <div className="mt-3 px-4 py-2 bg-blue-50 rounded-lg">
                                    <p className="text-blue-700 text-xs">
                                        Sau khi xác thực, bạn sẽ được chuyển đến trang thiết lập vai trò
                                    </p>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <div className="flex items-center">
                                        <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                                        <span className="text-sm text-red-700">{error}</span>
                                    </div>
                                </div>
                            )}

                            {/* Success Message */}
                            {message && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <div className="flex items-center">
                                        <Check className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                                        <span className="text-sm text-green-700">{message}</span>
                                    </div>
                                </div>
                            )}

                            <form className="space-y-6" onSubmit={handleVerifyOTP}>
                                {/* OTP Input */}
                                <div>
                                    <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Mã OTP (6 ký tự)
                                    </label>
                                    <input
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        required
                                        disabled={isLoading}
                                        className="block w-full px-4 py-4 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-center text-2xl font-mono tracking-[0.5em] font-bold text-gray-800"
                                        placeholder="000000"
                                        value={otp}
                                        onChange={handleOtpChange}
                                        autoComplete="one-time-code"
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        Nhập mã 6 ký tự từ email của bạn
                                    </p>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading || otp.length !== 6}
                                    className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang xác thực...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5 mr-2" />
                                            Xác thực OTP
                                        </>
                                    )}
                                </button>

                                {/* Resend OTP */}
                                <div className="text-center">
                                    <div className="text-sm text-gray-600 mb-3">
                                        Chưa nhận được mã?
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        disabled={isResending || resendCooldown > 0}
                                        className="inline-flex items-center text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
                                        {resendCooldown > 0
                                            ? `Gửi lại sau ${resendCooldown}s`
                                            : isResending
                                                ? 'Đang gửi...'
                                                : 'Gửi lại mã OTP'
                                        }
                                    </button>
                                </div>
                            </form>

                            {/* Back Links */}
                            <div className="text-center pt-6 mt-6 border-t border-gray-100 space-y-3">
                                <Link
                                    href={type === 'registration' ? '/auth/register' : '/auth/login'}
                                    className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    {type === 'registration' ? 'Quay lại đăng ký' : 'Quay lại đăng nhập'}
                                </Link>

                                <div className="text-xs text-gray-500">
                                    Hoặc{' '}
                                    <Link
                                        href="/"
                                        className="text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        về trang chủ
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Help Text */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                            <div className="flex items-start">
                                <Mail className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="text-blue-800 font-medium mb-1">
                                        Không thấy email?
                                    </p>
                                    <p className="text-blue-700 text-xs leading-relaxed">
                                        • Kiểm tra thư mục spam/junk<br />
                                        • Đảm bảo email chính xác<br />
                                        • Chờ vài phút để email được gửi đến<br />
                                        • Thử gửi lại mã OTP
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyOtpPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <VerifyOtpContent />
        </Suspense>
    );
}