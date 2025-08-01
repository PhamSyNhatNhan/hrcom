'use client';
import { Suspense, useEffect, useState  } from 'react';



import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

function AuthErrorClient() {
    const searchParams = useSearchParams();
    const [error, setError] = useState('');
    const [errorDescription, setErrorDescription] = useState('');

    useEffect(() => {
        const errorParam = searchParams.get('error');
        const errorDescriptionParam = searchParams.get('error_description');

        if (errorParam) setError(errorParam);
        if (errorDescriptionParam) setErrorDescription(decodeURIComponent(errorDescriptionParam));
    }, [searchParams]);

    const getErrorInfo = () => {
        switch (error) {
            case 'access_denied':
                return {
                    title: 'Truy cập bị từ chối',
                    message: 'Bạn đã từ chối quyền truy cập hoặc hủy quá trình đăng nhập.',
                    suggestion: 'Vui lòng thử đăng nhập lại nếu bạn muốn tiếp tục.'
                };
            case 'server_error':
                return {
                    title: 'Lỗi máy chủ',
                    message: 'Có lỗi xảy ra trên máy chủ xác thực.',
                    suggestion: 'Vui lòng thử lại sau vài phút hoặc liên hệ hỗ trợ.'
                };
            case 'temporarily_unavailable':
                return {
                    title: 'Dịch vụ tạm thời không khả dụng',
                    message: 'Dịch vụ xác thực hiện đang bảo trì hoặc quá tải.',
                    suggestion: 'Vui lòng thử lại sau vài phút.'
                };
            case 'invalid_request':
                return {
                    title: 'Yêu cầu không hợp lệ',
                    message: 'Yêu cầu xác thực không đúng định dạng.',
                    suggestion: 'Vui lòng thử đăng nhập lại.'
                };
            case 'invalid_client':
                return {
                    title: 'Ứng dụng không hợp lệ',
                    message: 'Có vấn đề với cấu hình ứng dụng.',
                    suggestion: 'Vui lòng liên hệ hỗ trợ kỹ thuật.'
                };
            case 'invalid_grant':
                return {
                    title: 'Thông tin xác thực không hợp lệ',
                    message: 'Thông tin đăng nhập đã hết hạn hoặc không hợp lệ.',
                    suggestion: 'Vui lòng đăng nhập lại.'
                };
            case 'unauthorized_client':
                return {
                    title: 'Ứng dụng không được ủy quyền',
                    message: 'Ứng dụng không có quyền thực hiện yêu cầu này.',
                    suggestion: 'Vui lòng liên hệ hỗ trợ kỹ thuật.'
                };
            case 'unsupported_response_type':
                return {
                    title: 'Loại phản hồi không được hỗ trợ',
                    message: 'Phương thức xác thực này không được hỗ trợ.',
                    suggestion: 'Vui lòng thử phương thức đăng nhập khác.'
                };
            case 'invalid_scope':
                return {
                    title: 'Phạm vi truy cập không hợp lệ',
                    message: 'Yêu cầu quyền truy cập không hợp lệ.',
                    suggestion: 'Vui lòng thử đăng nhập lại.'
                };
            default:
                return {
                    title: 'Có lỗi xảy ra',
                    message: errorDescription || 'Đã xảy ra lỗi không xác định trong quá trình xác thực.',
                    suggestion: 'Vui lòng thử đăng nhập lại hoặc liên hệ hỗ trợ nếu vấn đề tiếp tục xảy ra.'
                };
        }
    };

    const errorInfo = getErrorInfo();

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
                            </div>

                            {/* Error Content */}
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <AlertCircle className="w-8 h-8 text-red-600" />
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 mb-4">{errorInfo.title}</h2>
                                <p className="text-gray-600 mb-4 leading-relaxed">{errorInfo.message}</p>
                                <p className="text-gray-500 text-sm mb-8">{errorInfo.suggestion}</p>

                                {(error || errorDescription) && (
                                    <div className="mb-8 p-4 bg-gray-50 rounded-lg text-left">
                                        <p className="text-xs text-gray-500 font-medium mb-2">Chi tiết lỗi:</p>
                                        {error && (
                                            <p className="text-xs text-gray-600 mb-1">
                                                <span className="font-medium">Mã lỗi:</span> {error}
                                            </p>
                                        )}
                                        {errorDescription && (
                                            <p className="text-xs text-gray-600">
                                                <span className="font-medium">Mô tả:</span> {errorDescription}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="space-y-4">
                                    <Link
                                        href="/auth/login"
                                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg inline-flex items-center justify-center"
                                    >
                                        <RefreshCw className="w-5 h-5 mr-2" />
                                        Thử đăng nhập lại
                                    </Link>

                                    <Link
                                        href="/"
                                        className="w-full text-cyan-600 hover:text-cyan-700 transition-colors py-2 text-sm font-medium inline-flex items-center justify-center"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Quay về trang chủ
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Support Info */}
                        <div className="text-center mt-6 p-4 bg-blue-50 rounded-xl">
                            <p className="text-sm text-blue-800">
                                <strong>Cần hỗ trợ?</strong> Liên hệ với chúng tôi qua email{' '}
                                <a href="mailto:info@hrcompanion.vn" className="font-medium underline">
                                    info@hrcompanion.vn
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600">Đang tải...</div>}>
            <AuthErrorClient />
        </Suspense>
    );
}
