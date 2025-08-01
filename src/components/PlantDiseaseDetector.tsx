import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Camera, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { API_CONFIG } from '@/config/api';

interface DetectionResult {
  disease: string;
  confidence: number;
  treatment: string;
  severity: 'Low' | 'Medium' | 'High';
}

export const PlantDiseaseDetector = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateAPICall = async (imageBase64: string): Promise<DetectionResult> => {
    // Simulated ML API call with the provided API key
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock disease detection results
        const diseases = [
          { disease: 'Healthy Plant', confidence: 95, treatment: 'No treatment needed. Continue regular care.', severity: 'Low' as const },
          { disease: 'Leaf Blight', confidence: 87, treatment: 'Apply copper-based fungicide. Remove affected leaves.', severity: 'Medium' as const },
          { disease: 'Powdery Mildew', confidence: 92, treatment: 'Use baking soda spray. Improve air circulation.', severity: 'Medium' as const },
          { disease: 'Root Rot', confidence: 78, treatment: 'Reduce watering. Repot with fresh soil.', severity: 'High' as const },
          { disease: 'Aphid Infestation', confidence: 88, treatment: 'Use insecticidal soap or neem oil spray.', severity: 'Medium' as const }
        ];
        
        const randomResult = diseases[Math.floor(Math.random() * diseases.length)];
        resolve(randomResult);
      }, 3000);
    });
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // In a real implementation, you would send the image to your ML API
      // using the API_CONFIG.DISEASE_RECOGNITION_API_KEY
      const detectionResult = await simulateAPICall(selectedImage);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setResult(detectionResult);
      
      toast.success('Analysis completed successfully!');
    } catch (error) {
      console.error('Detection failed:', error);
      toast.error('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Low': return <CheckCircle className="h-4 w-4" />;
      case 'High': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
          Plant Vision Pro
        </h1>
        <p className="text-xl text-muted-foreground">
          AI-powered plant disease detection and treatment recommendations
        </p>
      </div>

      <Card className="border-2 border-dashed border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Upload Plant Image
          </CardTitle>
          <CardDescription>
            Upload a clear image of your plant to detect diseases and get treatment recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            {selectedImage ? (
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Selected plant"
                  className="max-w-md max-h-64 object-contain rounded-lg border"
                />
              </div>
            ) : (
              <div className="w-full h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No image selected</p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="flex gap-2">
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </Button>
              
              {selectedImage && (
                <Button 
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Detect Disease'
                  )}
                </Button>
              )}
            </div>

            {isAnalyzing && uploadProgress > 0 && (
              <div className="w-full max-w-md">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Processing image... {uploadProgress}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Detection Results
              <Badge className={getSeverityColor(result.severity)}>
                {getSeverityIcon(result.severity)}
                {result.severity} Risk
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{result.disease}</h3>
              <p className="text-muted-foreground">
                Confidence: {result.confidence}%
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Recommended Treatment:</h4>
              <p className="text-muted-foreground">{result.treatment}</p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                💡 Tip: Always consult with a plant specialist for severe cases
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};