import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            try {
                const { data } = await supabase.auth.getSession();
                setSession(data.session);
                setUser(data.session?.user ?? null);
            } catch (error) {
                console.error('Error getting initial session:', error);
            } finally {
                setLoading(false);
            }
        };

        getInitialSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                // Set session and user data
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);

                // Handle password recovery event
                if (event === 'PASSWORD_RECOVERY') {
                    console.log('Password recovery event detected');
                    // The password recovery flow is handled in the PasswordReset component
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const value = {
        session,
        user,
        loading,
        signIn: (data) => supabase.auth.signInWithPassword(data),
        signUp: (data) => supabase.auth.signUp(data),
        signOut: () => supabase.auth.signOut(),
        signInWithGitHub: () => supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        }),
        updatePassword: async (currentPassword, newPassword) => {
            // First verify the current password by attempting to sign in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });

            // If sign-in fails, the current password is incorrect
            if (signInError) {
                return { error: { message: 'Current password is incorrect' } };
            }

            // If sign-in succeeds, update to the new password
            return supabase.auth.updateUser({ password: newPassword });
        },
        resetPassword: (email) => supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password?recovery=true`,
        }),
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
