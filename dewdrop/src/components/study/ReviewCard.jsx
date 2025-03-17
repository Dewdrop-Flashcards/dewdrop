import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function ReviewCard({ card, onRate }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isDifficultySectionVisible, setIsDifficultySectionVisible] = useState(false);

    const handleFlip = () => {
        if (!isFlipped) {
            setIsFlipped(true);
        } else {
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
            <div className="mb-3 sm:mb-4 flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-500">
                    Review count: {card.review_count}
                </span>
                <span className="text-xs sm:text-sm text-gray-500">
                    Success rate: {Math.round(card.success_rate * 100)}%
                </span>
            </div>

            <div
                className="relative w-full h-64 sm:h-80 cursor-pointer perspective-1000"
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
                            transition={{ duration: 0.5 }}
                        >
                            <div className="text-center">
                                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-gray-800">Question</h3>
                                <div className="text-base sm:text-lg text-gray-700 overflow-auto max-h-36 sm:max-h-48 markdown-content">
                                    <ReactMarkdown>{card.front_content}</ReactMarkdown>
                                </div>
                            </div>
                            <div className="mt-auto text-center text-sm text-gray-500">
                                Click to reveal answer
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="back"
                            className="absolute inset-0 bg-white rounded-lg shadow-lg p-6 flex flex-col justify-center"
                            initial={{ rotateY: -180, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: -180, opacity: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="text-center">
                                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-blue-600">Answer</h3>
                                <div className="text-base sm:text-lg text-gray-700 overflow-auto max-h-36 sm:max-h-48 markdown-content">
                                    <ReactMarkdown>{card.back_content}</ReactMarkdown>
                                </div>
                            </div>
                            {!isDifficultySectionVisible && (
                                <div className="mt-auto text-center text-sm text-gray-500">
                                    Click to rate your performance
                                </div>
                            )}
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
