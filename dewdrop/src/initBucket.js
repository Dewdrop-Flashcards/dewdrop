import { supabase } from './lib/supabaseClient.js';
import { storageService } from './services/storageService.js';

// This script can be run to explicitly initialize the storage bucket
(async () => {
    console.log('Initializing storage bucket...');

    // First, check if we can connect to Supabase
    try {
        const { data, error } = await supabase.from('cards').select('id').limit(1);
        if (error) {
            console.error('Error connecting to Supabase:', error);
        } else {
            console.log('Successfully connected to Supabase database');
        }
    } catch (err) {
        console.error('Supabase connection error:', err);
    }

    // Now try to create the bucket
    try {
        // List existing buckets first
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

        if (bucketsError) {
            console.error('Error listing buckets:', bucketsError);
        } else {
            console.log('Existing buckets:', buckets.map(b => b.name).join(', ') || 'None');
        }

        // Try to create our bucket
        const success = await storageService.ensureBucketExists();
        console.log('Bucket initialization result:', success ? 'Success' : 'Failed');

        // Check if it now exists
        const { data: verifyBuckets, error: verifyError } = await supabase.storage.listBuckets();
        if (verifyError) {
            console.error('Error verifying buckets:', verifyError);
        } else {
            console.log('Buckets after creation attempt:', verifyBuckets.map(b => b.name).join(', ') || 'None');
        }
    } catch (error) {
        console.error('Failed to initialize bucket:', error);
    }

    console.log('Initialization process complete');
})();
