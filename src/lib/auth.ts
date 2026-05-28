/**
 * To enable Google OAuth, go to Supabase Dashboard -> Authentication ->
 * Providers -> Google -> enable it -> add your Google Client ID and Secret
 * from Google Cloud Console.
 */
import { supabase } from './supabase';

export async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    });

    if (error) throw error;
}

/**
 * Send a password-reset email via Supabase.
 * The link in the email will redirect the user to /reset-password
 * where they can choose a new password.
 */
export async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
}
