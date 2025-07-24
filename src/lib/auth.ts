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
            throw error
        }

        if (data.user) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single()

            if (profileError) {
                console.error('Error fetching profile:', profileError)
            }

            const user = {
                id: data.user.id,
                email: data.user.email!,
                role: data.user.user_metadata?.role || 'user',
                profile: profile || undefined,
            }

            useAuthStore.getState().setUser(user)

            return { user, error: null }
        }

        return { user: null, error: null }
    } catch (error: unknown) {
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
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: 'Đã xảy ra lỗi không xác định' }
    }
}

export const getCurrentUser = async () => {
    const supabase = createClient()

    try {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser()

        if (error) throw error

        if (user) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            const userWithProfile = {
                id: user.id,
                email: user.email!,
                role: user.user_metadata?.role || 'user',
                profile: profile || undefined,
            }

            useAuthStore.getState().setUser(userWithProfile)
            return { user: userWithProfile, error: null }
        }

        return { user: null, error: null }
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { user: null, error: error.message }
        }
        return { user: null, error: 'Đã xảy ra lỗi không xác định' }
    }
}
