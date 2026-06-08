/**
 * Supabase Image Upload Service
 * Handles image uploads to Supabase storage
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not configured. Image upload will not work.');
}

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * Upload image file to Supabase storage
 * @param {File} file - The image file to upload
 * @param {string} bucket - The storage bucket name (default: 'Inventory')
 * @returns {Promise<{url: string, error: null}|{url: null, error: string}>}
 */
export const uploadImageToSupabase = async (file, bucket = 'Inventory') => {
  try {
    if (!supabase) {
      return {
        url: null,
        error: 'Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env'
      };
    }

    if (!file) {
      return { url: null, error: 'No file provided' };
    }

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      return { url: null, error: 'File must be an image' };
    }

    // Validate file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return { url: null, error: 'File size must be less than 5MB' };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileExtension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomString}.${fileExtension}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return { url: null, error: error.message };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);

    const imageUrl = publicUrlData?.publicUrl;

    if (!imageUrl) {
      return { url: null, error: 'Failed to get public URL' };
    }

    return { url: imageUrl, error: null };
  } catch (err) {
    console.error('Image upload error:', err);
    return { url: null, error: err.message || 'Unknown error occurred' };
  }
};

/**
 * Delete image from Supabase storage
 * @param {string} imageUrl - The public URL of the image to delete
 * @param {string} bucket - The storage bucket name (default: 'Inventory')
 * @returns {Promise<{success: boolean, error: null}|{success: false, error: string}>}
 */
export const deleteImageFromSupabase = async (imageUrl, bucket = 'Inventory') => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    if (!imageUrl) {
      return { success: false, error: 'No image URL provided' };
    }

    // Extract filename from URL
    const filename = imageUrl.split('/').pop();

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filename]);

    if (error) {
      console.error('Supabase delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Image delete error:', err);
    return { success: false, error: err.message || 'Unknown error occurred' };
  }
};

export default {
  uploadImageToSupabase,
  deleteImageFromSupabase
};
