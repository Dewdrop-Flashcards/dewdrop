import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Storage bucket for card images
const BUCKET_NAME = 'card-images';

// We're assuming the bucket "card-images" has been manually created in the Supabase dashboard
// as a private bucket (not public) for better security
const logBucketInfo = () => {
    console.log('Using manually created private storage bucket:', BUCKET_NAME);
    return true;
};

// Log info about the bucket - no automatic creation
logBucketInfo();

export const storageService = {
    // No longer attempts to create the bucket
    checkBucketExists: async () => {
        try {
            const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
            return !error;
        } catch {
            return false;
        }
    },
    /**
     * Upload an image file to Supabase storage
     * @param {File} file - The file to upload
     * @param {string} userId - The user ID for path segmentation
     * @param {string} [existingPath] - Existing file path to replace (if updating)
     * @returns {Promise<string>} - The URL of the uploaded file
     */
    async uploadCardImage(file, userId, existingPath = null) {
        if (!file) return null;

        // No longer tries to create the bucket

        // Delete the existing file if provided
        if (existingPath) {
            await this.deleteCardImage(existingPath);
        }

        // Generate a unique file path: userId/uuid-filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        try {
            // Upload the file
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Error uploading image:', error);
                throw error;
            }

            // Since we're using a private bucket, we need to create a signed URL
            // that expires after a reasonable time (3 days = 259200 seconds)
            const { data: { signedUrl }, error: signedUrlError } = await supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(filePath, 259200);

            if (signedUrlError) {
                console.error('Error creating signed URL:', signedUrlError);
                throw signedUrlError;
            }

            // Store both the signed URL and the path for later refreshing
            // The URL format will be: signedUrl###filePath
            // This allows us to extract the path when we need to create a new signed URL
            return signedUrl + '###' + filePath;
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    },

    /**
     * Get a fresh signed URL for an image
     * @param {string} storedUrl - The URL+path stored in the database
     * @returns {Promise<string>} - A fresh signed URL
     */
    async refreshSignedUrl(storedUrl) {
        if (!storedUrl) return null;

        try {
            // Extract the path from the stored URL format (signedUrl###filePath)
            const pathParts = storedUrl.split('###');
            if (pathParts.length < 2) return storedUrl; // Not our format, return as is

            const filePath = pathParts[1];

            // Create a new signed URL
            const { data: { signedUrl }, error } = await supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(filePath, 259200); // 3 days

            if (error) {
                console.error('Error refreshing signed URL:', error);
                return storedUrl; // Return original as fallback
            }

            // Return the new signed URL with the path still appended
            return signedUrl + '###' + filePath;
        } catch (error) {
            console.error('Error refreshing signed URL:', error);
            return storedUrl; // Return original as fallback
        }
    },

    /**
     * Get just the URL part from a stored URL+path string
     * @param {string} storedUrl - The URL+path stored in the database
     * @returns {string} - Just the URL part for display
     */
    getDisplayUrl(storedUrl) {
        if (!storedUrl) return null;
        const parts = storedUrl.split('###');
        return parts[0]; // Return just the URL part
    },

    /**
     * Delete an image from Supabase storage
     * @param {string} storedUrl - The URL+path stored in the database
     * @returns {Promise<boolean>} - Whether the deletion was successful
     */
    async deleteCardImage(storedUrl) {
        if (!storedUrl) return true;

        try {
            // Extract the path from our stored format (signedUrl###filePath)
            const parts = storedUrl.split('###');
            let filePath;

            if (parts.length >= 2) {
                // Our format with embedded path
                filePath = parts[1];
            } else {
                // Try to parse as a URL (backward compatibility)
                const urlObj = new URL(storedUrl);
                const pathParts = urlObj.pathname.split('/');
                const bucketIndex = pathParts.indexOf(BUCKET_NAME);
                if (bucketIndex === -1) return false;
                filePath = pathParts.slice(bucketIndex + 1).join('/');
            }

            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([filePath]);

            if (error) {
                console.error('Error deleting image:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error parsing image URL for deletion:', error);
            return false;
        }
    }
};
