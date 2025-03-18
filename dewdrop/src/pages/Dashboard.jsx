import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cardService } from '../services/cardService';
import { deckService } from '../services/deckService';
import { statisticsService } from '../services/statisticsService';

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        newCards: 0,
        totalCards: 0,
        dueCards: 0,
        recentlyStudied: 0
    });
    const [decks, setDecks] = useState([]);

    useEffect(() => {
        async function loadDashboardData() {
            try {
                setLoading(true);

                // Get all decks
                const decksData = await deckService.getDecks();
                setDecks(decksData);

                // Get all due cards
                const dueCardsData = await cardService.getDueCards();

                // Get all new cards (never reviewed)
                const newCardsData = await cardService.getNewCards();

                // Get reviews by date to calculate studied today
                const reviewsByDate = await statisticsService.getReviewsByDate('week');

                // Find today's reviews if they exist
                const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
                const todayStats = reviewsByDate.find(day => day.date === today);
                const studiedToday = todayStats ? todayStats.total : 0;

                // Calculate dashboard stats
                let totalCards = 0;

                // Count all cards across all decks
                for (const deck of decksData) {
                    const deckCards = await cardService.getCardsByDeckId(deck.id);
                    totalCards += deckCards.length;
                }

                setStats({
                    newCards: newCardsData.length,
                    totalCards: totalCards,
                    dueCards: dueCardsData.length,
                    recentlyStudied: studiedToday
                });
            } catch (err) {
                console.error('Error loading dashboard data:', err);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        loadDashboardData();
    }, []);

    // Format recent decks to show a maximum of 3
    const recentDecks = decks.slice(0, 3);

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
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="font-semibold text-gray-600">Total Cards</h2>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalCards}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="font-semibold text-gray-600">New Cards</h2>
                            <p className="text-2xl font-bold text-gray-800">{stats.newCards}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="font-semibold text-gray-600">Due Cards</h2>
                            <p className="text-2xl font-bold text-gray-800">{stats.dueCards}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="font-semibold text-gray-600">Studied Today</h2>
                            <p className="text-2xl font-bold text-gray-800">{stats.recentlyStudied}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Study Actions */}
            <div className="bg-white rounded-lg shadow mb-8">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Study Now</h2>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            to="/study"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                            Study Due Cards
                        </Link>

                        <Link
                            to="/decks"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                            </svg>
                            Browse Decks
                        </Link>

                        <Link
                            to="/decks/new"
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Create New Deck
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recent Decks */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Recent Decks</h2>
                        <Link to="/decks" className="text-blue-600 hover:text-blue-800">View All</Link>
                    </div>

                    {recentDecks.length === 0 ? (
                        <p className="text-gray-500">You haven't created any decks yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {recentDecks.map(deck => (
                                <Link
                                    key={deck.id}
                                    to={`/decks/${deck.id}`}
                                    className="block bg-gray-50 hover:bg-gray-100 p-4 rounded-lg border border-gray-200 transition-colors"
                                >
                                    <h3 className="font-bold text-lg text-gray-800 mb-2">{deck.name}</h3>
                                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{deck.description || 'No description'}</p>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Created: {new Date(deck.created_at).toLocaleDateString()}</span>
                                        {/* Would need to fetch card count */}
                                        <span>Cards: ...</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
