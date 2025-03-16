import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { cardService } from '../../services/cardService';
import { useAuth } from '../../contexts/AuthContext';

export default function CardForm({ isEditing = false }) {
    const { deckId, cardId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    useEffect(() => {
        // Load existing card data if editing
        async function loadCardData() {
            if (isEditing && cardId) {
                try {
                    setLoading(true);
                    const card = await cardService.getCardById(cardId);
                    reset({
                        front_content: card.front_content,
                        back_content: card.back_content
                    });
                } catch (err) {
                    console.error('Error loading card:', err);
                    setError('Failed to load card data. Please try again.');
                } finally {
                    setLoading(false);
                }
            }
        }

        loadCardData();
    }, [isEditing, cardId, reset]);

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            setError(null);

            const cardData = {
                front_content: data.front_content,
                back_content: data.back_content,
                deck_id: deckId,
                user_id: user.id
            };

            if (isEditing) {
                await cardService.updateCard(cardId, cardData);
            } else {
                await cardService.createCard(cardData);
            }

            navigate(`/decks/${deckId}`);
        } catch (err) {
            console.error('Error saving card:', err);
            setError(`Failed to ${isEditing ? 'update' : 'create'} card. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditing) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6">
                {isEditing ? 'Edit Card' : 'Create New Card'}
            </h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <label htmlFor="front_content" className="block text-sm font-medium text-gray-700">
                        Front Side
                    </label>
                    <textarea
                        id="front_content"
                        {...register('front_content', { required: 'Front content is required' })}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        placeholder="Enter the question or prompt for this card"
                    />
                    {errors.front_content && (
                        <p className="mt-1 text-sm text-red-600">{errors.front_content.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="back_content" className="block text-sm font-medium text-gray-700">
                        Back Side
                    </label>
                    <textarea
                        id="back_content"
                        {...register('back_content', { required: 'Back content is required' })}
                        rows={6}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        placeholder="Enter the answer or explanation for this card"
                    />
                    {errors.back_content && (
                        <p className="mt-1 text-sm text-red-600">{errors.back_content.message}</p>
                    )}
                </div>

                <div className="flex space-x-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        {loading ? 'Saving...' : isEditing ? 'Update Card' : 'Create Card'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/decks/${deckId}`)}
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
