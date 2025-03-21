import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cardService } from '../../services/cardService';
import { deckService } from '../../services/deckService';
import { settingsService } from '../../services/settingsService';
import ReviewCard from './ReviewCard';

export default function StudySession() {
    const { deckId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deck, setDeck] = useState(null);
    const [cards, setCards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [failedCards, setFailedCards] = useState([]);
    const [reviewingFailedCards, setReviewingFailedCards] = useState(false);
    const [sessionStats, setSessionStats] = useState({
        total: 0,
        correct: 0,
        incorrect: 0,
        completed: false
    });
    const [cramMode, setCramMode] = useState(false);
    const [newCardsRemaining, setNewCardsRemaining] = useState(0);
    const [reviewCardsRemaining, setReviewCardsRemaining] = useState(0);

    // Store deck labels in a map: deck_id -> {frontLabel, backLabel}
    const [deckLabelsMap, setDeckLabelsMap] = useState({});

    // Load the custom front/back labels for the current deck (if specified)
    useEffect(() => {
        async function loadMainDeckLabels() {
            if (deckId) {
                try {
                    const deckData = await deckService.getDeckById(deckId);

                    if (deckData) {
                        // Add the main deck's labels to the map
                        setDeckLabelsMap(prev => ({
                            ...prev,
                            [deckId]: {
                                frontLabel: deckData.front_label || 'Question',
                                backLabel: deckData.back_label || 'Answer'
                            }
                        }));
                    }
                } catch (err) {
                    console.error("Error loading deck data:", err);
                }
            }
        }

        loadMainDeckLabels();
    }, [deckId]);

    // Load labels for all decks represented in the cards
    useEffect(() => {
        async function loadDeckLabelsForCards() {
            if (cards.length > 0) {
                try {
                    // Get unique deck IDs from the cards
                    const uniqueDeckIds = [...new Set(cards.map(card => card.deck_id))];

                    // Fetch deck info for each unique deck ID
                    const deckLabels = { ...deckLabelsMap };

                    // Process each deck only if we don't already have its labels
                    for (const deckId of uniqueDeckIds) {
                        if (!deckLabelsMap[deckId]) {
                            const deckData = await deckService.getDeckById(deckId);
                            if (deckData) {
                                deckLabels[deckId] = {
                                    frontLabel: deckData.front_label || 'Question',
                                    backLabel: deckData.back_label || 'Answer'
                                };
                            }
                        }
                    }

                    // Update the deck labels map with all labels
                    setDeckLabelsMap(deckLabels);
                } catch (err) {
                    console.error("Error loading deck labels for cards:", err);
                }
            }
        }

        loadDeckLabelsForCards();
    }, [cards, deckLabelsMap]);

    // Load initial card data
    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);

                // Load user settings first
                const userSettings = await settingsService.getUserSettings();

                // Update card service with user's preference
                cardService.setNewCardsPerDay(userSettings.new_cards_per_day);

                // Load deck information if deckId is provided
                if (deckId) {
                    const deckData = await deckService.getDeckById(deckId);
                    setDeck(deckData);
                }

                // Get the daily new card limit and how many have been shown today
                const newCardsShown = deckId
                    ? cardService.getNewCardsShownToday(deckId)
                    : cardService.getNewCardsShownToday();

                const newCardLimit = cardService.NEW_CARDS_PER_DAY;
                const remaining = Math.max(0, newCardLimit - newCardsShown);

                // Load cards for review, combining due cards and new cards with a limit
                const cardsData = deckId
                    ? await cardService.getCardsForStudy(deckId)
                    : await cardService.getCardsForStudy();

                setNewCardsRemaining(cardsData.newCards.length);
                setReviewCardsRemaining(cardsData.reviewCards.length);

                if (cardsData.combinedCards.length === 0) {
                    setCards([]);
                } else {
                    setCards(cardsData.combinedCards);
                    setSessionStats(prev => ({
                        ...prev,
                        total: cardsData.combinedCards.length
                    }));
                }
            } catch (err) {
                console.error('Error loading study session:', err);
                setError('Failed to load study cards. Please try again later.');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [deckId]);

    const handleToggleCramMode = async () => {
        try {
            setLoading(true);
            setCramMode(!cramMode);

            // If turning on cram mode, load all cards regardless of due date and limits
            if (!cramMode) {
                const allCards = deckId
                    ? await cardService.getCardsByDeckId(deckId)
                    : await cardService.getCardsByDeckId(null);

                setCards(allCards);
                setSessionStats(prev => ({
                    ...prev,
                    total: allCards.length
                }));
            } else {
                // If turning off cram mode, load only due cards respecting new card limits
                const studyCards = deckId
                    ? await cardService.getCardsForStudy(deckId)
                    : await cardService.getCardsForStudy();

                setCards(studyCards);
                setSessionStats(prev => ({
                    ...prev,
                    total: studyCards.length
                }));
            }
        } catch (err) {
            console.error('Error toggling cram mode:', err);
            setError('Failed to load cards. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCardRated = async (cardId, performanceScore) => {
        try {
            // Get the current card to check if it's new
            const currentCard = cards[currentCardIndex];
            const isNewCard = currentCard.review_count === 0;

            // Record the review
            const timeTaken = 0; // Would need to add timing functionality
            await cardService.recordReview(cardId, performanceScore, timeTaken);

            // Update the appropriate counter
            if (!cramMode) {
                if (isNewCard) {
                    cardService.incrementNewCardsShownToday(deckId);
                    setNewCardsRemaining(prev => Math.max(0, prev - 1));
                } else {
                    setReviewCardsRemaining(prev => Math.max(0, prev - 1));
                }
            }

            // Update stats
            setSessionStats(prev => ({
                ...prev,
                correct: performanceScore >= 3 ? prev.correct + 1 : prev.correct,
                incorrect: performanceScore < 3 ? prev.incorrect + 1 : prev.incorrect
            }));

            // If failed (score = 0), add to failedCards for later review
            if (performanceScore === 0) {
                const currentCard = cards[currentCardIndex];
                // Add to failedCards if not already there
                setFailedCards(prev => {
                    if (!prev.some(card => card.id === currentCard.id)) {
                        return [...prev, currentCard];
                    }
                    return prev;
                });
            }

            // Move to the next card or process failedCards or complete the session
            if (currentCardIndex < cards.length - 1) {
                setCurrentCardIndex(currentCardIndex + 1);
            } else if (failedCards.length > 0) {
                // If we've reached the end but have failed cards, process them
                const failedCardsCopy = [...failedCards];
                setFailedCards([]); // Clear failed cards as we're about to add them

                // Get the current length before updating cards
                const startReviewingAtIndex = cards.length;

                // Update the cards array with failed cards
                setCards(prevCards => [...prevCards, ...failedCardsCopy]);

                // Set the current index to the start of the failed cards section
                setCurrentCardIndex(startReviewingAtIndex);

                // Mark that we're now reviewing failed cards
                setReviewingFailedCards(true);
            } else {
                setSessionStats(prev => ({
                    ...prev,
                    completed: true
                }));
                setReviewingFailedCards(false);
            }
        } catch (err) {
            console.error('Error recording review:', err);
            setError('Failed to record your answer. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-3 sm:p-4">
                <div className="text-center py-8 sm:py-10 bg-green-50 rounded-lg">
                    <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-2">All caught up!</h2>
                    <p className="text-green-600 mb-4 sm:mb-6">You have no cards due for review right now.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
                        <button
                            onClick={handleToggleCramMode}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm sm:text-base"
                        >
                            Study Anyway (Cram Mode)
                        </button>
                        <button
                            onClick={() => navigate(deckId ? `/decks/${deckId}` : '/decks')}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded text-sm sm:text-base"
                        >
                            Back to {deckId ? 'Deck' : 'Decks'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (sessionStats.completed) {
        return (
            <div className="max-w-4xl mx-auto p-3 sm:p-4">
                <div className="text-center py-8 sm:py-10 bg-blue-50 rounded-lg">
                    <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-2">Session Complete!</h2>
                    <div className="max-w-md mx-auto px-3 sm:px-0">
                        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
                            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-800">{sessionStats.total}</p>
                                    <p className="text-xs sm:text-sm text-gray-500">Total Cards</p>
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-green-600">{sessionStats.correct}</p>
                                    <p className="text-xs sm:text-sm text-gray-500">Correct</p>
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-red-600">{sessionStats.incorrect}</p>
                                    <p className="text-xs sm:text-sm text-gray-500">Incorrect</p>
                                </div>
                            </div>
                            <div className="mt-4 sm:mt-6">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${(sessionStats.correct / sessionStats.total) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="mt-2 text-xs sm:text-sm text-gray-600">
                                    Success rate: {Math.round((sessionStats.correct / sessionStats.total) * 100)}%
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                            <button
                                onClick={() => {
                                    setCurrentCardIndex(0);
                                    setSessionStats({
                                        total: cards.length,
                                        correct: 0,
                                        incorrect: 0,
                                        completed: false
                                    });
                                }}
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm sm:text-base"
                            >
                                Study Again
                            </button>
                            <button
                                onClick={() => navigate(deckId ? `/decks/${deckId}` : '/decks')}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded text-sm sm:text-base"
                            >
                                Back to {deckId ? 'Deck' : 'Decks'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentCard = cards[currentCardIndex];

    return (
        <div className="max-w-4xl mx-auto p-3 sm:p-4">
            <div className="mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                            {deck ? deck.name : 'Study Session'}
                        </h2>
                        <div className="flex flex-wrap gap-2 mt-1 sm:mt-0">
                            {cramMode && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs sm:text-sm font-medium bg-yellow-100 text-yellow-800">
                                    Cram Mode
                                </span>
                            )}
                            {!cramMode && (
                                <>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs sm:text-sm font-medium bg-blue-100 text-blue-800">
                                        {newCardsRemaining} new card{newCardsRemaining !== 1 ? 's' : ''} remaining
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs sm:text-sm font-medium bg-green-100 text-green-800">
                                        {reviewCardsRemaining} review card{reviewCardsRemaining !== 1 ? 's' : ''} remaining
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                        Card {currentCardIndex + 1} of {cards.length}
                        {failedCards.length > 0 && (
                            <span className="ml-2 text-orange-500">
                                ({failedCards.length} failed card{failedCards.length > 1 ? 's' : ''} to review)
                            </span>
                        )}
                    </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mb-3 sm:mb-4">
                    <div
                        className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentCardIndex + 1) / cards.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            <ReviewCard
                card={currentCard}
                onRate={handleCardRated}
                isReviewingFailed={reviewingFailedCards && currentCardIndex >= cards.length - failedCards.length}
                isNew={currentCard.review_count === 0}
                frontLabel={deckLabelsMap[currentCard.deck_id]?.frontLabel || 'Question'}
                backLabel={deckLabelsMap[currentCard.deck_id]?.backLabel || 'Answer'}
            />
        </div>
    );
}
