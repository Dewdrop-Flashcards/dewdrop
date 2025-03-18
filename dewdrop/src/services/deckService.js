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
        if (!deckId) {
            console.error('updateDeck called with undefined deckId');
            throw new Error('Deck ID is required for updating a deck');
        }

        console.log(`Updating deck with ID: ${deckId}`, updates);

        const { data, error } = await supabase
            .from('decks')
            .update(updates)
            .eq('id', deckId)
            .select()
            .single();

        if (error) {
            console.error('Error updating deck:', error);
            throw error;
        }

        return data;
    },

    // Delete a deck and all its associated cards
    async deleteDeck(deckId) {
        // Call the delete_deck_and_cards function
        const { data, error } = await supabase.rpc('delete_deck_and_cards', {
            input_deck_id: deckId
        });

        if (error) {
            console.error('Error deleting deck and cards:', error);
            throw error;
        }

        return data;
    }
};
