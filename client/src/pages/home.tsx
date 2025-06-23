
import { useState } from "react";
import { PlusCircle, Users, Map, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreateGameModal } from "@/components/modals/create-game-modal";
import { JoinGameModal } from "@/components/modals/join-game-modal";
import { CourseMapModal } from "@/components/modals/course-map-modal";
import { PhotoGallery } from "@/components/photo-gallery";
import { WeatherWidget } from "@/components/weather-widget";
import { VideoPlayerModal } from "@/components/video-player-modal";
import bnrVideoCoverPath from "@assets/BNR video cover photo _1749492792717.jpg";

interface HomeProps {
  onGameCreated: (gameCode: string, gameId: number, playerId: number) => void;
  onGameJoined: (gameCode: string, gameId: number, playerId: number) => void;
}

export default function Home({ onGameCreated, onGameJoined }: HomeProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [courseMapOpen, setCourseMapOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center">
        {/* Course hero image with video player */}
        <div 
          className="relative rounded-2xl overflow-hidden mb-6 h-48 bg-cover bg-center shadow-lg transition-all duration-200 hover:shadow-lg" 
          style={{
            backgroundImage: `url('${bnrVideoCoverPath}')`
          }}
        >
          <div className="absolute inset-0 bg-golf-green bg-opacity-40 flex items-center justify-center">
            <div className="text-white text-center">
              <h2 className="text-3xl font-bold mb-2">18-Hole Championship Course</h2>
              <p className="text-lg opacity-90 mb-4">Track your scores in real-time</p>
              
              {/* Video Play Button */}
              <div className="flex items-center justify-center">
                <Button
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/50 text-white px-6 py-3 rounded-full transition-all duration-200 shadow-lg cursor-pointer"
                  onClick={() => setVideoModalOpen(true)}
                >
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  <span className="font-semibold">Watch Course Tour</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-transparent hover:border-golf-green">
          <CardContent className="p-6 text-center">
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="w-full bg-golf-green hover:bg-dark-green text-white font-semibold py-4 px-6 rounded-xl text-lg"
            >
              <PlusCircle className="w-6 h-6 mr-3" />
              Create Game
            </Button>
            <p className="mt-3 text-sm text-gray-600">
              Start a new game and invite friends
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-transparent hover:border-disc-orange">
          <CardContent className="p-6 text-center">
            <Button
              onClick={() => setJoinModalOpen(true)}
              className="w-full bg-disc-orange hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-xl text-lg"
            >
              <Users className="w-6 h-6 mr-3" />
              Join Game
            </Button>
            <p className="mt-3 text-sm text-gray-600">
              Join an existing game with a code
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Course Options */}
      <Card className="border border-gray-100 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-dark-green mb-4 flex items-center">
            <Map className="w-5 h-5 mr-2" />
            Course Options
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="text-center p-4 bg-golf-bg rounded-xl">
              <div className="text-2xl font-bold text-golf-green">9</div>
              <div className="text-sm text-gray-600">Front Nine</div>
            </div>
            <div className="text-center p-4 bg-golf-bg rounded-xl">
              <div className="text-2xl font-bold text-golf-green">9</div>
              <div className="text-sm text-gray-600">Back Nine</div>
            </div>
            <div className="text-center p-4 bg-golf-bg rounded-xl">
              <div className="text-2xl font-bold text-golf-green">18</div>
              <div className="text-sm text-gray-600">Full Round</div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <div className="px-6 py-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
              <Map className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-600 mb-1">Course Map Coming Soon</h3>
              <p className="text-sm text-gray-500">Interactive satellite course map is in development</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather Widget */}
      <WeatherWidget />

      {/* Photo Gallery */}
      <PhotoGallery 
        title="Master Photo Library"
        showGameInfo={true}
        className="mt-6"
      />

      {/* Modals */}
      <CreateGameModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onGameCreated={onGameCreated}
      />

      <JoinGameModal
        open={joinModalOpen}
        onOpenChange={setJoinModalOpen}
        onGameJoined={onGameJoined}
      />

      <CourseMapModal
        isOpen={courseMapOpen}
        onClose={() => setCourseMapOpen(false)}
        gameType="full18"
      />

      <VideoPlayerModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        title="Bar None Ranch Course Tour"
      />
    </div>
  );
}
