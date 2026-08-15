import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', color }) => {
  // @ts-ignore
  const IconComponent = Icons[name] || Icons.Tag;

  return <IconComponent className={className} style={{ color }} />;
};

export const AVAILABLE_CATEGORY_ICONS = [
  'Utensils',
  'ShoppingBag',
  'ShoppingCart',
  'Bus',
  'Fuel',
  'Receipt',
  'Home',
  'Landmark',
  'HeartPulse',
  'GraduationCap',
  'Film',
  'Plane',
  'ShieldCheck',
  'TrendingUp',
  'Briefcase',
  'Laptop',
  'Building2',
  'Award',
  'Percent',
  'Gift',
  'RotateCcw',
  'PlusCircle',
  'Coffee',
  'Pizza',
  'Dumbbell',
  'Car',
  'Wifi',
  'Tv',
  'Gamepad2',
  'Shirt',
  'Sparkles',
  'Music',
  'Smartphone',
  'PiggyBank',
  'Stethoscope',
  'Wrench',
  'Tag',
];

export const PRESET_CATEGORY_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
];
