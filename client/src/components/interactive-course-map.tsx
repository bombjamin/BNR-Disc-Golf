import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, ZoomIn, ZoomOut, RotateCcw, Save, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { COURSE_CONFIG } from "@shared/schema";

interface InteractiveCourseMapProps {
  gameType?: "front9" | "back9" | "full18";
  currentHole?: number;
  editMode?: boolean;
  onHoleSelect?: (hole: number) => void;
  onClose?: () => void;
}

interface HolePosition {
  x: number;
  y: number;
  name: string;
}

export function InteractiveCourseMap({ 
  gameType = "full18", 
  currentHole, 
  editMode = false,
  onHoleSelect, 
  onClose 
}: InteractiveCourseMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedHole, setSelectedHole] = useState<number | null>(currentHole || null);
  const [isDraggingHole, setIsDraggingHole] = useState<number | null>(null);
  const [holePositions, setHolePositions] = useState<Record<number, HolePosition>>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load satellite image
  const { data: satelliteImage } = useQuery<{
    originalPath: string;
    optimizedPath: string;
    thumbnailPath: string;
  }>({
    queryKey: ['/api/satellite-image'],
    retry: false,
  });

  // Load hole coordinates
  const { data: serverHoleCoordinates } = useQuery<Record<number, HolePosition>>({
    queryKey: ['/api/course/holes'],
  });

  // Initialize hole positions
  useEffect(() => {
    if (serverHoleCoordinates) {
      setHolePositions(serverHoleCoordinates);
    } else {
      // Default positions
      const defaultPositions: Record<number, HolePosition> = {};
      for (let i = 1; i <= 18; i++) {
        const angle = (i - 1) * (360 / 18) * (Math.PI / 180);
        const radius = 30;
        const centerX = 50;
        const centerY = 50;
        defaultPositions[i] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          name: COURSE_CONFIG.full18.nicknames[i - 1] || `Hole ${i}`
        };
      }
      setHolePositions(defaultPositions);
    }
  }, [serverHoleCoordinates]);

  const courseConfig = COURSE_CONFIG[gameType];
  const { start, end } = getHoleRange();

  function getHoleRange() {
    if (gameType === "front9") return { start: 1, end: 9 };
    if (gameType === "back9") return { start: 10, end: 18 };
    return { start: 1, end: 18 };
  }

  // Save hole positions mutation
  const savePositionsMutation = useMutation({
    mutationFn: async (positions: Record<number, HolePosition>) => {
      const response = await fetch('/api/course/holes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(positions)
      });
      if (!response.ok) throw new Error('Failed to save positions');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Hole Positions Saved",
        description: "Course layout has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/course/holes'] });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Could not save hole positions. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mouse/touch event handlers for pan and zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDraggingHole) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isDraggingHole) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingHole(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.5), 5));
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Hole marker event handlers
  const handleHoleMouseDown = (e: React.MouseEvent, holeNumber: number) => {
    e.stopPropagation();
    if (editMode) {
      setIsDraggingHole(holeNumber);
    } else {
      setSelectedHole(holeNumber);
      onHoleSelect?.(holeNumber);
    }
  };

  const handleHoleMouseMove = (e: React.MouseEvent, holeNumber: number) => {
    if (isDraggingHole === holeNumber && editMode && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left - pan.x) / zoom) / rect.width * 100;
      const y = ((e.clientY - rect.top - pan.y) / zoom) / rect.height * 100;
      
      setHolePositions(prev => ({
        ...prev,
        [holeNumber]: {
          ...prev[holeNumber],
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y))
        }
      }));
    }
  };

  const saveHolePositions = () => {
    savePositionsMutation.mutate(holePositions);
  };

  if (!satelliteImage) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No satellite image available</p>
          <p className="text-sm text-gray-400 mt-2">Upload a satellite image to view the course map</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Interactive Course Map
            <Badge variant="secondary" className="ml-2">
              {gameType === "front9" ? "Front 9" : 
               gameType === "back9" ? "Back 9" : "Full 18"}
            </Badge>
            {editMode && (
              <Badge variant="outline" className="ml-2">
                <Move className="w-3 h-3 mr-1" />
                Edit Mode
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            {editMode && (
              <Button 
                onClick={saveHolePositions}
                disabled={savePositionsMutation.isPending}
                size="sm"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef}
          className="relative bg-gray-100 rounded-lg overflow-hidden cursor-move select-none"
          style={{ height: '600px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={(e) => {
            handleMouseMove(e);
            if (isDraggingHole) {
              handleHoleMouseMove(e, isDraggingHole);
            }
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div 
            className="absolute inset-0 transition-transform duration-200"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center'
            }}
          >
            <img 
              ref={imageRef}
              src={satelliteImage.optimizedPath}
              alt="Bar None Ranch Satellite View"
              className="w-full h-full object-cover"
              draggable={false}
            />
            
            {/* Hole markers */}
            {Object.entries(holePositions).map(([holeNum, position]) => {
              const holeNumber = parseInt(holeNum);
              if (holeNumber < start || holeNumber > end) return null;
              
              const isSelected = selectedHole === holeNumber;
              const isCurrent = currentHole === holeNumber;
              const isDragging = isDraggingHole === holeNumber;
              
              // Calculate dynamic marker size based on zoom level
              const baseSize = 48; // 12 * 4 (w-12 h-12 = 48px)
              const minSize = 12; // Much smaller minimum size at max zoom
              const maxSize = 60; // Maximum size at min zoom
              const dynamicSize = Math.max(minSize, Math.min(maxSize, baseSize / (zoom * 1.2)));
              const fontSize = Math.max(8, Math.min(14, 12 / zoom));
              const borderWidth = Math.max(0.5, Math.min(3, 2 / zoom));
              
              return (
                <div
                  key={holeNumber}
                  className={`absolute rounded-full transition-all transform -translate-x-1/2 -translate-y-1/2 ${
                    editMode ? 'cursor-move' : 'cursor-pointer'
                  } ${
                    isCurrent 
                      ? "bg-blue-500 border-white shadow-lg" 
                      : isSelected
                      ? "bg-golf-green border-white shadow-md"
                      : "bg-white border-golf-green hover:shadow-md"
                  } ${isDragging ? 'shadow-lg' : ''}`}
                  style={{
                    width: `${dynamicSize}px`,
                    height: `${dynamicSize}px`,
                    borderWidth: `${borderWidth}px`,
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    zIndex: isDragging ? 1000 : 10,
                    transform: `translate(-50%, -50%) ${
                      isCurrent ? 'scale(1.2)' : 
                      isSelected ? 'scale(1.1)' : 
                      isDragging ? 'scale(1.25)' : 'scale(1)'
                    }`
                  }}
                  onMouseDown={(e) => handleHoleMouseDown(e, holeNumber)}
                  title={`Hole ${holeNumber}: ${position.name}`}
                >
                  <div 
                    className={`flex items-center justify-center w-full h-full font-bold ${
                      isCurrent || isSelected ? "text-white" : "text-golf-green"
                    }`}
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {holeNumber}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Zoom level indicator */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {Math.round(zoom * 100)}%
          </div>
          
          {/* Instructions */}
          <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-2 rounded text-sm max-w-xs">
            {editMode ? (
              <>
                <div className="font-semibold mb-1">Edit Mode:</div>
                <div>• Drag holes to reposition</div>
                <div>• Use mouse wheel to zoom</div>
                <div>• Drag background to pan</div>
                <div>• Click Save when done</div>
              </>
            ) : (
              <>
                <div className="font-semibold mb-1">Navigation:</div>
                <div>• Mouse wheel to zoom</div>
                <div>• Drag to pan</div>
                <div>• Click holes for info</div>
              </>
            )}
          </div>
        </div>

        {/* Hole information panel */}
        {selectedHole && holePositions[selectedHole] && !editMode && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">
                Hole {selectedHole}: {holePositions[selectedHole].name}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedHole(null)}
              >
                ×
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
                <span className="text-gray-600">Position:</span>
                <span className="ml-2 font-semibold">
                  {Math.round(holePositions[selectedHole].x)}%, {Math.round(holePositions[selectedHole].y)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}