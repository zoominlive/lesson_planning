import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, CheckCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ReferenceImageUploadProps {
  onStyleSet?: (styleDescription: string) => void;
  className?: string;
}

export default function ReferenceImageUpload({ onStyleSet, className }: ReferenceImageUploadProps) {
  const [hasStyle, setHasStyle] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image under 5MB.",
        variant: "destructive"
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setPreviewUrl(imageData);
      
      // Upload and analyze the image
      setIsUploading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/activities/analyze-reference-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          body: JSON.stringify({ imageData })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to analyze image');
        }

        setHasStyle(true);
        toast({
          title: "Style Set Successfully",
          description: "Your reference style will be applied to all generated images.",
        });

        if (onStyleSet && result.styleDescription) {
          onStyleSet(result.styleDescription);
        }
      } catch (error: any) {
        console.error('Error analyzing reference image:', error);
        toast({
          title: "Analysis Failed",
          description: error.message || "Failed to analyze the reference image. Please try again.",
          variant: "destructive"
        });
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const clearStyle = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/activities/clear-reference-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        }
      });

      if (!response.ok) {
        throw new Error('Failed to clear style');
      }

      setHasStyle(false);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: "Style Cleared",
        description: "Reference style has been removed.",
      });
    } catch (error) {
      console.error('Error clearing style:', error);
      toast({
        title: "Error",
        description: "Failed to clear reference style.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Reference Image Style (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Upload a reference image to match its visual style in all generated images.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          {previewUrl ? (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden border">
                <img 
                  src={previewUrl} 
                  alt="Reference style" 
                  className="w-full h-32 object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                {hasStyle && !isUploading && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={isUploading}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Change
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clearStyle();
                  }}
                  disabled={isUploading}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={isUploading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Reference Image
            </Button>
          )}

          {hasStyle && (
            <p className="text-xs text-green-600 dark:text-green-400">
              ✓ Style is active and will be applied to generated images
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}