import { supabase } from '../lib/supabaseClient';

export const statisticsService = {
    // Get overall review statistics
    async getOverallStats() {
        try {
            // Fetch all reviews in a single query
            const { data, error } = await supabase
                .from('reviews')
                .select('id, card_id, success, performance_score, time_taken');

            if (error) {
                console.error('Error fetching overall stats:', error);
                throw error;
            }
            console.log(data, error)

            if (!data || data.length === 0) {
                return {
                    totalReviews: 0,
                    successRate: 0,
                    uniqueCardsReviewed: 0,
                    totalStudyTime: 0
                };
            }

            // Calculate stats from the fetched data
            const totalReviews = data.length;

            // Success rate
            const successfulReviews = data.filter(review => review.success).length;
            const successRate = (successfulReviews / totalReviews) * 100;

            // Unique cards
            const validCardIds = data
                .filter(review => review.card_id)
                .map(review => review.card_id);
            const uniqueCardsReviewed = new Set(validCardIds).size;

            // Total study time
            const totalStudyTime = data.reduce((total, review) =>
                total + (review.time_taken || 0), 0);

            return {
                totalReviews,
                successRate,
                uniqueCardsReviewed,
                totalStudyTime
            };
        } catch (error) {
            console.error('Error in getOverallStats:', error);
            return {
                totalReviews: 0,
                successRate: 0,
                uniqueCardsReviewed: 0,
                totalStudyTime: 0
            };
        }
    },

    // Get reviews by date for charts
    async getReviewsByDate(period = 'week') {
        try {
            // First fetch all reviews, then filter by date in memory
            // This avoids potential issues with date filtering in the database
            const { data: allReviews, error } = await supabase
                .from('reviews')
                .select('review_date, success, performance_score');

            if (error) {
                console.error('Error fetching reviews:', error);
                return [];
            }

            if (!allReviews || allReviews.length === 0) {
                return [];
            }

            // Calculate date range based on period
            const endDate = new Date();
            const startDate = new Date();

            switch (period) {
                case 'week':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(endDate.getMonth() - 1);
                    break;
                case 'year':
                    startDate.setFullYear(endDate.getFullYear() - 1);
                    break;
                default:
                    startDate.setDate(endDate.getDate() - 7);
            }

            // Filter reviews within date range
            const filteredReviews = allReviews.filter(review => {
                if (!review.review_date) return false;

                const reviewDate = new Date(review.review_date);
                return reviewDate >= startDate && reviewDate <= endDate;
            });

            // Sort by date
            filteredReviews.sort((a, b) =>
                new Date(a.review_date) - new Date(b.review_date)
            );

            // Process data for chart display by grouping by date
            const reviewsByDate = filteredReviews.reduce((acc, review) => {
                // Extract date part only
                const reviewDate = review.review_date.split('T')[0];

                if (!acc[reviewDate]) {
                    acc[reviewDate] = {
                        date: reviewDate,
                        total: 0,
                        successful: 0,
                        avgScore: 0,
                        totalScores: 0
                    };
                }

                acc[reviewDate].total += 1;
                if (review.success) {
                    acc[reviewDate].successful += 1;
                }

                if (review.performance_score !== null && review.performance_score !== undefined) {
                    acc[reviewDate].totalScores += review.performance_score;
                }

                // Calculate average score
                if (acc[reviewDate].total > 0) {
                    acc[reviewDate].avgScore =
                        Math.round((acc[reviewDate].totalScores / acc[reviewDate].total) * 10) / 10;
                }

                return acc;
            }, {});

            // Convert to array for easier charting
            return Object.values(reviewsByDate);
        } catch (error) {
            console.error('Error in getReviewsByDate:', error);
            return [];
        }
    },

    // Get performance distribution
    async getPerformanceDistribution() {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('performance_score');

            if (error) {
                console.error('Error fetching performance distribution:', error);
                return Array(6).fill(0);
            }

            if (!data || data.length === 0) {
                return Array(6).fill(0);
            }

            // Initialize counters for each score (0-5)
            const distribution = Array(6).fill(0);

            // Count occurrences of each score
            data.forEach(review => {
                if (review.performance_score !== null &&
                    review.performance_score !== undefined &&
                    Number.isInteger(review.performance_score) &&
                    review.performance_score >= 0 &&
                    review.performance_score <= 5) {
                    distribution[review.performance_score]++;
                }
            });

            return distribution;
        } catch (error) {
            console.error('Error in getPerformanceDistribution:', error);
            return Array(6).fill(0);
        }
    },

    // Get recent reviews
    async getRecentReviews(limit = 10) {
        try {
            // First fetch the reviews
            const { data: reviews, error: reviewsError } = await supabase
                .from('reviews')
                .select('id, performance_score, review_date, success, card_id')
                .order('review_date', { ascending: false })
                .limit(limit);

            if (reviewsError) {
                console.error('Error fetching recent reviews:', reviewsError);
                return [];
            }

            if (!reviews || reviews.length === 0) {
                return [];
            }

            // Now fetch the card details for each review
            const enhancedReviews = await Promise.all(
                reviews.map(async (review) => {
                    if (!review.card_id) {
                        return {
                            ...review,
                            cardFront: 'Unknown Card',
                            deckName: 'Unknown Deck'
                        };
                    }

                    try {
                        const { data: card, error: cardError } = await supabase
                            .from('cards')
                            .select('front_content, deck_id')
                            .eq('id', review.card_id)
                            .single();

                        if (cardError || !card) {
                            return {
                                ...review,
                                cardFront: 'Unknown Card',
                                deckName: 'Unknown Deck'
                            };
                        }

                        // Get deck name if we have a deck_id
                        let deckName = 'Unknown Deck';
                        if (card.deck_id) {
                            const { data: deck, error: deckError } = await supabase
                                .from('decks')
                                .select('name')
                                .eq('id', card.deck_id)
                                .single();

                            if (!deckError && deck) {
                                deckName = deck.name;
                            }
                        }

                        return {
                            ...review,
                            cardFront: card.front_content || 'Unknown Card',
                            deckName
                        };
                    } catch (error) {
                        console.error(`Error fetching card ${review.card_id}:`, error);
                        return {
                            ...review,
                            cardFront: 'Unknown Card',
                            deckName: 'Unknown Deck'
                        };
                    }
                })
            );

            return enhancedReviews;
        } catch (error) {
            console.error('Error in getRecentReviews:', error);
            return [];
        }
    },

    // Get deck-specific statistics
    async getDeckStats(deckId) {
        // Default empty stats
        const emptyStats = {
            totalReviews: 0,
            successRate: 0,
            averageScore: 0,
            totalTime: 0
        };

        try {
            if (!deckId) {
                console.error("getDeckStats called without a valid deckId");
                return emptyStats;
            }

            // Get reviews for cards in this deck
            const { data: deckReviews, error: deckError } = await supabase
                .from('reviews')
                .select(`
                    id,
                    success,
                    performance_score,
                    time_taken,
                    cards:card_id (
                        deck_id
                    )
                `)
                .eq('cards.deck_id', deckId);

            if (deckError) {
                console.error('Error fetching deck stats:', deckError);
                return emptyStats;
            }

            if (!deckReviews || deckReviews.length === 0) {
                return emptyStats;
            }

            // Calculate stats
            const totalReviews = deckReviews.length;
            const successfulReviews = deckReviews.filter(review => review.success).length;
            const successRate = totalReviews > 0 ? (successfulReviews / totalReviews) * 100 : 0;

            const validScores = deckReviews
                .filter(review => review.performance_score !== null &&
                    review.performance_score !== undefined)
                .map(review => review.performance_score);

            const totalScore = validScores.reduce((sum, score) => sum + score, 0);
            const averageScore = validScores.length > 0 ? totalScore / validScores.length : 0;

            const totalTime = deckReviews.reduce((sum, review) =>
                sum + (review.time_taken || 0), 0);

            return {
                totalReviews,
                successRate,
                averageScore,
                totalTime
            };
        } catch (error) {
            console.error(`Error in getDeckStats for deck ${deckId}:`, error);
            return emptyStats;
        }
    },

    // Get daily study activity for heat map
    async getStudyActivity(period = 'year') {
        try {
            // Calculate date range based on period
            const endDate = new Date();
            const startDate = new Date();

            switch (period) {
                case 'week':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(endDate.getMonth() - 1);
                    break;
                case 'year':
                    startDate.setFullYear(endDate.getFullYear() - 1);
                    break;
                default:
                    startDate.setFullYear(endDate.getFullYear() - 1);
            }

            // Fetch all reviews within the date range
            const { data: reviews, error } = await supabase
                .from('reviews')
                .select('review_date')
                .gte('review_date', startDate.toISOString())
                .lte('review_date', endDate.toISOString());

            if (error) {
                console.error('Error fetching study activity:', error);
                return [];
            }

            if (!reviews || reviews.length === 0) {
                return [];
            }

            // Group reviews by date
            const activityByDate = reviews.reduce((acc, review) => {
                // Extract date part only
                const reviewDate = review.review_date.split('T')[0];

                if (!acc[reviewDate]) {
                    acc[reviewDate] = 0;
                }

                acc[reviewDate]++;
                return acc;
            }, {});

            // Convert to array with date and count
            const activityData = Object.keys(activityByDate).map(date => ({
                date,
                count: activityByDate[date],
            }));

            return activityData;
        } catch (error) {
            console.error('Error in getStudyActivity:', error);
            return [];
        }
    }
};
