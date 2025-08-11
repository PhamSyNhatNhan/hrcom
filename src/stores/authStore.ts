import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Profile {
    id: string
    full_name: string
    image_url?: string
    gender?: 'Nam' | 'Nữ' | 'Khác'
    birthdate?: string
    created_at: string
    updated_at: string
}

export interface User {
    id: string
    email: string
    role: 'user' | 'mentor' | 'admin' | 'superadmin'
    profile?: Profile
}

interface AuthState {
    user: User | null
    isLoading: boolean
    setUser: (user: User | null) => void
    setLoading: (loading: boolean) => void
    logout: () => void
    updateProfile: (profile: Partial<Profile>) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: false,

            setUser: (user) => set({ user }),

            setLoading: (isLoading) => set({ isLoading }),

            logout: () => set({ user: null }),

            updateProfile: (profileUpdate) => {
                const currentUser = get().user
                if (currentUser?.profile) {
                    set({
                        user: {
                            ...currentUser,
                            profile: {
                                ...currentUser.profile,
                                ...profileUpdate
                            }
                        }
                    })
                }
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user })
        }
    )
)