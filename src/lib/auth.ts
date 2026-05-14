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
            redirectTo: `${window.location.origin}/dashboard`,
        },
    });

    if (error) throw error;
}
