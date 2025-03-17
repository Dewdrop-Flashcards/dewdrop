import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { deckService } from '../../services/deckService';
import { useAuth } from '../../contexts/AuthContext';

export default function DeckForm({ isEditing = false }) {
    const params = useParams();
    const { deckId } = params;

    useEffect(() => {
        if (isEditing && !deckId) {
            console.error('Edit mode activated but no deckId found in route params');
        }
    }, [isEditing, deckId]);
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parentDecks, setParentDecks] = useState([]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    useEffect(() => {
        // Load existing deck data if editing
        async function loadDeckData() {
            if (isEditing && deckId) {
                try {
                    setLoading(true);
                    const deck = await deckService.getDeckById(deckId);

                    console.log('Loaded deck data:', deck);

                    if (!deck || !deck.name) {
                        throw new Error('Invalid deck data received');
                    }

                    reset({
                        name: deck.name,
                        description: deck.description || '',
                        parent_deck_id: deck.parent_deck_id || ''
                    });
                } catch (err) {
                    console.error('Error loading deck:', err);
                    setError('Failed to load deck data. Please try again.');
                } finally {
                    setLoading(false);
                }
            }
        }

        // Load all potential parent decks
        async function loadParentDecks() {
            try {
                const decks = await deckService.getDecks();
                // Filter out the current deck if editing (to prevent circular references)
                const potentialParents = isEditing
                    ? decks.filter(deck => deck.id !== deckId)
                    : decks;
                setParentDecks(potentialParents);
            } catch (err) {
                console.error('Error loading parent decks:', err);
            }
        }

        loadDeckData();
        loadParentDecks();
    }, [isEditing, deckId, reset]);

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            setError(null);

            const deckData = {
                name: data.name,
                description: data.description,
                parent_deck_id: data.parent_deck_id || null,
                user_id: user.id
            };

            if (isEditing) {
                if (!deckId) {
                    setError('Deck ID is missing. Please try again or create a new deck.');
                    return;
                }
                await deckService.updateDeck(deckId, deckData);
            } else {
                await deckService.createDeck(deckData);
            }

            navigate('/decks');
        } catch (err) {
            console.error('Error saving deck:', err);
            setError(`Failed to ${isEditing ? 'update' : 'create'} deck. Please try again.`);
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
                {isEditing ? 'Edit Deck' : 'Create New Deck'}
            </h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Deck Name
                    </label>
                    <input
                        id="name"
                        {...register('name', { required: 'Deck name is required' })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description (optional)
                    </label>
                    <textarea
                        id="description"
                        {...register('description')}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    />
                </div>

                <div>
                    <label htmlFor="parent_deck_id" className="block text-sm font-medium text-gray-700">
                        Parent Deck (optional)
                    </label>
                    <select
                        id="parent_deck_id"
                        {...register('parent_deck_id')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    >
                        <option value="">None (Top Level Deck)</option>
                        {parentDecks.map(deck => (
                            <option key={deck.id} value={deck.id}>
                                {deck.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex space-x-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        {loading ? 'Saving...' : isEditing ? 'Update Deck' : 'Create Deck'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/decks')}
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
