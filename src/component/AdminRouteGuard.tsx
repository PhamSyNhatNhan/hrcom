// components/AdminRouteGuard.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { getCurrentUser } from '@/lib/auth'

interface AdminRouteGuardProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

export default function AdminRouteGuard({
                                            children,
                                            fallback = <div>Loading...</div>
                                        }: AdminRouteGuardProps) {
    const { user, isLoading } = useAuthStore()
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        const checkAdminAccess = async () => {
            // Nếu store chưa có user, thử lấy từ Supabase
            if (!user && !isLoading) {
                await getCurrentUser()
            }

            setIsChecking(false)
        }

        checkAdminAccess()
    }, [user, isLoading])

    useEffect(() => {
        if (!isChecking && !isLoading) {
            if (!user) {
                // Chưa đăng nhập
                router.push('/auth/login')
                return
            }

            if (user.role !== 'admin' && user.role !== 'superadmin') {
                // Không có quyền admin
                router.push('/')
                return
            }
        }
    }, [user, isChecking, isLoading, router])

    // Hiển thị loading khi đang kiểm tra
    if (isChecking || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    // Hiển thị fallback nếu không có quyền
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return fallback
    }

    // Có quyền admin, hiển thị children
    return <>{children}</>
}