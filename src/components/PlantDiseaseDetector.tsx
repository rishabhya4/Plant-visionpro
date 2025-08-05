import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Upload, Camera, AlertTriangle, CheckCircle, X, RefreshCw, Download, Share2, Image } from 'lucide-react';
import { toast } from 'sonner';
import { DetectionHistory, saveDetectionResult, uploadImage, deleteDetectionResult } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

interface DetectionResult {
  disease: string;
  confidence: number;
  treatment: string;
  severity: 'Low' | 'Medium' | 'High';
  symptoms: string;
  causes: string;
}

interface PlantDiseaseDetectorProps {
  onNewDetection?: () => void;
  selectedHistoryResult?: DetectionHistory | null;
  onClearSelection?: () => void;
}

export const PlantDiseaseDetector: React.FC<PlantDiseaseDetectorProps> = ({
  onNewDetection,
  selectedHistoryResult,
  onClearSelection
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Effect to handle selected history result
  useEffect(() => {
    if (selectedHistoryResult) {
      setSelectedImage(selectedHistoryResult.image_url);
      setSelectedFile(null);
      setResult({
        disease: selectedHistoryResult.disease,
        confidence: selectedHistoryResult.confidence,
        treatment: selectedHistoryResult.treatment,
        severity: selectedHistoryResult.severity,
        symptoms: (selectedHistoryResult as any).symptoms || 'Historical data - symptoms not recorded',
        causes: (selectedHistoryResult as any).causes || 'Historical data - causes not recorded',
      });
    }
  }, [selectedHistoryResult]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      // Clear any selected history result
      if (onClearSelection) {
        onClearSelection();
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setSelectedFile(file);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const callPlantDiseaseAPI = async (imageBase64: string): Promise<DetectionResult> => {
    try {
      console.log('Calling AI disease detection API...');
      
      const { data, error } = await supabase.functions.invoke('plant-disease-detection', {
        body: { imageBase64 }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'AI analysis failed');
      }

      if (!data) {
        throw new Error('No response from AI service');
      }

      // Validate the response structure
      if (!data.disease || typeof data.confidence !== 'number') {
        throw new Error('Invalid response format from AI service');
      }

      // Clean up text formatting (remove ** symbols and markdown)
      const cleanText = (text: string) => {
        return text
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/#{1,6}\s/g, '')
          .trim();
      };

      return {
        disease: cleanText(data.disease),
        confidence: Math.round(data.confidence),
        severity: data.severity || 'Medium',
        symptoms: cleanText(data.symptoms || 'Symptoms analysis not available'),
        causes: cleanText(data.causes || 'Cause analysis not available'),
        treatment: cleanText(data.treatment || 'Treatment recommendations not available')
      };
    } catch (error) {
      console.error('AI API call failed:', error);
      // Return a fallback response instead of throwing
      return {
        disease: 'Analysis Failed',
        confidence: 0,
        severity: 'Medium' as const,
        symptoms: 'Could not analyze image symptoms',
        causes: 'Analysis service unavailable',
        treatment: 'Please try uploading a clearer image or try again later'
      };
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage || !selectedFile) return;

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

      // Upload image to Supabase storage
      let imageUrl = selectedImage;
      try {
        imageUrl = await uploadImage(selectedFile);
      } catch (uploadError) {
        console.warn('Failed to upload to storage, using local image:', uploadError);
      }

      // Call the real AI detection API
      const detectionResult = await callPlantDiseaseAPI(selectedImage);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setResult(detectionResult);

      // Save to history
      try {
        await saveDetectionResult({
          image_url: imageUrl,
          disease: detectionResult.disease,
          confidence: detectionResult.confidence,
          treatment: detectionResult.treatment,
          severity: detectionResult.severity,
        });
        
        // Notify parent component of new detection
        if (onNewDetection) {
          onNewDetection();
        }
      } catch (saveError) {
        console.warn('Failed to save to history:', saveError);
      }
      
      toast.success('Analysis completed successfully!');
    } catch (error) {
      console.error('Detection failed:', error);
      toast.error('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOpen(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedImage(e.target?.result as string);
          setSelectedFile(file);
          setResult(null);
          stopCamera();
          // Clear any selected history result
          if (onClearSelection) {
            onClearSelection();
          }
        };
        reader.readAsDataURL(file);
      }
    }, 'image/jpeg', 0.8);
  };

  const retakePhoto = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setResult(null);
  };

  const downloadResult = () => {
    if (!result || !selectedImage) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height + 200; // Extra space for text
      
      if (ctx) {
        // Draw image
        ctx.drawImage(img, 0, 0);
        
        // Add text overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, img.height, canvas.width, 200);
        
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`Disease: ${result.disease}`, 20, img.height + 30);
        ctx.fillText(`Confidence: ${result.confidence}%`, 20, img.height + 60);
        ctx.fillText(`Severity: ${result.severity}`, 20, img.height + 90);
        
        // Download
        const link = document.createElement('a');
        link.download = `plant-analysis-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    };
    
    img.src = selectedImage;
  };

  const shareResult = async () => {
    if (!result) return;
    
    const shareData = {
      title: 'Plant Disease Detection Result',
      text: `Disease detected: ${result.disease} (${result.confidence}% confidence)\nSeverity: ${result.severity}\n\nTreatment: ${result.treatment}`,
      url: window.location.href
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.text);
        toast.success('Result copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Unable to share result');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Low': return 'bg-success/10 text-success border-success/20';
      case 'Medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'High': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
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
    <div className="space-y-6">
      {selectedHistoryResult && (
        <Card className="shadow-soft border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Viewing historical result</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-medium border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {selectedHistoryResult ? 'Historical Detection' : 'Plant Disease Detection'}
          </CardTitle>
          <CardDescription>
            {selectedHistoryResult 
              ? 'Viewing a previous detection result'
              : 'Upload a clear image of your plant to detect diseases and get treatment recommendations'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            {selectedImage ? (
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Selected plant"
                  className="max-w-md max-h-64 object-contain rounded-lg border border-border/50 shadow-soft"
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

            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="shadow-soft"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </Button>
              
              <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={startCamera}
                    variant="outline"
                    className="shadow-soft"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Camera Capture</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-64 object-cover"
                      />
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        onClick={capturePhoto}
                        className="gradient-primary"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Capture
                      </Button>
                      <Button 
                        onClick={stopCamera}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              {selectedImage && !selectedHistoryResult && (
                <Button 
                  onClick={analyzeImage}
                  disabled={isAnalyzing || !selectedFile}
                  className="gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
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
              
              {selectedImage && (
                <Button 
                  onClick={retakePhoto}
                  variant="ghost"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
              )}
            </div>

              {isAnalyzing && uploadProgress > 0 && (
                <div className="w-full max-w-md">
                  <div className="h-3 bg-muted rounded-full overflow-hidden shadow-soft">
                    <div 
                      className="h-full gradient-primary transition-all duration-300"
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
        <Card className="shadow-medium border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Detection Results
              <Badge 
                variant="outline" 
                className={`${getSeverityColor(result.severity)} shadow-soft`}
              >
                {getSeverityIcon(result.severity)}
                {result.severity} Risk
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 shadow-soft">
              <h3 className="font-semibold text-xl text-primary mb-2">{result.disease}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Confidence: <strong>{result.confidence}%</strong></span>
                {selectedHistoryResult && (
                  <span>Historical Result</span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/5 border border-muted/20 shadow-soft">
                <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Symptoms:
                </h4>
                <p className="text-muted-foreground leading-relaxed">{result.symptoms}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/5 border border-muted/20 shadow-soft">
                <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Causes:
                </h4>
                <p className="text-muted-foreground leading-relaxed">{result.causes}</p>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 shadow-soft">
              <h4 className="font-semibold mb-3 text-accent-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4" />
                Recommended Treatment:
              </h4>
              <p className="text-muted-foreground leading-relaxed">{result.treatment}</p>
            </div>

            <div className="pt-4 border-t border-border/50 space-y-4">
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  onClick={downloadResult}
                  variant="outline"
                  size="sm"
                  className="shadow-soft"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
                <Button 
                  onClick={shareResult}
                  variant="outline"
                  size="sm"
                  className="shadow-soft"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Result
                </Button>
                <Button 
                  onClick={retakePhoto}
                  variant="outline"
                  size="sm"
                  className="shadow-soft"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Analysis
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span>Always consult with a plant specialist for severe cases or if symptoms persist</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Hidden canvas for camera capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};