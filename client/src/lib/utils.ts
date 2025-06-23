import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(score: number, par: number): string {
  const diff = score - par;
  if (diff === 0) return "E";
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}

export function getScoreColor(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -2) return "text-blue-600"; // Eagle or better
  if (diff === -1) return "text-green-600"; // Birdie
  if (diff === 0) return "text-gray-900"; // Par
  if (diff === 1) return "text-yellow-600"; // Bogey
  if (diff === 2) return "text-orange-600"; // Double bogey
  return "text-red-600"; // Triple bogey or worse
}

export function getScoreBgColor(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -2) return "bg-blue-500 hover:bg-blue-600"; // Eagle or better
  if (diff === -1) return "bg-green-500 hover:bg-green-600"; // Birdie
  if (diff === 0) return "bg-emerald-500 hover:bg-emerald-600"; // Par
  if (diff === 1) return "bg-yellow-500 hover:bg-yellow-600"; // Bogey
  if (diff === 2) return "bg-orange-500 hover:bg-orange-600"; // Double bogey
  return "bg-red-500 hover:bg-red-600"; // Triple bogey or worse
}

export function generateAvatarColor(name: string): string {
  const colors = [
    "bg-golf-green",
    "bg-disc-orange", 
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-cyan-500"
  ];
  
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function getInitials(name: string): string {
  return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
}

export function pollForUpdates<T>(
  queryFn: () => Promise<T>, 
  intervalMs: number = 3000
): () => void {
  const interval = setInterval(queryFn, intervalMs);
  return () => clearInterval(interval);
}
