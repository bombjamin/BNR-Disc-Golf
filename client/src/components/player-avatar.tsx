import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateAvatarColor, getInitials } from "@/lib/utils";

interface PlayerAvatarProps {
  player: {
    name: string;
    profilePicture?: string | null;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10", 
  lg: "w-12 h-12"
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base"
};

export function PlayerAvatar({ player, size = "md", className = "" }: PlayerAvatarProps) {
  const avatarColor = generateAvatarColor(player.name);
  
  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {player.profilePicture && (
        <AvatarImage 
          src={player.profilePicture} 
          alt={`${player.name}'s profile picture`}
          className="object-cover"
        />
      )}
      <AvatarFallback 
        className={`text-white font-semibold ${textSizeClasses[size]}`}
        style={{ backgroundColor: avatarColor }}
      >
        {getInitials(player.name)}
      </AvatarFallback>
    </Avatar>
  );
}