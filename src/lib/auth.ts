// src/lib/auth.ts
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/utils/supabase/client';
import type { AuthUser, AuthResponse } from '@/types/auth_user';

export const signInWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    try {
        console.log('🔐 Attempting sign in for:', email);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            console.error('❌ Login error:', error.message);
            throw error
        }

        if (data.user) {
            console.log('✅ User authenticated:', data.user.id);
            console.log('📧 Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');

            // ✅ LẤY ROLE TỪ USER_METADATA
            const userRole = data.user.user_metadata?.role || 'user'
            console.log('👥 User role:', userRole);

            // Thử lấy profile từ database
            let profile = null
            try {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single()

                if (!profileError && profileData) {
                    profile = profileData
                    console.log('👤 Profile loaded:', profile.full_name)
                } else {
                    console.log('⚠️ No profile found in database')
                }
            } catch (profileError) {
                console.warn('⚠️ Profile fetch failed:', profileError)
            }

            const user: AuthUser = {
                id: data.user.id,
                email: data.user.email!,
                role: userRole as 'user' | 'mentor' | 'admin' | 'superadmin',
                profile: profile || undefined,
            }

            // ✅ CẬP NHẬT ZUSTAND STORE
            useAuthStore.getState().setUser(user as any)

            // ✅ KIỂM TRA EMAIL VERIFICATION
            if (!data.user.email_confirmed_at) {
                console.log('⚠️ Email not verified - middleware will redirect to OTP')
                return {
                    user,
                    error: null,
                    needsVerification: true
                }
            }

            console.log('✅ Login successful - user verified')
            return { user, error: null }
        }

        return { user: null, error: null }
    } catch (error: unknown) {
        console.error('❌ signInWithEmail error:', error)
        if (error instanceof Error) {
            return { user: null, error: error.message }
        }
        return { user: null, error: 'Đã xảy ra lỗi không xác định' }
    }
}

export const getCurrentUser = async (): Promise<AuthResponse> => {
    try {
        console.log('🔍 Getting current user...');

        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            console.error('❌ getCurrentUser auth error:', error)
            throw error
        }

        if (user) {
            console.log('✅ Current user found:', user.id)
            console.log('📧 Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No')

            // ✅ LẤY ROLE TỪ USER_METADATA
            const userRole = user.user_metadata?.role || 'user'
            console.log('👥 User role:', userRole)

            // Thử lấy profile từ database
            let profile = null
            try {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (!profileError && profileData) {
                    profile = profileData
                    console.log('👤 Profile loaded:', profile.full_name)
                } else {
                    console.log('⚠️ No profile found')
                }
            } catch (profileError) {
                console.warn('⚠️ Profile fetch failed:', profileError)
            }

            const userWithProfile: AuthUser = {
                id: user.id,
                email: user.email!,
                role: userRole as 'user' | 'mentor' | 'admin' | 'superadmin',
                profile: profile || undefined,
            }

            // ✅ CẬP NHẬT ZUSTAND STORE
            useAuthStore.getState().setUser(userWithProfile as any)
            return { user: userWithProfile, error: null }
        }

        console.log('❌ No user found')
        useAuthStore.getState().setUser(null)
        return { user: null, error: null }
    } catch (error: unknown) {
        console.error('❌ getCurrentUser error:', error)
        useAuthStore.getState().setUser(null)
        if (error instanceof Error) {
            return { user: null, error: error.message }
        }
        return { user: null, error: 'Đã xảy ra lỗi không xác định' }
    }
}

export const signOut = async () => {
    try {
        console.log('🚪 Signing out user...');

        const { error } = await supabase.auth.signOut()
        if (error) {
            console.error('❌ Sign out error:', error);
            throw error
        }

        console.log('✅ Sign out successful');
        useAuthStore.getState().logout()
        return { error: null }
    } catch (error: unknown) {
        console.error('❌ signOut error:', error)
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: 'Đã xảy ra lỗi không xác định' }
    }
}

// ✅ HELPER FUNCTION KIỂM TRA ROLE (CLIENT-SIDE)
export const hasRole = (userRole: string, requiredRole: string | string[]): boolean => {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

    // Define role hierarchy
    const roleHierarchy: Record<string, number> = {
        'user': 1,
        'mentor': 2,
        'admin': 3,
        'superadmin': 4
    }

    const userLevel = roleHierarchy[userRole] || 0

    return roles.some(role => {
        const requiredLevel = roleHierarchy[role] || 0
        return userLevel >= requiredLevel
    })
}

// ✅ HELPER FUNCTION LẤY USER TỪ STORE
export const getUserFromStore = (): AuthUser | null => {
    return useAuthStore.getState().user
}

// ✅ HELPER FUNCTION KIỂM TRA USER CÓ ĐĂNG NHẬP VÀ VERIFY
export const isUserAuthenticated = (): boolean => {
    const user = getUserFromStore()
    return !!user
}

// ✅ HELPER FUNCTION KIỂM TRA QUYỀN TRUY CẬP
export const canAccessRoute = (routeType: 'admin' | 'mentor' | 'public'): boolean => {
    const user = getUserFromStore()

    if (!user) return routeType === 'public'

    switch (routeType) {
        case 'admin':
            return hasRole(user.role, ['admin', 'superadmin'])
        case 'mentor':
            return hasRole(user.role, ['mentor', 'admin', 'superadmin'])
        case 'public':
            return true
        default:
            return false
    }
}

// ✅ FUNCTION HỖ TRỢ DEBUG AUTH STATE
export const debugAuthState = async () => {
    console.log('🔍 ==> DEBUG AUTH STATE <==');

    try {
        // Check Supabase session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('🔑 Supabase Session:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            emailConfirmed: session?.user?.email_confirmed_at ? 'Yes' : 'No',
            error: sessionError?.message
        });

        // Check Zustand store
        const storeUser = getUserFromStore()
        console.log('🗄️ Zustand Store:', {
            hasUser: !!storeUser,
            userId: storeUser?.id,
            userEmail: storeUser?.email,
            userRole: storeUser?.role
        });

        // Check if they match
        if (session?.user && storeUser) {
            console.log('✅ Session and Store Match:', session.user.id === storeUser.id);
        }

    } catch (error) {
        console.error('❌ Debug error:', error);
    }

    console.log('🔍 ==> END DEBUG <==');
}