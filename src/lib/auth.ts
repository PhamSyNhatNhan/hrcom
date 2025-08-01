import { createClient } from '@/utils/supabase/client'
import { useAuthStore } from '@/stores/authStore'

export const signInWithEmail = async (email: string, password: string) => {
    const supabase = createClient()

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            console.error('Login error:', error)
            throw error
        }

        if (data.user) {
            console.log('✅ User logged in:', data.user.id)

            // Lấy role từ user metadata
            const userRole = data.user.user_metadata?.role || 'user'

            // Thử lấy profile - KHÔNG tạo mới nếu không có
            let profile = null

            try {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single()

                profile = profileData
                console.log('Profile:', profile ? '✅ Found' : '❌ Not found')
            } catch (profileError) {
                console.warn('Profile fetch failed:', profileError)
            }

            const user = {
                id: data.user.id,
                email: data.user.email!,
                role: userRole,
                profile: profile || undefined,
            }

            useAuthStore.getState().setUser(user)
            return { user, error: null }
        }

        return { user: null, error: null }
    } catch (error: unknown) {
        console.error('signInWithEmail error:', error)
        if (error instanceof Error) {
            return { user: null, error: error.message }
        }
        return { user: null, error: 'Đã xảy ra lỗi không xác định' }
    }
}

export const resetPasswordForEmail = async (email: string) => {
    const supabase = createClient()

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        })

        if (error) {
            console.error('Reset password error:', error)
            throw error
        }

        return { error: null }
    } catch (error: unknown) {
        console.error('resetPasswordForEmail error:', error)
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: 'Đã xảy ra lỗi không xác định' }
    }
}

export const updatePassword = async (newPassword: string) => {
    const supabase = createClient()

    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        })

        if (error) {
            console.error('Update password error:', error)
            throw error
        }

        return { error: null }
    } catch (error: unknown) {
        console.error('updatePassword error:', error)
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: 'Đã xảy ra lỗi không xác định' }
    }
}

export const verifyOtp = async (email: string, token: string, type: 'recovery' | 'email' = 'recovery') => {
    const supabase = createClient()

    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type
        })

        if (error) {
            console.error('Verify OTP error:', error)
            throw error
        }

        return { data, error: null }
    } catch (error: unknown) {
        console.error('verifyOtp error:', error)
        if (error instanceof Error) {
            return { data: null, error: error.message }
        }
        return { data: null, error: 'Đã xảy ra lỗi không xác định' }
    }
}

export const resendConfirmation = async (email: string) => {
    const supabase = createClient()

    try {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/login`
            }
        })

        if (error) {
            console.error('Resend confirmation error:', error)
            throw error
        }

        return { error: null }
    } catch (error: unknown) {
        console.error('resendConfirmation error:', error)
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: 'Đã xảy ra lỗi không xác định' }
    }
}

export const getCurrentUser = async () => {
    const supabase = createClient()

    try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            console.error('getCurrentUser auth error:', error)
            throw error
        }

        if (user) {
            console.log('✅ Current user found:', user.id)

            // Lấy role từ user metadata
            const userRole = user.user_metadata?.role || 'user'

            // Thử lấy profile - KHÔNG tạo mới nếu không có
            let profile = null

            try {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                profile = profileData
                console.log('Profile:', profile ? '✅ Found' : '❌ Not found')
            } catch (profileError) {
                console.warn('Profile fetch failed:', profileError)
            }

            const userWithProfile = {
                id: user.id,
                email: user.email!,
                role: userRole,
                profile: profile || undefined,
            }

            useAuthStore.getState().setUser(userWithProfile)
            return { user: userWithProfile, error: null }
        }

        console.log('❌ No user found')
        useAuthStore.getState().setUser(null)
        return { user: null, error: null }
    } catch (error: unknown) {
        console.error('getCurrentUser error:', error)
        useAuthStore.getState().setUser(null)
        if (error instanceof Error) {
            return { user: null, error: error.message }
        }
        return { user: null, error: 'Đã xảy ra lỗi không xác định' }
    }
}

export const signOut = async () => {
    const supabase = createClient()

    try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error

        useAuthStore.getState().logout()
        return { error: null }
    } catch (error: unknown) {
        console.error('signOut error:', error)
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: 'Đã xảy ra lỗi không xác định' }
    }
}

// Utility function to get auth session
export const getSession = async () => {
    const supabase = createClient()

    try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
            console.error('Get session error:', error)
            return { session: null, error: error.message }
        }

        return { session, error: null }
    } catch (error: unknown) {
        console.error('getSession error:', error)
        if (error instanceof Error) {
            return { session: null, error: error.message }
        }
        return { session: null, error: 'Đã xảy ra lỗi không xác định' }
    }
}


// Auth error helper
export const getAuthErrorMessage = (error: string): string => {
    switch (error) {
        case 'Invalid login credentials':
            return 'Email hoặc mật khẩu không chính xác'
        case 'Email not confirmed':
            return 'Email chưa được xác thực. Vui lòng kiểm tra email và xác thực tài khoản.'
        case 'User not found':
            return 'Không tìm thấy tài khoản với email này'
        case 'Invalid email':
            return 'Địa chỉ email không hợp lệ'
        case 'Password should be at least 6 characters':
            return 'Mật khẩu phải có ít nhất 6 ký tự'
        case 'New password should be different from the old password':
            return 'Mật khẩu mới phải khác với mật khẩu cũ'
        case 'Token has expired or is invalid':
            return 'Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ'
        case 'Signup requires a valid password':
            return 'Vui lòng nhập mật khẩu hợp lệ'
        case 'User already registered':
            return 'Email này đã được đăng ký'
        case 'Email rate limit exceeded':
            return 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.'
        case 'Invalid recovery token':
            return 'Mã khôi phục không hợp lệ'
        case 'Email link is invalid or has expired':
            return 'Link email không hợp lệ hoặc đã hết hạn'
        default:
            return error || 'Đã xảy ra lỗi không xác định'
    }
}