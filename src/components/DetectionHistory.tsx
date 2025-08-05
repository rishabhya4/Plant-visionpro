import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Clock, AlertTriangle, CheckCircle, Trash2, MoreVertical } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { DetectionHistory as DetectionHistoryType, deleteDetectionResult } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface DetectionHistoryProps {
  history: DetectionHistoryType[];
  onSelectResult?: (result: DetectionHistoryType) => void;
  onHistoryUpdate?: () => void;
}

export const DetectionHistory: React.FC<DetectionHistoryProps> = ({ 
  history, 
  onSelectResult,
  onHistoryUpdate
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDetectionResult(id);
      toast.success('Detection result deleted successfully');
      if (onHistoryUpdate) {
        onHistoryUpdate();
      }
    } catch (error) {
      console.error('Error deleting detection result:', error);
      toast.error('Failed to delete detection result');
    } finally {
      setDeletingId(null);
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
                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors shadow-soft"
              >
                <img
                  src={item.image_url}
                  alt="Plant detection"
                  className="w-16 h-16 object-cover rounded-md border border-border/50 cursor-pointer"
                  onClick={() => onSelectResult?.(item)}
                />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectResult?.(item)}>
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
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onSelectResult?.(item)}>
                      View Details
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Detection Result</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this detection result? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};