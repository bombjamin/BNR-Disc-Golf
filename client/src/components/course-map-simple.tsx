import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Info, Target, Ruler } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COURSE_CONFIG } from "@shared/schema";

interface CourseMapSimpleProps {
  gameType?: "front9" | "back9" | "full18";
  currentHole?: number;
  onHoleSelect?: (hole: number) => void;
  showHoleInfo?: boolean;
}

export function CourseMapSimple({ 
  gameType = "full18", 
  currentHole, 
  onHoleSelect,
  showHoleInfo = true 
}: CourseMapSimpleProps) {
  const [selectedHole, setSelectedHole] = useState<number | null>(currentHole || null);
  
  // Check for uploaded satellite image
  const { data: satelliteImage } = useQuery<{
    originalPath: string;
    optimizedPath: string;
    thumbnailPath: string;
  }>({
    queryKey: ['/api/satellite-image'],
    retry: false,
  });
  
  const courseConfig = COURSE_CONFIG[gameType];
  
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

  // Static hole layout for Bar None Ranch course
  const holePositions = {
    1: { x: 15, y: 20, name: "Downhill Drive" },
    2: { x: 25, y: 15, name: "Crosswind Challenge" },
    3: { x: 40, y: 10, name: "Across the Pasture" },
    4: { x: 55, y: 15, name: "Threading the Needle" },
    5: { x: 70, y: 20, name: "Tree-ohi" },
    6: { x: 80, y: 30, name: "Round the Bend" },
    7: { x: 75, y: 45, name: "Back to the Bush" },
    8: { x: 65, y: 55, name: "Drive the Line" },
    9: { x: 50, y: 60, name: "Through the V" },
    10: { x: 35, y: 65, name: "Sunset" },
    11: { x: 20, y: 70, name: "Stiletto" },
    12: { x: 10, y: 75, name: "Tunnel Vision" },
    13: { x: 15, y: 85, name: "Lucky" },
    14: { x: 30, y: 90, name: "Lost" },
    15: { x: 45, y: 85, name: "The Damn Hole" },
    16: { x: 60, y: 80, name: "The Big Show" },
    17: { x: 75, y: 75, name: "Found" },
    18: { x: 85, y: 65, name: "Coming Home" }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Bar None Ranch Course Layout
          <Badge variant="secondary" className="ml-2">
            {gameType === "front9" ? "Front 9" : 
             gameType === "back9" ? "Back 9" : "Full 18"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Course map visualization */}
          <div 
            className="relative bg-gradient-to-br from-green-100 to-green-200 rounded-lg border-2 border-green-300 overflow-hidden"
            style={{ height: '400px' }}
          >
            {satelliteImage ? (
              /* Satellite image background */
              <img 
                src={satelliteImage.optimizedPath}
                alt="Bar None Ranch Satellite View"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              /* Fallback visualization */
              <div className="absolute inset-0">
                {/* Trees/obstacles */}
                <div className="absolute top-4 left-8 w-6 h-6 bg-green-600 rounded-full opacity-30"></div>
                <div className="absolute top-12 right-12 w-4 h-4 bg-green-600 rounded-full opacity-30"></div>
                <div className="absolute bottom-16 left-16 w-8 h-8 bg-green-600 rounded-full opacity-30"></div>
                <div className="absolute bottom-8 right-20 w-5 h-5 bg-green-600 rounded-full opacity-30"></div>
                
                {/* Water hazard */}
                <div className="absolute bottom-20 left-1/3 w-20 h-8 bg-blue-300 rounded-full opacity-40"></div>
                
                {/* Fairways */}
                <div className="absolute inset-4 border border-green-400 rounded-lg opacity-20"></div>
              </div>
            )}

            {/* Hole markers */}
            {Object.entries(holePositions).map(([holeNum, position]) => {
              const holeNumber = parseInt(holeNum);
              if (holeNumber < start || holeNumber > end) return null;
              
              const isSelected = selectedHole === holeNumber;
              const isCurrent = currentHole === holeNumber;
              
              return (
                <div
                  key={holeNumber}
                  className={`absolute w-10 h-10 rounded-full border-2 cursor-pointer transition-all transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center font-bold text-sm ${
                    isCurrent 
                      ? "bg-blue-500 border-white scale-125 shadow-lg text-white" 
                      : isSelected
                      ? "bg-golf-green border-white scale-110 shadow-md text-white"
                      : "bg-white border-golf-green hover:scale-105 hover:shadow-md text-golf-green hover:bg-green-50"
                  }`}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                  }}
                  onClick={() => handleHoleClick(holeNumber)}
                  title={`Hole ${holeNumber}: ${position.name}`}
                >
                  {holeNumber}
                </div>
              );
            })}

            {/* Course name overlay */}
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="bg-white/90 text-golf-green font-semibold">
                Bar None Ranch Disc Golf Course
              </Badge>
            </div>
          </div>

          {/* Hole information panel */}
          {showHoleInfo && selectedHole && holePositions[selectedHole as keyof typeof holePositions] && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center">
                  <Target className="w-5 h-5 mr-2 text-golf-green" />
                  Hole {selectedHole}: {holePositions[selectedHole as keyof typeof holePositions].name}
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedHole(null)}
                >
                  Close
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white rounded border">
                  <div className="flex items-center justify-center mb-1">
                    <Target className="w-4 h-4 text-golf-green" />
                  </div>
                  <div className="text-xl font-bold text-golf-green">
                    Par {courseConfig.pars[selectedHole - 1]}
                  </div>
                  <div className="text-xs text-gray-600">Target Score</div>
                </div>
                
                <div className="text-center p-3 bg-white rounded border">
                  <div className="flex items-center justify-center mb-1">
                    <Ruler className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xl font-bold text-blue-600">
                    {courseConfig.distances[selectedHole - 1]}ft
                  </div>
                  <div className="text-xs text-gray-600">Distance</div>
                </div>
                
                <div className="text-center p-3 bg-white rounded border">
                  <div className="flex items-center justify-center mb-1">
                    <Info className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-xl font-bold text-purple-600">
                    {courseConfig.pars[selectedHole - 1] === 2 ? "Ace" :
                     courseConfig.pars[selectedHole - 1] === 3 ? "Short" :
                     courseConfig.pars[selectedHole - 1] === 4 ? "Mid" : "Long"}
                  </div>
                  <div className="text-xs text-gray-600">Hole Type</div>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-600 pt-2 border-t">
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
        </div>
      </CardContent>
    </Card>
  );
}