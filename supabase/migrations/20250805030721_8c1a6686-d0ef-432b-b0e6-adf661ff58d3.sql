-- Add DELETE policy for detection_history table
CREATE POLICY "Allow public delete access to detection_history" 
ON public.detection_history 
FOR DELETE 
USING (true);