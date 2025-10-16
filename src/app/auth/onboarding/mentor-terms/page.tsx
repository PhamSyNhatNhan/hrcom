'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle, AlertCircle, ArrowRight, X, FileText } from 'lucide-react';

export default function MentorTermsPage() {
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleContinue = () => {
        if (!acceptedTerms) {
            setError('Bạn cần đồng ý với điều khoản để tiếp tục');
            return;
        }
        router.push('/auth/onboarding/mentor-setup');
    };

    const handleBack = () => {
        router.push('/auth/onboarding/role-selection');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            <div className="flex min-h-screen">
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-4xl w-full">
                        <div className="bg-white/80 backdrop-blur-sm py-12 px-8 shadow-2xl rounded-2xl border border-white/20">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="flex justify-center mb-8">
                                    <Image
                                        src="/HR-Comapnion-logo.png"
                                        alt="Logo"
                                        width={200}
                                        height={60}
                                        className="h-auto w-auto"
                                    />
                                </div>

                                <div className="mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-8 h-8 text-white" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                        Chính sách và Quy định dành cho Mentor
                                    </h1>
                                    <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                                        Vui lòng đọc kỹ và đồng ý với các điều khoản trước khi tiếp tục
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

                            {/* Terms Content */}
                            <div className="bg-gray-50 rounded-xl p-6 mb-8 max-h-[500px] overflow-y-auto">
                                <div className="space-y-6 text-gray-700">
                                    {/* Định nghĩa */}
                                    <section>
                                        <h2 className="text-xl font-bold text-gray-900 mb-3">1. Định nghĩa</h2>
                                        <p className="leading-relaxed">
                                            Mentor là những người làm công tác Nhân sự tại các đơn vị, tổ chức doanh nghiệp
                                            đã có kinh nghiệm trong lĩnh vực Nhân sự nói chung và công tác tuyển dụng nói riêng.
                                            Mentor tham gia các dự án trên tinh thần tình nguyện và tự nguyện, không bao gồm
                                            các công việc được giao trong hợp đồng lao động chính thức.
                                        </p>
                                    </section>

                                    {/* Quyền lợi */}
                                    <section>
                                        <h2 className="text-xl font-bold text-gray-900 mb-3">2. Quyền lợi và Nghĩa vụ</h2>

                                        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">2.1. Quyền lợi của Mentor</h3>
                                        <p className="mb-2">Khi trở thành Mentor của HR Companion, bạn sẽ có các quyền lợi sau:</p>
                                        <ul className="list-disc list-inside space-y-2 ml-4">
                                            <li>Được tham gia giao lưu, chia sẻ kiến thức, kỹ năng chuyên môn cùng cộng đồng nhân sự với quy mô lớn.</li>
                                            <li>Được tham gia các chương trình đào tạo chuyên môn của HR Companion để nâng cao kiến thức và kỹ năng.</li>
                                            <li>Có cơ hội được kết nối với những chuyên gia Nhân sự giỏi trong cộng đồng.</li>
                                            <li>Được tham gia vào các sự kiện, khóa học, hội thảo, buổi chia sẻ kiến thức chuyên ngành, phát triển bản thân và mở rộng quan hệ.</li>
                                            <li>Được nhận các khoản thưởng, tri ân do HR Companion quy định (nếu có).</li>
                                            <li>Doanh nghiệp của Mentor đang làm việc được hỗ trợ tạo điều kiện để kết nối, phát triển thương hiệu tuyển dụng trong khuôn khổ các chương trình hoạt động của HR Companion và các đơn vị đối tác.</li>
                                        </ul>

                                        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">2.2. Nghĩa vụ và Cam kết của Mentor</h3>
                                        <p className="mb-2">Mentor có trách nhiệm thực hiện các nghĩa vụ sau:</p>
                                        <ul className="list-disc list-inside space-y-2 ml-4">
                                            <li><strong>Tham gia và đóng góp:</strong> Tham gia các hoạt động đã cam kết và đóng góp cho các hoạt động phát triển chất lượng đội ngũ Mentor và Trợ lý dự án một cách phối hợp và chuyên nghiệp.</li>
                                            <li><strong>Chia sẻ chuyên môn:</strong> Tích cực chia sẻ kiến thức, kỹ năng, hỗ trợ tư vấn các vấn đề liên quan đến Nhân sự theo quy định của chương trình.</li>
                                            <li><strong>Cam kết Bảo mật:</strong> Cam kết bảo mật tuyệt đối mọi thông tin, tài liệu, dữ liệu và tài sản sở hữu trí tuệ của HR Companion trong suốt quá trình hợp tác và sau khi chấm dứt hợp tác.</li>
                                            <li><strong>Duy trì Uy tín & Hình ảnh:</strong> Đảm bảo giữ gìn hình ảnh, uy tín cá nhân không làm ảnh hưởng tiêu cực đến uy tín và thương hiệu của HR Companion.</li>
                                            <li><strong>Quy tắc tham gia sự kiện:</strong> Khi tham gia các sự kiện, hoạt động Đào tạo, Workshop về Kỹ năng ứng tuyển, Mentor có nghĩa vụ thông báo và trao đổi thông tin với Trợ lý của HR Companion. Đồng thời, Mentor cần sử dụng danh xưng Mentor/Cố vấn chuyên môn tại HR Companion tại sự kiện đó.</li>
                                        </ul>
                                    </section>

                                    {/* Điều khoản chung */}
                                    <section>
                                        <h2 className="text-xl font-bold text-gray-900 mb-3">3. Điều Khoản Chung</h2>
                                        <ul className="list-disc list-inside space-y-2 ml-4">
                                            <li><strong>Chấp thuận:</strong> Khi đăng ký trở thành Mentor và chấp nhận Chính sách này, bạn đồng ý với tất cả các điều khoản, quy định và nghĩa vụ được nêu trên cùng các quy định đã được Ban điều hành HR Companion ban hành.</li>
                                            <li><strong>Điều chỉnh:</strong> Quy định này có hiệu lực kể từ ngày ký và có thể được Ban Điều hành HR Companion điều chỉnh, bổ sung khi cần thiết. Mọi thay đổi sẽ được thông báo đến Mentor.</li>
                                            <li><strong>Giải quyết tranh chấp:</strong> Mọi tranh chấp, vướng mắc phát sinh (nếu có) sẽ được Ban Điều hành, Mentor và Trợ lý dự án cùng thảo luận, phối hợp giải quyết trên tinh thần thiện chí và tuân thủ quy định pháp luật.</li>
                                        </ul>
                                    </section>
                                </div>
                            </div>

                            {/* Checkbox Agreement */}
                            <div className="mb-8">
                                <label className="flex items-start cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={acceptedTerms}
                                            onChange={(e) => {
                                                setAcceptedTerms(e.target.checked);
                                                if (e.target.checked && error) {
                                                    setError('');
                                                }
                                            }}
                                            className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                                        />
                                    </div>
                                    <span className="ml-3 text-sm text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                                        Tôi đã đọc kỹ, hiểu rõ và đồng ý với toàn bộ <strong>Chính sách và Quy định dành cho Mentor</strong> của HR Companion.
                                    </span>
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                {/* Continue Button */}
                                <button
                                    onClick={handleContinue}
                                    disabled={!acceptedTerms}
                                    className="flex items-center gap-3 px-8 py-4 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Đồng ý và tiếp tục
                                    <ArrowRight className="w-5 h-5" />
                                </button>

                                {/* Back Button */}
                                <button
                                    onClick={handleBack}
                                    className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                                >
                                    <X className="w-4 h-4" />
                                    Quay lại chọn vai trò
                                </button>
                            </div>

                            {/* Info Box */}
                            <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-white text-xs font-bold">ℹ</span>
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-emerald-800 font-medium mb-1">
                                            Quan trọng
                                        </p>
                                        <p className="text-emerald-700 text-xs leading-relaxed">
                                            Bằng việc đồng ý với các điều khoản này, bạn cam kết tuân thủ các quy định và
                                            thực hiện đầy đủ nghĩa vụ của một Mentor trong hệ thống HR Companion.
                                            Sau khi đăng ký, chúng tôi sẽ xem xét hồ sơ và phản hồi trong vòng 3-5 ngày làm việc.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-6">
                            <p className="text-xs text-gray-500">
                                Nếu có thắc mắc về các điều khoản, vui lòng liên hệ{' '}
                                <a href="mailto:support@hrcompanion.com" className="text-emerald-600 hover:text-emerald-700 font-medium">
                                    support@hrcompanion.com
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}