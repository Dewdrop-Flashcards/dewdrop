import { useState, useEffect } from 'react';
import { statisticsService } from '../services/statisticsService';

function Statistics() {
    const [stats, setStats] = useState({
        overall: null,
        reviewsByDate: [],
        performanceDistribution: [],
        recentReviews: []
    });
    const [timeFrame, setTimeFrame] = useState('week');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadStatistics() {
            try {
                setLoading(true);

                // Load all stats in parallel
                const [overall, reviewsByDate, performanceDistribution, recentReviews] = await Promise.all([
                    statisticsService.getOverallStats(),
                    statisticsService.getReviewsByDate(timeFrame),
                    statisticsService.getPerformanceDistribution(),
                    statisticsService.getRecentReviews(10)
                ]);

                setStats({
                    overall,
                    reviewsByDate,
                    performanceDistribution,
                    recentReviews
                });

                setError(null);
            } catch (err) {
                console.error('Error loading statistics:', err);
                setError('Failed to load statistics. Please try again later.');
            } finally {
                setLoading(false);
            }
        }

        loadStatistics();
    }, [timeFrame]);

    // Format seconds to minutes and seconds
    const formatTime = (seconds) => {
        if (!seconds) return '0m';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return minutes > 0
            ? `${minutes}m ${remainingSeconds > 0 ? `${remainingSeconds}s` : ''}`
            : `${remainingSeconds}s`;
    };

    // Format date string
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center min-h-[50vh]">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                    </div>
                    <p className="mt-2 text-gray-600">Loading statistics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Statistics</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Total Reviews</h3>
                    <p className="text-3xl font-bold">{stats.overall?.totalReviews || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Success Rate</h3>
                    <p className="text-3xl font-bold">{stats.overall?.successRate ? `${Math.round(stats.overall.successRate)}%` : '0%'}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Cards Reviewed</h3>
                    <p className="text-3xl font-bold">{stats.overall?.uniqueCardsReviewed || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Total Study Time</h3>
                    <p className="text-3xl font-bold">{formatTime(stats.overall?.totalStudyTime || 0)}</p>
                </div>
            </div>

            {/* Recent Activity Chart */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex flex-wrap justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Recent Activity</h2>
                    <div className="flex space-x-2 text-sm">
                        <button
                            onClick={() => setTimeFrame('week')}
                            className={`px-3 py-1 rounded ${timeFrame === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setTimeFrame('month')}
                            className={`px-3 py-1 rounded ${timeFrame === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => setTimeFrame('year')}
                            className={`px-3 py-1 rounded ${timeFrame === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                        >
                            Year
                        </button>
                    </div>
                </div>

                {stats.reviewsByDate.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No review data available for this time period
                    </div>
                ) : (
                    <div className="h-64 flex items-end justify-between space-x-2">
                        {stats.reviewsByDate.map((day) => {
                            const successRate = day.total > 0 ? (day.successful / day.total) * 100 : 0;
                            return (
                                <div key={day.date} className="flex flex-col items-center flex-1">
                                    <div className="w-full flex flex-col items-center">
                                        <div
                                            className="w-full bg-blue-200 rounded-t relative tooltip-container"
                                            style={{ height: `${(day.total / Math.max(...stats.reviewsByDate.map(d => d.total))) * 100}%` }}
                                        >
                                            <div
                                                className="absolute bottom-0 w-full bg-blue-600 rounded-t"
                                                style={{ height: `${successRate}%` }}
                                            ></div>
                                            <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 tooltip">
                                                <div>{day.total} Reviews</div>
                                                <div>{Math.round(successRate)}% Success</div>
                                            </div>
                                        </div>
                                        <span className="text-xs mt-1 text-gray-500">{day.date.split('-')[2]}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Performance Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-6">Performance Distribution</h2>

                    {stats.performanceDistribution.every(count => count === 0) ? (
                        <div className="text-center py-12 text-gray-500">
                            No performance data available
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats.performanceDistribution.map((count, score) => {
                                const total = stats.performanceDistribution.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? (count / total) * 100 : 0;

                                return (
                                    <div key={score} className="flex items-center">
                                        <span className="w-6 text-center">{score}</span>
                                        <div className="flex-1 mx-2">
                                            <div className="bg-gray-200 rounded-full h-4 w-full">
                                                <div
                                                    className={`h-4 rounded-full ${score <= 2 ? 'bg-red-500' : 'bg-green-500'}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <span className="w-12 text-right text-sm">{count} ({Math.round(percentage)}%)</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-4 text-sm text-gray-500">
                        <p>0-2: Difficult recall (shown more frequently)</p>
                        <p>3-5: Easy recall (shown less frequently)</p>
                    </div>
                </div>

                {/* Recent Reviews */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-6">Recent Reviews</h2>

                    {stats.recentReviews.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No recent reviews available
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-80">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deck</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {stats.recentReviews.map((review) => (
                                        <tr key={review.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="truncate max-w-[150px]">{review.cardFront || 'Unknown Card'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {review.deckName || 'Unknown Deck'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${review.performance_score >= 3 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {review.performance_score !== null ? review.performance_score : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(review.review_date)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Statistics;
