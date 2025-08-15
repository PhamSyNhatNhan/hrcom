import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    console.log('🔥 MIDDLEWARE RUNNING:', request.nextUrl.pathname)

    let supabaseResponse = NextResponse.next({
        request: {
            headers: request.headers,
        },
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
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const pathname = request.nextUrl.pathname
    const isAdminRoute = pathname.startsWith('/admin')
    const isMentorRoute = pathname.startsWith('/mentor_page')

    console.log('Middleware check:', {
        pathname,
        isAdminRoute,
        isMentorRoute
    })

    // ✅ CHỈ KIỂM TRA KHI TRUY CẬP PROTECTED ROUTES
    if (isAdminRoute || isMentorRoute) {
        try {
            // ✅ LẤY USER TỪ SUPABASE
            const {
                data: { user },
                error
            } = await supabase.auth.getUser()

            console.log('User check for protected route:', {
                hasUser: !!user,
                error: !!error,
                userId: user?.id,
                emailConfirmed: user?.email_confirmed_at ? 'Yes' : 'No'
            })

            // ✅ CHƯA ĐĂNG NHẬP - REDIRECT ĐẾN LOGIN
            if (!user || error) {
                console.log('❌ No authenticated user - blocking protected route')
                const url = request.nextUrl.clone()
                url.pathname = '/auth/login'
                url.searchParams.set('redirectTo', pathname)
                return NextResponse.redirect(url)
            }

            // ✅ EMAIL CHƯA XÁC NHẬN - REDIRECT ĐẾN VERIFY-OTP
            if (!user.email_confirmed_at) {
                console.log('⚠️ User logged in but email not verified - blocking protected route')
                const url = request.nextUrl.clone()
                url.pathname = '/auth/verify-otp'
                url.searchParams.set('email', user.email || '')
                url.searchParams.set('type', 'verification')
                return NextResponse.redirect(url)
            }

            // ✅ LẤY ROLE VÀ KIỂM TRA QUYỀN TRUY CẬP
            const userRole = user.user_metadata?.role || 'user'
            console.log('✅ User authenticated and verified:', {
                email: user.email,
                role: userRole
            })

            // ✅ KIỂM TRA QUYỀN TRUY CẬP ADMIN
            if (isAdminRoute) {
                if (userRole !== 'admin' && userRole !== 'superadmin') {
                    console.log(`❌ Access denied: User role '${userRole}' insufficient for admin route`)
                    const url = request.nextUrl.clone()
                    url.pathname = '/'
                    url.searchParams.set('error', 'insufficient_permissions')
                    return NextResponse.redirect(url)
                }
                console.log('✅ Admin access granted for role:', userRole)
            }

            // ✅ KIỂM TRA QUYỀN TRUY CẬP MENTOR
            if (isMentorRoute) {
                if (userRole !== 'mentor' && userRole !== 'admin' && userRole !== 'superadmin') {
                    console.log(`❌ Access denied: User role '${userRole}' insufficient for mentor route`)
                    const url = request.nextUrl.clone()
                    url.pathname = '/'
                    url.searchParams.set('error', 'insufficient_permissions')
                    return NextResponse.redirect(url)
                }
                console.log('✅ Mentor access granted for role:', userRole)
            }

        } catch (error) {
            console.error('❌ Middleware error on protected route:', error)
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            url.searchParams.set('error', 'auth_error')
            return NextResponse.redirect(url)
        }
    }

    // ✅ CHO PHÉP TẤT CẢ ROUTES KHÁC (AUTH, PUBLIC, ONBOARDING, v.v.)
    console.log('✅ Access granted to:', pathname)
    return supabaseResponse
}