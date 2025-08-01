import { createClient } from '@supabase/supabase-js';

// Note: In a production app, these would be environment variables
// For now, using placeholder values that will work with Supabase's auto-connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DetectionHistory {
  id: string;
  created_at: string;
  image_url: string;
  disease: string;
  confidence: number;
  treatment: string;
  severity: 'Low' | 'Medium' | 'High';
  session_id?: string;
}

// Database operations
export const saveDetectionResult = async (result: Omit<DetectionHistory, 'id' | 'created_at'>) => {
  try {
    const { data, error } = await supabase
      .from('detection_history')
      .insert([result])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving detection result:', error);
    throw error;
  }
};

export const getDetectionHistory = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('detection_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching detection history:', error);
    return [];
  }
};

export const uploadImage = async (file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `detections/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('plant-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('plant-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};