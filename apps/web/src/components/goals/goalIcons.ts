import {
  Car,
  Bike,
  Truck,
  Home,
  Building2,
  Sofa,
  Waves,
  Plane,
  Palmtree,
  Mountain,
  Ship,
  Landmark,
  Tent,
  Laptop,
  Smartphone,
  Monitor,
  Watch,
  Camera,
  Headphones,
  Gamepad2,
  Gem,
  Baby,
  GraduationCap,
  BookOpen,
  PiggyBank,
  TrendingUp,
  Coins,
  Shield,
  HeartPulse,
  Dumbbell,
  Gift,
  Dog,
  Target,
  type LucideIcon,
} from 'lucide-react';

export interface GoalIconOption {
  icon: LucideIcon;
  name: string;
  label: string;
  category: string;
}

/** Curated goal icon set, replacing the old emoji picker — each option's `name` is the
 * stable string stored in `goals.icon`, so renaming a label here never breaks saved goals. */
export const GOAL_ICONS: GoalIconOption[] = [
  { icon: Car, name: 'Car', label: 'Car / Automobile', category: 'Vehicles' },
  { icon: Bike, name: 'Bike', label: 'Bike / Motorcycle', category: 'Vehicles' },
  { icon: Truck, name: 'Truck', label: 'SUV / Jeep', category: 'Vehicles' },
  { icon: Home, name: 'Home', label: 'Home / House', category: 'Living' },
  { icon: Building2, name: 'Building2', label: 'Apartment / Flat', category: 'Living' },
  { icon: Sofa, name: 'Sofa', label: 'Interior / Furniture', category: 'Living' },
  { icon: Waves, name: 'Waves', label: 'Pool / Luxury', category: 'Living' },
  { icon: Plane, name: 'Plane', label: 'Vacation / Travel', category: 'Travel' },
  { icon: Palmtree, name: 'Palmtree', label: 'Beach / Holiday', category: 'Travel' },
  { icon: Mountain, name: 'Mountain', label: 'Mountains / Trek', category: 'Travel' },
  { icon: Ship, name: 'Ship', label: 'Cruise Trip', category: 'Travel' },
  { icon: Landmark, name: 'Landmark', label: 'World Tour', category: 'Travel' },
  { icon: Tent, name: 'Tent', label: 'Camping / Adventure', category: 'Travel' },
  { icon: Laptop, name: 'Laptop', label: 'Laptop', category: 'Tech' },
  { icon: Smartphone, name: 'Smartphone', label: 'Phone', category: 'Tech' },
  { icon: Monitor, name: 'Monitor', label: 'Desktop PC / Setup', category: 'Tech' },
  { icon: Watch, name: 'Watch', label: 'Smartwatch', category: 'Tech' },
  { icon: Camera, name: 'Camera', label: 'Camera / Photography', category: 'Tech' },
  { icon: Headphones, name: 'Headphones', label: 'Headphones / Audio', category: 'Tech' },
  { icon: Gamepad2, name: 'Gamepad2', label: 'Gaming', category: 'Tech' },
  { icon: Gem, name: 'Gem', label: 'Wedding / Jewelry', category: 'Life' },
  { icon: Baby, name: 'Baby', label: 'Baby / Child', category: 'Life' },
  { icon: GraduationCap, name: 'GraduationCap', label: 'Higher Education / College', category: 'Education' },
  { icon: BookOpen, name: 'BookOpen', label: 'Courses / Books', category: 'Education' },
  { icon: PiggyBank, name: 'PiggyBank', label: 'Savings / Emergency Fund', category: 'Finance' },
  { icon: TrendingUp, name: 'TrendingUp', label: 'Stocks / Trading', category: 'Finance' },
  { icon: Coins, name: 'Coins', label: 'Gold / Crypto', category: 'Finance' },
  { icon: Landmark, name: 'Landmark2', label: 'Retirement Fund', category: 'Finance' },
  { icon: Shield, name: 'Shield', label: 'Insurance / Protection', category: 'Finance' },
  { icon: HeartPulse, name: 'HeartPulse', label: 'Healthcare / Medical', category: 'Health' },
  { icon: Dumbbell, name: 'Dumbbell', label: 'Fitness / Gym', category: 'Health' },
  { icon: Gift, name: 'Gift', label: 'Gift / Celebration', category: 'Life' },
  { icon: Dog, name: 'Dog', label: 'Pet', category: 'Life' },
];

export const GOAL_ICON_CATEGORIES = ['All', 'Vehicles', 'Living', 'Travel', 'Tech', 'Finance', 'Life', 'Education', 'Health'];

const GOAL_ICON_MAP = new Map(GOAL_ICONS.map((opt) => [opt.name, opt.icon]));

/** Resolves a stored `goals.icon` value to its component, falling back to the generic
 * Target icon for an unrecognized or missing name (never renders raw text as an icon). */
export function resolveGoalIcon(name: string | null | undefined): LucideIcon {
  return (name && GOAL_ICON_MAP.get(name)) || Target;
}
