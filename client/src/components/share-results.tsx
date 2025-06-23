import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Share2, Download, X } from 'lucide-react';
import { GameWithPlayers, COURSE_CONFIG } from '@shared/schema';

interface ShareResultsProps {
  game: GameWithPlayers;
  leaderboard: Array<{
    player: any;
    totalStrokes: number;
    holesCompleted: number;
    relativeToPar: number;
  }>;
  courseDisplayName: string;
}

export function ShareResults({ game, leaderboard, courseDisplayName }: ShareResultsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateShareGraphic = async () => {
    if (!canvasRef.current) return;
    
    setIsGenerating(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const courseConfig = COURSE_CONFIG[game.courseType as keyof typeof COURSE_CONFIG];
    
    // Calculate detailed player scores for each hole
    const detailedResults = leaderboard.map(result => {
      const holeScores: { [hole: number]: number } = {};
      const playerScores = game.scores.filter(s => s.playerId === result.player.id);
      
      playerScores.forEach(score => {
        holeScores[score.hole] = score.strokes;
      });
      
      return {
        ...result,
        holeScores
      };
    });

    // Compact sizing similar to scorecard
    const width = 1080;
    const headerHeight = 150; // More space after title
    const playerSectionHeight = 80; // More compact player section
    const footerHeight = 50;
    
    const height = headerHeight + (leaderboard.length * playerSectionHeight) + footerHeight;
    
    canvas.width = width;
    canvas.height = height;

    // App theme colors - simplified palette
    const colors = {
      background: '#f5f5f0',
      cardBg: '#ffffff',
      darkText: '#1f2937',
      lightText: '#6b7280',
      accent: '#42361e', // Single accent color
      border: '#e5e7eb'
    };

    // Preload all profile images
    const profileImages: { [playerId: number]: HTMLImageElement } = {};
    const imageLoadPromises: Promise<void>[] = [];

    detailedResults.forEach(result => {
      if (result.player.profilePicture) {
        const promise = new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            profileImages[result.player.id] = img;
            resolve();
          };
          img.onerror = () => {
            resolve(); // Continue even if image fails to load
          };
          // Handle profile picture URL
          const profileUrl = result.player.profilePicture.startsWith('/') 
            ? `${window.location.origin}${result.player.profilePicture}`
            : result.player.profilePicture;
          img.src = profileUrl;
        });
        imageLoadPromises.push(promise);
      }
    });

    // Wait for all images to load, then draw
    await Promise.all(imageLoadPromises);

    // Background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    // Single outer border
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Load and draw app logo
    const logoImg = new Image();
    logoImg.onload = () => {
      // Bigger logo as requested
      const logoSize = 60;
      ctx.drawImage(logoImg, 40, 30, logoSize, logoSize);
      continueDrawing();
    };
    logoImg.onerror = () => {
      continueDrawing();
    };
    logoImg.src = '/android-chrome-192x192.png';

    const continueDrawing = () => {
      // Header section
      ctx.fillStyle = colors.darkText;
      ctx.font = 'bold 32px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BAR NONE RANCH', width / 2, 50);
      
      ctx.font = '16px Arial, sans-serif';
      ctx.fillText('DISC GOLF', width / 2, 70);

      // Course info
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText(`${courseDisplayName} Results`, width / 2, 95);

      // Date moved to header, right-aligned
      ctx.font = '14px Arial, sans-serif';
      ctx.fillStyle = colors.lightText;
      ctx.textAlign = 'right';
      const gameDate = new Date(game.createdAt).toLocaleDateString('en-US', {
        timeZone: 'America/Chicago',
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      ctx.fillText(gameDate, width - 40, 50);

      // Calculate total par for course
      const totalPar = courseConfig.pars.reduce((sum, par) => sum + par, 0);

      // Final score header - right aligned and properly positioned
      ctx.fillStyle = colors.darkText;
      ctx.font = '14px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FINAL', width - 80, headerHeight - 40);
      ctx.fillStyle = colors.lightText;
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText(`Par ${totalPar}`, width - 80, headerHeight - 25);

      // Par header row - positioned with more space after title
      const startX = 150; // More space for ranking number
      const holeWidth = (width - 320) / courseConfig.holes; // Leave more space for final score
      
      let yPos = headerHeight - 35;
      ctx.fillStyle = colors.lightText;
      ctx.font = '12px Arial, sans-serif';
      ctx.textAlign = 'center';
      
      for (let hole = 1; hole <= courseConfig.holes; hole++) {
        const holeX = startX + (hole - 1) * holeWidth;
        ctx.fillText(`${hole}`, holeX, yPos);
        ctx.fillText(`Par ${courseConfig.pars[hole - 1]}`, holeX, yPos + 12);
      }

      yPos = headerHeight;

      // Draw each player's results in compact format
      detailedResults.forEach((result, playerIndex) => {
        const position = playerIndex + 1;
        const playerName = result.player.name || 'Unknown Player';
        
        // Player card background - no individual borders
        ctx.fillStyle = colors.cardBg;
        ctx.fillRect(30, yPos, width - 60, 70);

        // Ranking number on the left
        ctx.fillStyle = colors.darkText;
        ctx.font = '20px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${position}`, 50, yPos + 35);

        // Player avatar circle with profile picture support
        const avatarX = 90;
        const avatarY = yPos + 25;
        const avatarRadius = 16;
        
        // Check if we have a preloaded profile image
        const profileImg = profileImages[result.player.id];
        
        if (profileImg) {
          // Draw profile picture
          ctx.save();
          ctx.beginPath();
          ctx.arc(avatarX, avatarY, avatarRadius, 0, 2 * Math.PI);
          ctx.clip();
          ctx.drawImage(profileImg, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
          ctx.restore();
        } else {
          // Draw initials circle as fallback
          ctx.fillStyle = colors.accent;
          ctx.beginPath();
          ctx.arc(avatarX, avatarY, avatarRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.fillStyle = colors.cardBg;
          ctx.font = '12px Arial, sans-serif';
          ctx.textAlign = 'center';
          const initials = playerName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
          ctx.fillText(initials, avatarX, avatarY + 4);
        }

        // Player name under the photo - moved down with more space
        ctx.fillStyle = colors.darkText;
        ctx.font = '13px Arial, sans-serif';
        ctx.textAlign = 'center';
        // Don't truncate the name - show full name
        ctx.fillText(playerName, avatarX, yPos + 55);

        // Final score in right column - aligned properly
        ctx.textAlign = 'center';
        ctx.font = '20px Arial, sans-serif';
        ctx.fillText(`${result.totalStrokes}`, width - 80, yPos + 25);
        
        // To Par below final score - aligned with final score
        const relativeScore = result.relativeToPar;
        let scoreText = '';
        
        if (relativeScore === 0) {
          scoreText = 'E';
        } else if (relativeScore > 0) {
          scoreText = `+${relativeScore}`;
        } else {
          scoreText = `${relativeScore}`;
        }
        
        ctx.fillStyle = colors.accent;
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText(scoreText, width - 80, yPos + 45);

        // Player scores - aligned with par header
        for (let hole = 1; hole <= courseConfig.holes; hole++) {
          const holeX = startX + (hole - 1) * holeWidth;
          
          const playerScore = result.holeScores[hole];
          if (playerScore !== undefined) {
            ctx.fillStyle = colors.accent;
            ctx.font = '16px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${playerScore}`, holeX, yPos + 35);
          } else {
            ctx.fillStyle = colors.lightText;
            ctx.font = '14px Arial, sans-serif';
            ctx.fillText('-', holeX, yPos + 35);
          }
        }

        yPos += playerSectionHeight;
      });

      // Footer - positioned above border
      yPos += 10; // Small gap after last player
      ctx.fillStyle = colors.lightText;
      ctx.font = '12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Bar None Ranch Disc Golf • Where Champions Throw', width / 2, yPos);
      ctx.fillText('www.barnonediscgolf.com', width / 2, yPos + 15);

      // Convert to blob and create URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setGeneratedImage(url);
        }
        setIsGenerating(false);
      }, 'image/png', 0.95);
    };
  };

  // Helper function to draw rounded rectangles
  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // Helper function to draw crown
  const drawCrown = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - 15, y + 10);
    ctx.lineTo(x - 10, y);
    ctx.lineTo(x - 5, y + 8);
    ctx.lineTo(x, y - 2);
    ctx.lineTo(x + 5, y + 8);
    ctx.lineTo(x + 10, y);
    ctx.lineTo(x + 15, y + 10);
    ctx.closePath();
    ctx.fill();
    
    // Crown jewels
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x, y + 2, 2, 0, 2 * Math.PI);
    ctx.fill();
  };

  const handleShare = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const file = new File([blob], `bar-none-ranch-${game.code}-results.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Bar None Ranch Disc Golf - ${courseDisplayName} Results`,
          text: `Check out our ${courseDisplayName} game results from Bar None Ranch Disc Golf!`,
          files: [file]
        });
      } else {
        // Fallback: download the image
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `bar-none-ranch-${game.code}-results.png`;
        link.click();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: download the image
      if (generatedImage) {
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `bar-none-ranch-${game.code}-results.png`;
        link.click();
      }
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `bar-none-ranch-${game.code}-results.png`;
    link.click();
  };

  useEffect(() => {
    if (isOpen && !generatedImage) {
      // Small delay to ensure canvas is ready
      setTimeout(generateShareGraphic, 100);
    }
  }, [isOpen]);

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-golf-green hover:bg-golf-green/90 text-white"
        size="sm"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share Results
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Share Game Results
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {isGenerating && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-golf-green border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Generating your results graphic...</p>
              </div>
            )}
            
            {generatedImage && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <img 
                    src={generatedImage} 
                    alt="Game Results"
                    className="w-full h-auto rounded border"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleShare}
                    className="flex-1 bg-golf-green hover:bg-golf-green/90"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button 
                    onClick={handleDownload}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
                
                <p className="text-xs text-center text-gray-500">
                  Share your results on social media or save to your device
                </p>
              </div>
            )}
          </div>
          
          {/* Hidden canvas for generating the image */}
          <canvas 
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}