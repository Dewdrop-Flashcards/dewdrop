import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { cardService } from '../../services/cardService';
import { deckService } from '../../services/deckService';
import { storageService } from '../../services/storageService';

export default function CardList() {
    const { deckId } = useParams();
    const [cards, setCards] = useState([]);
    const [deck, setDeck] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                // Load deck information
                const deckData = await deckService.getDeckById(deckId);
                setDeck(deckData);

                // Load cards for this deck
                const cardsData = await cardService.getCardsByDeckId(deckId);
                setCards(cardsData);
            } catch (err) {
                console.error('Error loading cards:', err);
                setError('Failed to load cards. Please try again later.');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [deckId]);

    async function handleDeleteCard(cardId) {
        if (!confirm('Are you sure you want to delete this card?')) {
            return;
        }

        try {
            await cardService.deleteCard(cardId);
            setCards(cards.filter(card => card.id !== cardId));
        } catch (err) {
            console.error('Error deleting card:', err);
            setError('Failed to delete card. Please try again.');
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{deck?.name}</h2>
                    {deck?.description && (
                        <p className="text-gray-600 mt-1">{deck.description}</p>
                    )}
                </div>
                <div className="flex space-x-2">
                    <Link
                        to={`/decks/${deckId}/study`}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                        </svg>
                        Study
                    </Link>
                    <Link
                        to={`/decks/${deckId}/cards/new`}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Add Card
                    </Link>
                </div>
            </div>

            {cards.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-600">No cards yet</h3>
                    <p className="text-gray-500 mt-2">Start adding cards to this deck.</p>
                    <Link
                        to={`/decks/${deckId}/cards/new`}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Create First Card
                    </Link>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {cards.map(card => (
                            <li key={card.id}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between">
                                                <div className="flex items-center">
                                                    <div className="text-sm font-medium text-blue-600 markdown-content-preview">
                                                        {card.front_content.length > 100 ? (
                                                            <ReactMarkdown>{card.front_content.substring(0, 100) + '...'}</ReactMarkdown>
                                                        ) : (
                                                            <ReactMarkdown>{card.front_content}</ReactMarkdown>
                                                        )}
                                                    </div>
                                                    {card.front_image_url && (
                                                        <span
                                                            title="Has front image"
                                                            className="ml-2 text-blue-400 cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Preview in a new tab if clicked
                                                                window.open(storageService.getDisplayUrl(card.front_image_url), '_blank');
                                                            }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="ml-2 flex-shrink-0 text-sm text-gray-500">
                                                    Reviews: {card.review_count}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center">
                                                <div className="text-sm text-gray-500 markdown-content-preview">
                                                    {card.back_content.length > 100 ? (
                                                        <ReactMarkdown>{card.back_content.substring(0, 100) + '...'}</ReactMarkdown>
                                                    ) : (
                                                        <ReactMarkdown>{card.back_content}</ReactMarkdown>
                                                    )}
                                                </div>
                                                {card.back_image_url && (
                                                    <span
                                                        title="Has back image"
                                                        className="ml-2 text-blue-400 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Preview in a new tab if clicked
                                                            window.open(storageService.getDisplayUrl(card.back_image_url), '_blank');
                                                        }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-5 flex-shrink-0 flex space-x-2">
                                            <Link
                                                to={`/decks/${deckId}/cards/${card.id}/edit`}
                                                className="text-gray-500 hover:text-blue-500"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteCard(card.id)}
                                                className="text-gray-500 hover:text-red-500"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex justify-between text-sm text-gray-500">
                                        <div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${card.success_rate >= 0.8 ? 'bg-green-100 text-green-800' :
                                                card.success_rate >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {Math.round(card.success_rate * 100)}% success
                                            </span>
                                        </div>
                                        <div>
                                            <span>Next review: {new Date(card.next_review_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
