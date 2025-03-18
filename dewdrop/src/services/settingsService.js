import { supabase } from '../lib/supabaseClient';

export const settingsService = {
    // Default settings
    DEFAULT_SETTINGS: {
        new_cards_per_day: 10
    },

    // Get user settings, creating default if none exist
    async getUserSettings() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return this.DEFAULT_SETTINGS;

        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error || !data) {
            // Create default settings if none exist
            await this.updateUserSettings(this.DEFAULT_SETTINGS);
            return this.DEFAULT_SETTINGS;
        }

        return data;
    },

    // Update user settings
    async updateUserSettings(settings) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('User must be logged in');

        const { data, error } = await supabase
            .from('user_settings')
            .upsert({
                id: session.user.id,
                ...settings,
                updated_at: new Date()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
