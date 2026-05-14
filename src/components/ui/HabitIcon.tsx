import React from 'react';
import {
  Flame,
  BookOpen,
  Brain,
  Droplets,
  Dumbbell,
  Apple,
  Moon,
  Sun,
  Heart,
  Footprints,
  Pencil,
  Coffee,
  Music,
  Smile,
  Sparkles,
  Bike,
  Leaf,
  Pill,
  Target,
  Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const HABIT_ICONS: { id: string; Icon: LucideIcon }[] = [
  { id: 'flame', Icon: Flame },
  { id: 'book', Icon: BookOpen },
  { id: 'brain', Icon: Brain },
  { id: 'droplets', Icon: Droplets },
  { id: 'dumbbell', Icon: Dumbbell },
  { id: 'apple', Icon: Apple },
  { id: 'moon', Icon: Moon },
  { id: 'sun', Icon: Sun },
  { id: 'heart', Icon: Heart },
  { id: 'footprints', Icon: Footprints },
  { id: 'pencil', Icon: Pencil },
  { id: 'coffee', Icon: Coffee },
  { id: 'music', Icon: Music },
  { id: 'smile', Icon: Smile },
  { id: 'sparkles', Icon: Sparkles },
  { id: 'bike', Icon: Bike },
  { id: 'leaf', Icon: Leaf },
  { id: 'pill', Icon: Pill },
  { id: 'target', Icon: Target },
  { id: 'trophy', Icon: Trophy },
];

interface HabitIconProps {
  iconId: string;
  size?: number;
  color?: string;
}

const HabitIcon: React.FC<HabitIconProps> = ({ iconId, size = 22, color = '#000000' }) => {
  const match = HABIT_ICONS.find(({ id }) => id === iconId);
  const Icon = match?.Icon ?? Target;

  return <Icon size={size} strokeWidth={2} color={color} />;
};

export default HabitIcon;
