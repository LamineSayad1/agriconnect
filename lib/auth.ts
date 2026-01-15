import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

/**
 * Centrally handle the logout process to avoid race conditions 
 * and ensure all storage/sessions are cleared before navigation.
 */
export const handleGlobalLogout = async (navigateToLogin: () => void) => {
    console.log("[Auth] Starting Global Logout...");

    // Navigate first to ensure UI responds immediately
    navigateToLogin();

    try {
        // Then clean up in background
        await supabase.auth.signOut();
        await AsyncStorage.removeItem('user_session');
        console.log("[Auth] Session cleared successfully");
    } catch (error) {
        console.error("[Auth] Error during logout:", error);
    }
};
