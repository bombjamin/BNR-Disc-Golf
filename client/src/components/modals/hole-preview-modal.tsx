import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Target, Ruler } from "lucide-react";
import { COURSE_CONFIG } from "@shared/schema";

interface HolePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  holeNumber: number;
  courseType: "front9" | "back9" | "full18";
  satelliteImagePath?: string;
  onStartHole?: () => void;
}

export function HolePreviewModal({ 
  isOpen, 
  onClose, 
  holeNumber, 
  courseType, 
  satelliteImagePath,
  onStartHole 
}: HolePreviewModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const courseConfig = COURSE_CONFIG[courseType];
  const holeIndex = holeNumber - 1;
  const par = courseConfig.pars[holeIndex];
  const distance = courseConfig.distances[holeIndex];
  const nickname = courseConfig.nicknames[holeIndex];

  const getParDescription = (par: number) => {
    switch (par) {
      case 2: return "Ace Run";
      case 3: return "Short Hole";
      case 4: return "Medium Hole";
      case 5: return "Long Hole";
      default: return "Standard Hole";
    }
  };

  const getHoleStrategy = (par: number, distance: number) => {
    if (par === 2) return "Aim for the chains! This short hole rewards precision over power.";
    if (par === 3 && distance < 200) return "A controlled throw with good accuracy will set up an easy putt.";
    if (par === 3 && distance > 300) return "Consider a safe landing zone and plan your approach shot.";
    if (par === 4) return "This longer hole requires strategic placement. Plan your route carefully.";
    if (par === 5) return "The longest hole on the course. Focus on consistent, advancing throws.";
    return "Choose your disc and line carefully for the best approach.";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Target className="w-6 h-6 mr-2 text-golf-green" />
            Hole {holeNumber}: {nickname}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Hole Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-golf-green" />
              </div>
              <div className="text-2xl font-bold text-golf-green">Par {par}</div>
              <div className="text-sm text-gray-600">{getParDescription(par)}</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Ruler className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{distance}ft</div>
              <div className="text-sm text-gray-600">Total Distance</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Navigation className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">#{holeNumber}</div>
              <div className="text-sm text-gray-600">Hole Number</div>
            </div>
          </div>

          {/* Satellite Image Preview */}
          {satelliteImagePath && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Aerial View
              </h3>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '300px' }}>
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-golf-green"></div>
                  </div>
                )}
                <img 
                  src={satelliteImagePath}
                  alt={`Hole ${holeNumber} aerial view`}
                  className="w-full h-full object-cover"
                  onLoad={() => setImageLoaded(true)}
                  style={{ 
                    filter: imageLoaded ? 'none' : 'blur(5px)',
                    transition: 'filter 0.3s ease'
                  }}
                />
                
                {/* Hole marker overlay */}
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-white/90 text-golf-green">
                    Hole {holeNumber}: {nickname}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Strategy Tips */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Strategy</h3>
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-gray-700">{getHoleStrategy(par, distance)}</p>
            </div>
          </div>

          {/* Hole Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800">Hole Information</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nickname:</span>
                  <span className="font-medium">{nickname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Par:</span>
                  <span className="font-medium">{par}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-medium">{distance} feet</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800">Course Progress</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Course:</span>
                  <span className="font-medium">
                    {courseType === "front9" ? "Front 9" : 
                     courseType === "back9" ? "Back 9" : "Full 18"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hole:</span>
                  <span className="font-medium">
                    {holeNumber} of {courseConfig.holes}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Progress:</span>
                  <span className="font-medium">
                    {Math.round((holeNumber / courseConfig.holes) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close Preview
            </Button>
            {onStartHole && (
              <Button onClick={onStartHole} className="flex-1 bg-golf-green hover:bg-golf-green/90">
                Start Playing Hole
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}