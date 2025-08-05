import { createClient } from '@supabase/supabase-js';

// Supabase project configuration
const supabaseUrl = 'https://ikreywaxwgdkhioouifo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcmV5d2F4d2dka2hpb291aWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjI1ODksImV4cCI6MjA2OTg5ODU4OX0.USdCmu7v50A4VgdRjIAlwwNnTTZkBtEOwnx5UWyzeD4';

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

export const deleteDetectionResult = async (id: string) => {
  try {
    const { error } = await supabase
      .from('detection_history')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting detection result:', error);
    throw error;
  }
};