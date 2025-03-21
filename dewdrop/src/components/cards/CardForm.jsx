import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';
import { cardService } from '../../services/cardService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';

export default function CardForm({ isEditing = false }) {
    const [showFrontPreview, setShowFrontPreview] = useState(false);
    const [showBackPreview, setShowBackPreview] = useState(false);
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [frontImagePreview, setFrontImagePreview] = useState(null);
    const [backImagePreview, setBackImagePreview] = useState(null);
    const [existingFrontImage, setExistingFrontImage] = useState(null);
    const [existingBackImage, setExistingBackImage] = useState(null);
    const frontImageInputRef = useRef(null);
    const backImageInputRef = useRef(null);

    const { deckId, cardId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
    const frontContent = watch('front_content', '');
    const backContent = watch('back_content', '');

    // Handle image file selection
    const handleImageChange = (side, event) => {
        if (!event.target.files || event.target.files.length === 0) {
            side === 'front' ? setFrontImage(null) : setBackImage(null);
            side === 'front' ? setFrontImagePreview(null) : setBackImagePreview(null);
            return;
        }

        const selectedFile = event.target.files[0];
        if (side === 'front') {
            setFrontImage(selectedFile);
            const preview = URL.createObjectURL(selectedFile);
            setFrontImagePreview(preview);
        } else {
            setBackImage(selectedFile);
            const preview = URL.createObjectURL(selectedFile);
            setBackImagePreview(preview);
        }
    };

    // Remove selected image
    const handleRemoveImage = (side) => {
        if (side === 'front') {
            setFrontImage(null);
            setFrontImagePreview(null);
            setExistingFrontImage(null);
            if (frontImageInputRef.current) frontImageInputRef.current.value = '';
        } else {
            setBackImage(null);
            setBackImagePreview(null);
            setExistingBackImage(null);
            if (backImageInputRef.current) backImageInputRef.current.value = '';
        }
    };

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

                    // Set existing image URLs if available
                    if (card.front_image_url) {
                        // Get the display URL from the stored URL+path
                        setExistingFrontImage(storageService.getDisplayUrl(card.front_image_url));
                    }

                    if (card.back_image_url) {
                        // Get the display URL from the stored URL+path
                        setExistingBackImage(storageService.getDisplayUrl(card.back_image_url));
                    }
                } catch (err) {
                    console.error('Error loading card:', err);
                    setError('Failed to load card data. Please try again.');
                } finally {
                    setLoading(false);
                }
            }
        }

        loadCardData();

        // Clean up object URLs on unmount
        return () => {
            if (frontImagePreview) URL.revokeObjectURL(frontImagePreview);
            if (backImagePreview) URL.revokeObjectURL(backImagePreview);
        };
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

            // If editing and an image was previously removed, explicitly set it to null
            if (isEditing) {
                if (existingFrontImage && !frontImage && !frontImagePreview) {
                    cardData.front_image_url = null;
                }
                if (existingBackImage && !backImage && !backImagePreview) {
                    cardData.back_image_url = null;
                }

                await cardService.updateCard(cardId, cardData, frontImage, backImage);
            } else {
                await cardService.createCard(cardData, frontImage, backImage);
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
                    <div className="flex justify-between items-center">
                        <label htmlFor="front_content" className="block text-sm font-medium text-gray-700">
                            Front Side <span className="text-xs text-gray-500">(Supports Markdown)</span>
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowFrontPreview(!showFrontPreview)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            {showFrontPreview ? 'Hide Preview' : 'Show Preview'}
                        </button>
                    </div>
                    <textarea
                        id="front_content"
                        {...register('front_content', { required: 'Front content is required' })}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        placeholder="Enter the question or prompt for this card. You can use **bold**, *italic*, and other markdown formatting."
                    />
                    {errors.front_content && (
                        <p className="mt-1 text-sm text-red-600">{errors.front_content.message}</p>
                    )}

                    {/* Front Image Upload */}
                    <div className="mt-3">
                        <label htmlFor="front_image" className="block text-sm font-medium text-gray-700">
                            Front Image <span className="text-xs text-gray-500">(Optional)</span>
                        </label>
                        <div className="mt-1 flex items-center space-x-2">
                            <input
                                type="file"
                                id="front_image"
                                accept="image/*"
                                ref={frontImageInputRef}
                                onChange={(e) => handleImageChange('front', e)}
                                className="block w-full text-sm text-gray-500 
                                           file:mr-4 file:py-2 file:px-4
                                           file:rounded-md file:border-0
                                           file:text-sm file:font-semibold
                                           file:bg-blue-50 file:text-blue-700
                                           hover:file:bg-blue-100"
                            />
                            {(frontImagePreview || existingFrontImage) && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage('front')}
                                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none"
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        {/* Front Image Preview */}
                        {(frontImagePreview || existingFrontImage) && (
                            <div className="mt-2 p-2 border rounded">
                                <p className="text-xs text-gray-500 mb-1">Image Preview:</p>
                                <img
                                    src={frontImagePreview || existingFrontImage}
                                    alt="Front side preview"
                                    className="max-h-40 max-w-full rounded"
                                />
                            </div>
                        )}
                    </div>

                    {/* Content Preview */}
                    {showFrontPreview && frontContent && (
                        <div className="mt-2 p-3 border rounded-md bg-gray-50">
                            <p className="text-sm font-medium text-gray-700 mb-1">Content Preview:</p>
                            <div className="markdown-content p-2 bg-white rounded border">
                                <ReactMarkdown>{frontContent}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex justify-between items-center">
                        <label htmlFor="back_content" className="block text-sm font-medium text-gray-700">
                            Back Side <span className="text-xs text-gray-500">(Supports Markdown)</span>
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowBackPreview(!showBackPreview)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            {showBackPreview ? 'Hide Preview' : 'Show Preview'}
                        </button>
                    </div>
                    <textarea
                        id="back_content"
                        {...register('back_content', { required: 'Back content is required' })}
                        rows={6}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        placeholder="Enter the answer or explanation for this card. You can use **bold**, *italic*, # headings, and other markdown formatting."
                    />
                    {errors.back_content && (
                        <p className="mt-1 text-sm text-red-600">{errors.back_content.message}</p>
                    )}

                    {/* Back Image Upload */}
                    <div className="mt-3">
                        <label htmlFor="back_image" className="block text-sm font-medium text-gray-700">
                            Back Image <span className="text-xs text-gray-500">(Optional)</span>
                        </label>
                        <div className="mt-1 flex items-center space-x-2">
                            <input
                                type="file"
                                id="back_image"
                                accept="image/*"
                                ref={backImageInputRef}
                                onChange={(e) => handleImageChange('back', e)}
                                className="block w-full text-sm text-gray-500 
                                           file:mr-4 file:py-2 file:px-4
                                           file:rounded-md file:border-0
                                           file:text-sm file:font-semibold
                                           file:bg-blue-50 file:text-blue-700
                                           hover:file:bg-blue-100"
                            />
                            {(backImagePreview || existingBackImage) && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage('back')}
                                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none"
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        {/* Back Image Preview */}
                        {(backImagePreview || existingBackImage) && (
                            <div className="mt-2 p-2 border rounded">
                                <p className="text-xs text-gray-500 mb-1">Image Preview:</p>
                                <img
                                    src={backImagePreview || existingBackImage}
                                    alt="Back side preview"
                                    className="max-h-40 max-w-full rounded"
                                />
                            </div>
                        )}
                    </div>

                    {/* Content Preview */}
                    {showBackPreview && backContent && (
                        <div className="mt-2 p-3 border rounded-md bg-gray-50">
                            <p className="text-sm font-medium text-gray-700 mb-1">Content Preview:</p>
                            <div className="markdown-content p-2 bg-white rounded border">
                                <ReactMarkdown>{backContent}</ReactMarkdown>
                            </div>
                        </div>
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
