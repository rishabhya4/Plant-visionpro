import React, { useState, useEffect } from 'react';
import { PlantDiseaseDetector } from './PlantDiseaseDetector';
import { DetectionHistory } from './DetectionHistory';
import { DetectionHistory as DetectionHistoryType, getDetectionHistory } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, Scan, Leaf } from 'lucide-react';

export const PlantDetectionLayout = () => {
  const [history, setHistory] = useState<DetectionHistoryType[]>([]);
  const [selectedResult, setSelectedResult] = useState<DetectionHistoryType | null>(null);
  const [activeTab, setActiveTab] = useState('detector');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const historyData = await getDetectionHistory(20);
    setHistory(historyData);
  };

  const handleNewDetection = () => {
    loadHistory(); // Refresh history when new detection is made
  };

  const handleSelectResult = (result: DetectionHistoryType) => {
    setSelectedResult(result);
    setActiveTab('detector'); // Switch to detector tab to show the result
  };

  return (
    <div className="min-h-screen gradient-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full gradient-primary shadow-glow">
              <Leaf className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold text-gradient">
              Plant Vision Pro
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced AI-powered plant disease detection with intelligent treatment recommendations and comprehensive history tracking
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-2 shadow-medium">
                <TabsTrigger value="detector" className="flex items-center gap-2">
                  <Scan className="h-4 w-4" />
                  Disease Detection
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History ({history.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="detector" className="mt-0">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <PlantDiseaseDetector 
                    onNewDetection={handleNewDetection}
                    selectedHistoryResult={selectedResult}
                    onClearSelection={() => setSelectedResult(null)}
                  />
                </div>
                <div className="lg:col-span-1">
                  <Card className="p-6 shadow-medium border-border/50">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Leaf className="h-5 w-5 text-primary" />
                      Quick Tips
                    </h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="font-medium text-primary mb-1">📸 Best Photo Tips</p>
                        <p>Ensure good lighting and focus on affected plant areas for accurate detection.</p>
                      </div>
                      <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                        <p className="font-medium text-accent-foreground mb-1">🌱 Prevention</p>
                        <p>Regular monitoring helps catch diseases early when they're easier to treat.</p>
                      </div>
                      <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                        <p className="font-medium text-warning-foreground mb-1">⚡ Quick Action</p>
                        <p>Act fast on high-severity detections to prevent spread to other plants.</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <div className="grid lg:grid-cols-2 gap-8">
                <DetectionHistory 
                  history={history} 
                  onSelectResult={handleSelectResult}
                />
                <Card className="p-6 shadow-medium border-border/50">
                  <h3 className="text-lg font-semibold mb-4">Analytics Overview</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                        <p className="text-2xl font-bold text-success">
                          {history.filter(h => h.severity === 'Low').length}
                        </p>
                        <p className="text-sm text-success/80">Low Risk</p>
                      </div>
                      <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                        <p className="text-2xl font-bold text-warning">
                          {history.filter(h => h.severity === 'Medium').length}
                        </p>
                        <p className="text-sm text-warning/80">Medium Risk</p>
                      </div>
                      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-2xl font-bold text-destructive">
                          {history.filter(h => h.severity === 'High').length}
                        </p>
                        <p className="text-sm text-destructive/80">High Risk</p>
                      </div>
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-2xl font-bold text-primary">
                          {history.length}
                        </p>
                        <p className="text-sm text-primary/80">Total Scans</p>
                      </div>
                    </div>
                    {history.length > 0 && (
                      <div className="pt-4 border-t border-border/50">
                        <p className="text-sm text-muted-foreground">
                          Most recent scan: {' '}
                          {new Date(history[0]?.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};