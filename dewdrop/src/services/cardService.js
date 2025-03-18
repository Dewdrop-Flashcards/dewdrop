import { supabase } from '../lib/supabaseClient';
import { storageService } from './storageService';

// SM-2 algorithm constants
const MIN_EASE_FACTOR = 1.3;
const EASE_FACTOR_MODIFY = 0.15;
const INITIAL_INTERVAL = 1; // days

export const cardService = {
    // Get all cards for a specific deck (or all decks if deckId is null)
    async getCardsByDeckId(deckId) {
        let query = supabase
            .from('cards')
            .select('*');

        // Only filter by deck_id if a valid deckId is provided
        if (deckId !== null && deckId !== undefined) {
            query = query.eq('deck_id', deckId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get a specific card by ID
    async getCardById(cardId) {
        const { data, error } = await supabase
            .from('cards')
            .select('*')
            .eq('id', cardId)
            .single();

        if (error) throw error;
        return data;
    },

    // Get cards due for review
    async getDueCards(deckId = null) {
        let query = supabase
            .from('cards')
            .select('*')
            .lte('next_review_date', new Date().toISOString());

        // If deckId is provided, filter by deck
        if (deckId) {
            query = query.eq('deck_id', deckId);
        }

        const { data, error } = await query.order('next_review_date', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Get new cards (never reviewed, review_count = 0)
    async getNewCards(deckId = null) {
        let query = supabase
            .from('cards')
            .select('*')
            .eq('review_count', 0);

        // If deckId is provided, filter by deck
        if (deckId) {
            query = query.eq('deck_id', deckId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Create a new card
    async createCard(card, frontImageFile = null, backImageFile = null) {
        // Handle image uploads if provided
        let frontImageUrl = null;
        let backImageUrl = null;

        if (frontImageFile) {
            frontImageUrl = await storageService.uploadCardImage(frontImageFile, card.user_id);
        }

        if (backImageFile) {
            backImageUrl = await storageService.uploadCardImage(backImageFile, card.user_id);
        }

        // Ensure we have the required next_review_date field
        const cardWithDefaults = {
            ...card,
            front_image_url: frontImageUrl,
            back_image_url: backImageUrl,
            next_review_date: card.next_review_date || new Date().toISOString(),
            interval: card.interval || 0,
            ease_factor: card.ease_factor || 2.5,
            review_count: card.review_count || 0,
            success_rate: card.success_rate || 0
        };

        const { data, error } = await supabase
            .from('cards')
            .insert(cardWithDefaults)
            .select()
            .single();

        if (error) {
            // Clean up uploaded images if there was an error
            if (frontImageUrl) await storageService.deleteCardImage(frontImageUrl);
            if (backImageUrl) await storageService.deleteCardImage(backImageUrl);
            throw error;
        }

        return data;
    },

    // Update an existing card
    async updateCard(cardId, updates, frontImageFile = null, backImageFile = null) {
        // Get the current card to check for existing images
        const currentCard = await this.getCardById(cardId);
        const updatedCard = { ...updates };

        // Handle front image if provided or requested to remove
        if (frontImageFile) {
            // Upload new image and get URL
            updatedCard.front_image_url = await storageService.uploadCardImage(
                frontImageFile,
                updates.user_id || currentCard.user_id,
                currentCard.front_image_url
            );
        } else if (updates.front_image_url === null && currentCard.front_image_url) {
            // User requested to remove the front image
            await storageService.deleteCardImage(currentCard.front_image_url);
            updatedCard.front_image_url = null;
        }

        // Handle back image if provided or requested to remove
        if (backImageFile) {
            // Upload new image and get URL
            updatedCard.back_image_url = await storageService.uploadCardImage(
                backImageFile,
                updates.user_id || currentCard.user_id,
                currentCard.back_image_url
            );
        } else if (updates.back_image_url === null && currentCard.back_image_url) {
            // User requested to remove the back image
            await storageService.deleteCardImage(currentCard.back_image_url);
            updatedCard.back_image_url = null;
        }

        // Update the card in the database
        const { data, error } = await supabase
            .from('cards')
            .update(updatedCard)
            .eq('id', cardId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete a card
    async deleteCard(cardId) {
        // Get the card to access image URLs before deletion
        const card = await this.getCardById(cardId);

        // Delete the card from the database
        const { error } = await supabase
            .from('cards')
            .delete()
            .eq('id', cardId);

        if (error) throw error;

        // Clean up associated images
        if (card.front_image_url) {
            await storageService.deleteCardImage(card.front_image_url);
        }

        if (card.back_image_url) {
            await storageService.deleteCardImage(card.back_image_url);
        }

        return true;
    },

    // Record a review and update card scheduling
    async recordReview(cardId, performanceScore, timeTaken) {
        // First, get the current card data
        const { data: card, error: cardError } = await supabase
            .from('cards')
            .select('*')
            .eq('id', cardId)
            .single();

        if (cardError) throw cardError;

        // Record the review
        const reviewData = {
            card_id: cardId,
            performance_score: performanceScore,
            time_taken: timeTaken,
            success: performanceScore >= 3, // 0-2 is fail, 3-5 is success
            user_id: card.user_id // Include the user_id for RLS
        };

        const { error: reviewError } = await supabase
            .from('reviews')
            .insert(reviewData);

        if (reviewError) throw reviewError;

        // Calculate new scheduling parameters using SM-2 algorithm
        const newValues = this.calculateNextReview(card, performanceScore);

        // Update the card with new scheduling values
        const { error: updateError } = await supabase
            .from('cards')
            .update({
                next_review_date: newValues.nextReviewDate,
                ease_factor: newValues.easeFactor,
                interval: newValues.interval,
                review_count: card.review_count + 1,
                success_rate: ((card.success_rate * card.review_count) + (performanceScore >= 3 ? 1 : 0)) / (card.review_count + 1)
            })
            .eq('id', cardId);

        if (updateError) throw updateError;

        return true;
    },

    // Calculate next review date using SM-2 algorithm
    calculateNextReview(card, performanceScore) {
        let { ease_factor, interval } = card;
        let newInterval;
        let newEaseFactor = ease_factor;

        // Calculate new ease factor based on performance
        newEaseFactor = Math.max(
            MIN_EASE_FACTOR,
            ease_factor + (0.1 - (5 - performanceScore) * (0.08 + (5 - performanceScore) * 0.02))
        );

        // Calculate new interval based on performance
        if (performanceScore < 3) {
            // If failed, reset interval to 1 day
            newInterval = INITIAL_INTERVAL;
        } else {
            // If first successful review
            if (interval === 0) {
                newInterval = INITIAL_INTERVAL;
            }
            // Second successful review
            else if (interval === 1) {
                newInterval = 6;
            }
            // Later successful reviews
            else {
                newInterval = Math.round(interval * newEaseFactor);
            }
        }

        // Calculate next review date
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

        return {
            nextReviewDate: nextReviewDate.toISOString(),
            easeFactor: newEaseFactor,
            interval: newInterval
        };
    }
};
