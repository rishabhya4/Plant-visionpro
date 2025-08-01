import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { DetectionHistory as DetectionHistoryType } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface DetectionHistoryProps {
  history: DetectionHistoryType[];
  onSelectResult?: (result: DetectionHistoryType) => void;
}

export const DetectionHistory: React.FC<DetectionHistoryProps> = ({ 
  history, 
  onSelectResult 
}) => {
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
      case 'Low': return <CheckCircle className="h-3 w-3" />;
      case 'High': return <AlertTriangle className="h-3 w-3" />;
      default: return <AlertTriangle className="h-3 w-3" />;
    }
  };

  if (history.length === 0) {
    return (
      <Card className="shadow-soft border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Detection History
          </CardTitle>
          <CardDescription>
            Your previous plant disease detections will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No detections yet</p>
            <p className="text-sm">Upload your first plant image to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Detection History
        </CardTitle>
        <CardDescription>
          Recent plant disease detections ({history.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors cursor-pointer shadow-soft"
                onClick={() => onSelectResult?.(item)}
              >
                <img
                  src={item.image_url}
                  alt="Plant detection"
                  className="w-16 h-16 object-cover rounded-md border border-border/50"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{item.disease}</h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getSeverityColor(item.severity)}`}
                    >
                      {getSeverityIcon(item.severity)}
                      {item.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Confidence: {item.confidence}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};