-- Create detection_history table
CREATE TABLE public.detection_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  image_url TEXT NOT NULL,
  disease TEXT NOT NULL,
  confidence NUMERIC(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  treatment TEXT,
  severity TEXT CHECK (severity IN ('Low', 'Medium', 'High')),
  symptoms TEXT,
  causes TEXT,
  session_id TEXT
);

-- Enable Row Level Security
ALTER TABLE public.detection_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no authentication is implemented)
CREATE POLICY "Allow public read access to detection_history" 
ON public.detection_history 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to detection_history" 
ON public.detection_history 
FOR INSERT 
WITH CHECK (true);

-- Create storage bucket for plant images
INSERT INTO storage.buckets (id, name, public) VALUES ('plant-images', 'plant-images', true);

-- Create storage policies for plant images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'plant-images');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'plant-images');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'plant-images');