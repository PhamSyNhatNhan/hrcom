// utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    const isAuthRoute = pathname.startsWith('/auth')
    const isAdminRoute = pathname.startsWith('/admin')
    const isHomePage = pathname === '/'

    // Nếu có user, lấy role từ metadata
    let userRole: string | null = null
    if (user) {
        userRole = user.user_metadata?.role || 'user'
    }

    // Logic phân quyền
    if (!user) {
        // Chưa đăng nhập
        if (isAdminRoute) {
            // Cố gắng truy cập admin => redirect về login
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            return NextResponse.redirect(url)
        }
        // Cho phép truy cập các route public khác
    } else {
        // Đã đăng nhập
        if (isAuthRoute && !pathname.startsWith('/auth/logout')) {
            // Đã đăng nhập nhưng cố truy cập trang auth => redirect về trang chính
            const url = request.nextUrl.clone()
            if (userRole === 'admin' || userRole === 'superadmin') {
                url.pathname = '/admin'
            } else {
                url.pathname = '/'
            }
            return NextResponse.redirect(url)
        }

        if (isAdminRoute) {
            // Kiểm tra quyền admin
            if (userRole !== 'admin' && userRole !== 'superadmin') {
                const url = request.nextUrl.clone()
                url.pathname = '/'
                return NextResponse.redirect(url)
            }
        }

        if (isHomePage && (userRole === 'admin' || userRole === 'superadmin')) {
            // Admin truy cập trang chủ => redirect về admin
            const url = request.nextUrl.clone()
            url.pathname = '/admin'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}