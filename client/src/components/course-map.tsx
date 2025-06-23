import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MapPin, ZoomIn, ZoomOut, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COURSE_CONFIG } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CourseMapProps {
  gameType?: "front9" | "back9" | "full18";
  currentHole?: number;
  onHoleSelect?: (hole: number) => void;
  onClose?: () => void;
}

interface HoleCoordinate {
  x: number;
  y: number;
  name: string;
}

export function CourseMap({ gameType = "full18", currentHole, onHoleSelect, onClose }: CourseMapProps) {
  const [satelliteImagePath, setSatelliteImagePath] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedHole, setSelectedHole] = useState<number | null>(currentHole || null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Query hole coordinates
  const { data: holeCoordinates } = useQuery<Record<number, HoleCoordinate>>({
    queryKey: ['/api/course/holes'],
  });

  // Process satellite image mutation
  const processSatelliteMutation = useMutation({
    mutationFn: async (googleDriveUrl: string) => {
      const response = await fetch('/api/process-satellite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleDriveUrl })
      });
      if (!response.ok) {
        throw new Error('Failed to process satellite image');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSatelliteImagePath(data.imagePath);
      setIsProcessing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/course/holes'] });
    },
    onError: (error) => {
      console.error('Failed to process satellite image:', error);
      setIsProcessing(false);
    }
  });

  // Auto-process the satellite image on component mount
  useEffect(() => {
    if (!satelliteImagePath && !isProcessing) {
      setIsProcessing(true);
      processSatelliteMutation.mutate('https://drive.google.com/file/d/1SeYAmsZGk3xV47MMoEgbdMAgpDSi7LYY/view?usp=share_link');
    }
  }, []);

  const courseConfig = COURSE_CONFIG[gameType];
  
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.5));
  
  const handleHoleClick = (holeNumber: number) => {
    setSelectedHole(holeNumber);
    onHoleSelect?.(holeNumber);
  };

  const getHoleRange = () => {
    if (gameType === "front9") return { start: 1, end: 9 };
    if (gameType === "back9") return { start: 10, end: 18 };
    return { start: 1, end: 18 };
  };

  const { start, end } = getHoleRange();

  if (isProcessing) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Course Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golf-green mx-auto"></div>
              <p className="text-gray-600">Processing satellite image...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Bar None Ranch Course Map
            <Badge variant="secondary" className="ml-2">
              {gameType === "front9" ? "Front 9" : 
               gameType === "back9" ? "Back 9" : "Full 18"}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '500px' }}>
          {satelliteImagePath ? (
            <div 
              className="relative w-full h-full cursor-move"
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: 'center center'
              }}
            >
              <img 
                src={satelliteImagePath}
                alt="Bar None Ranch Satellite View"
                className="w-full h-full object-cover"
                draggable={false}
              />
              
              {/* Hole markers */}
              {holeCoordinates && Object.entries(holeCoordinates).map(([holeNum, coords]) => {
                const holeNumber = parseInt(holeNum);
                if (holeNumber < start || holeNumber > end) return null;
                
                const isSelected = selectedHole === holeNumber;
                const isCurrent = currentHole === holeNumber;
                
                return (
                  <div
                    key={holeNumber}
                    className={`absolute w-8 h-8 rounded-full border-2 cursor-pointer transition-all transform -translate-x-1/2 -translate-y-1/2 ${
                      isCurrent 
                        ? "bg-blue-500 border-white scale-125 shadow-lg" 
                        : isSelected
                        ? "bg-golf-green border-white scale-110 shadow-md"
                        : "bg-white border-golf-green hover:scale-105 hover:shadow-md"
                    }`}
                    style={{
                      left: `${coords.x}%`,
                      top: `${coords.y}%`,
                    }}
                    onClick={() => handleHoleClick(holeNumber)}
                    title={`Hole ${holeNumber}: ${coords.name}`}
                  >
                    <div className={`flex items-center justify-center w-full h-full text-xs font-bold ${
                      isCurrent || isSelected ? "text-white" : "text-golf-green"
                    }`}>
                      {holeNumber}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto" />
                <p className="text-gray-500">Satellite image not available</p>
                <Button 
                  onClick={() => {
                    setIsProcessing(true);
                    processSatelliteMutation.mutate('https://drive.google.com/file/d/1SeYAmsZGk3xV47MMoEgbdMAgpDSi7LYY/view?usp=share_link');
                  }}
                  disabled={isProcessing}
                >
                  Load Course Map
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Hole information panel */}
        {selectedHole && holeCoordinates?.[selectedHole] && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">
                Hole {selectedHole}: {holeCoordinates[selectedHole].name}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedHole(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Par:</span>
                <span className="ml-2 font-semibold">{courseConfig.pars[selectedHole - 1]}</span>
              </div>
              <div>
                <span className="text-gray-600">Distance:</span>
                <span className="ml-2 font-semibold">{courseConfig.distances[selectedHole - 1]} ft</span>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 font-semibold">
                  {courseConfig.pars[selectedHole - 1] === 3 ? "Short" :
                   courseConfig.pars[selectedHole - 1] === 4 ? "Medium" : 
                   courseConfig.pars[selectedHole - 1] === 5 ? "Long" : "Ace Run"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex items-center space-x-6 text-xs text-gray-600">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white mr-2"></div>
            Current Hole
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-golf-green border-2 border-white mr-2"></div>
            Selected Hole
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-white border-2 border-golf-green mr-2"></div>
            Available Hole
          </div>
        </div>
      </CardContent>
    </Card>
  );
}