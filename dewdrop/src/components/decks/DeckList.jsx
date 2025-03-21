import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deckService } from '../../services/deckService';
import { cardService } from '../../services/cardService';

export default function DeckList() {
    const [decks, setDecks] = useState([]);
    const [deckStats, setDeckStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadDecks() {
            try {
                setLoading(true);
                const data = await deckService.getDecks();
                setDecks(data);

                // Get count of due cards for each deck
                const stats = {};
                for (const deck of data) {
                    const dueCards = await cardService.getDueCards(deck.id);
                    stats[deck.id] = {
                        dueCount: dueCards.length
                    };
                }

                setDeckStats(stats);
            } catch (err) {
                console.error('Error loading decks:', err);
                setError('Failed to load decks. Please try again later.');
            } finally {
                setLoading(false);
            }
        }

        loadDecks();
    }, []);

    async function handleDeleteDeck(deckId, e) {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this deck? This action will permanently delete the deck and all its associated cards.')) {
            return;
        }

        try {
            const result = await deckService.deleteDeck(deckId);
            if (result) {
                setDecks(decks.filter(deck => deck.id !== deckId));
                // Clear the error state if the operation was successful
                setError(null);
            } else {
                setError('Failed to delete the deck. The deck may not exist or you may not have permission to delete it.');
            }
        } catch (err) {
            console.error('Error deleting deck:', err);
            setError(`Failed to delete deck: ${err.message || 'Unknown error occurred'}. Please try again.`);
        }
    }

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

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Your Decks</h2>
                <div className="flex w-full sm:w-auto flex-wrap gap-2">
                    <Link
                        to="/decks/import"
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-3 sm:px-4 rounded flex items-center text-sm sm:text-base"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        Import Cards
                    </Link>
                    <Link
                        to="/decks/new"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base"
                    >
                        Create Deck
                    </Link>
                </div>
            </div>

            {decks.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500">You don't have any decks yet. Create your first deck to get started!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {decks.map(deck => (
                        <Link
                            key={deck.id}
                            to={`/decks/${deck.id}`}
                            className="block bg-white shadow-md hover:shadow-lg rounded-lg overflow-hidden transition-shadow duration-300"
                        >
                            <div className="p-4 sm:p-6">
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">{deck.name}</h3>
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/decks/${deck.id}/edit`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log(`Edit link clicked for deck: ${deck.id}`);
                                            }}
                                            className="text-gray-500 hover:text-blue-500"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </Link>
                                        <button
                                            onClick={(e) => handleDeleteDeck(deck.id, e)}
                                            className="text-gray-500 hover:text-red-500"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{deck.description || 'No description'}</p>
                                <div className="flex flex-wrap justify-between items-center text-xs sm:text-sm text-gray-500 gap-2">
                                    <div>
                                        {deckStats[deck.id] && (
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                {deckStats[deck.id].dueCount} cards due
                                            </span>
                                        )}
                                    </div>
                                    <div>Created {new Date(deck.created_at).toLocaleDateString()}</div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
