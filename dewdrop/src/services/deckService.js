import { supabase } from '../lib/supabaseClient';

export const deckService = {
    // Get all decks for the current user
    async getDecks() {
        const { data, error } = await supabase
            .from('decks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get a specific deck by ID
    async getDeckById(deckId) {
        const { data, error } = await supabase
            .from('decks')
            .select('*')
            .eq('id', deckId)
            .single();

        if (error) throw error;
        return data;
    },

    // Get nested decks
    async getChildDecks(parentDeckId) {
        const { data, error } = await supabase
            .from('decks')
            .select('*')
            .eq('parent_deck_id', parentDeckId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Create a new deck
    async createDeck(deck) {
        const { data, error } = await supabase
            .from('decks')
            .insert(deck)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update an existing deck
    async updateDeck(deckId, updates) {
        const { data, error } = await supabase
            .from('decks')
            .update(updates)
            .eq('id', deckId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete a deck
    async deleteDeck(deckId) {
        const { error } = await supabase
            .from('decks')
            .delete()
            .eq('id', deckId);

        if (error) throw error;
        return true;
    }
};
