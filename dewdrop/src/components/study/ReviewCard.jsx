import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { storageService } from '../../services/storageService';

export default function ReviewCard({ card, onRate, isReviewingFailed = false, isNew = false, frontLabel = 'Question', backLabel = 'Answer' }) {
    // Force console log of props to help debug
    console.log("ReviewCard props:", { frontLabel, backLabel });
    const [isFlipped, setIsFlipped] = useState(false);
    const [isDifficultySectionVisible, setIsDifficultySectionVisible] = useState(false);
    const [frontImageUrl, setFrontImageUrl] = useState(null);
    const [backImageUrl, setBackImageUrl] = useState(null);

    // Process image URLs when card loads or changes
    useEffect(() => {
        // Extract the display URLs from the stored URL+path format
        if (card.front_image_url) {
            setFrontImageUrl(storageService.getDisplayUrl(card.front_image_url));
        } else {
            setFrontImageUrl(null);
        }

        if (card.back_image_url) {
            setBackImageUrl(storageService.getDisplayUrl(card.back_image_url));
        } else {
            setBackImageUrl(null);
        }
    }, [card]);

    const handleFlip = () => {
        if (!isFlipped) {
            setIsFlipped(true);
            setIsDifficultySectionVisible(true);
        }
    };

    const handleDifficultyRating = (rating) => {
        onRate(card.id, rating);
        setIsFlipped(false);
        setIsDifficultySectionVisible(false);
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            {isReviewingFailed && (
                <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
                    <p className="text-sm text-orange-600 font-medium flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Reviewing card you failed earlier
                    </p>
                </div>
            )}
            {isNew && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-600 font-medium flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        New card
                    </p>
                </div>
            )}
            <div className="mb-3 sm:mb-4 flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-500">
                    Review count: {card.review_count}
                </span>
                <span className="text-xs sm:text-sm text-gray-500">
                    Success rate: {Math.round(card.success_rate * 100)}%
                </span>
            </div>

            <div
                className={`relative w-full h-64 sm:h-80 cursor-pointer perspective-1000 ${isReviewingFailed ? 'border-2 border-orange-300 rounded-lg' : ''}`}
                onClick={handleFlip}
            >
                <AnimatePresence initial={false} mode="wait">
                    {!isFlipped ? (
                        <motion.div
                            key="front"
                            className="absolute inset-0 bg-white rounded-lg shadow-lg p-6 flex flex-col justify-center"
                            initial={{ rotateY: 180, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: 180, opacity: 0 }}
                            transition={{ duration: 0.05 }}
                        >
                            <div className="text-center">
                                <div className="flex justify-center items-center mb-2">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Viewing: Front Side</span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-gray-800">{frontLabel}</h3>
                                {frontImageUrl && (
                                    <div className="mb-3 flex justify-center">
                                        <img
                                            src={frontImageUrl}
                                            alt="Front card image"
                                            className="max-h-32 max-w-full rounded-md object-contain"
                                        />
                                    </div>
                                )}
                                <div className="text-base sm:text-lg text-gray-700 overflow-auto max-h-36 sm:max-h-48 markdown-content">
                                    <ReactMarkdown>{card.front_content}</ReactMarkdown>
                                </div>
                            </div>
                            <div className="mt-auto text-center text-sm text-gray-500">
                                Click to reveal {backLabel}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="back"
                            className="absolute inset-0 bg-white rounded-lg shadow-lg p-6 flex flex-col justify-center"
                            initial={{ rotateY: -180, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: -180, opacity: 0 }}
                            transition={{ duration: 0.05 }}
                        >
                            <div className="text-center">
                                <div className="flex justify-center items-center mb-2">
                                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Viewing: Back Side</span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-blue-600">{backLabel}</h3>
                                {backImageUrl && (
                                    <div className="mb-3 flex justify-center">
                                        <img
                                            src={backImageUrl}
                                            alt="Back card image"
                                            className="max-h-32 max-w-full rounded-md object-contain"
                                        />
                                    </div>
                                )}
                                <div className="text-base sm:text-lg text-gray-700 overflow-auto max-h-36 sm:max-h-48 markdown-content">
                                    <ReactMarkdown>{card.back_content}</ReactMarkdown>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isDifficultySectionVisible && (
                    <motion.div
                        className="mt-6 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h4 className="text-base sm:text-lg font-medium mb-3">How well did you know this?</h4>
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                            <button
                                onClick={() => handleDifficultyRating(0)}
                                className="px-3 sm:px-4 py-2 bg-red-500 text-white text-sm sm:text-base font-medium rounded hover:bg-red-600 transition-colors"
                            >
                                Failed
                            </button>
                            <button
                                onClick={() => handleDifficultyRating(1)}
                                className="px-3 sm:px-4 py-2 bg-orange-500 text-white text-sm sm:text-base font-medium rounded hover:bg-orange-600 transition-colors"
                            >
                                Hard
                            </button>
                            <button
                                onClick={() => handleDifficultyRating(3)}
                                className="px-3 sm:px-4 py-2 bg-yellow-500 text-white text-sm sm:text-base font-medium rounded hover:bg-yellow-600 transition-colors"
                            >
                                Good
                            </button>
                            <button
                                onClick={() => handleDifficultyRating(5)}
                                className="px-3 sm:px-4 py-2 bg-green-500 text-white text-sm sm:text-base font-medium rounded hover:bg-green-600 transition-colors"
                            >
                                Easy
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
