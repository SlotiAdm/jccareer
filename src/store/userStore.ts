import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  subscription_status: string;
  trial_start_date?: string;
  trial_end_date?: string;
  free_sessions_used: number;
  free_sessions_limit: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface UserProgress {
  id: string;
  user_id: string;
  total_points: number;
  proficiency_level: number;
  modules_completed: number;
  created_at: string;
  updated_at: string;
}

interface UserState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  progress: UserProgress | null;
  loading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setProgress: (progress: UserProgress | null) => void;
  setLoading: (loading: boolean) => void;
  updateProgress: (points: number) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      progress: null,
      loading: true,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setProgress: (progress) => set({ progress }),
      setLoading: (loading) => set({ loading }),
      
      updateProgress: (points) => {
        const currentProgress = get().progress;
        if (currentProgress) {
          set({
            progress: {
              ...currentProgress,
              total_points: currentProgress.total_points + points,
              proficiency_level: Math.floor((currentProgress.total_points + points) / 1000) + 1,
            }
          });
        }
      },
      
      reset: () => set({
        user: null,
        session: null,
        profile: null,
        progress: null,
        loading: false,
      }),
    }),
    {
      name: 'bussula-user-store',
      partialize: (state) => ({ 
        profile: state.profile, 
        progress: state.progress 
      }),
    }
  )
);