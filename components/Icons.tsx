
import React from 'react';
import { 
  Utensils, Hotel, Stethoscope, Pill, Wrench, ShoppingCart, 
  Sparkles, GraduationCap, Landmark, Hammer, Smartphone, 
  Bus, Compass, Briefcase, Shirt, Home, Sprout, Music, 
  Dumbbell, Book, MoreHorizontal, Search, MapPin, 
  Phone, MessageCircle, CheckCircle2, Star, ChevronRight, 
  ArrowLeft, PlusCircle, LayoutGrid, Info, X, Clock,
  ShoppingBag, Cpu, HeartPulse, Palmtree, Gavel, Palette,
  HardHat, Car, PartyPopper, Megaphone, Truck, Rocket,
  Leaf, ShieldCheck, Trophy, Navigation, Edit, Lock,
  Eye, EyeOff, Facebook, Instagram, Trash2, MoreVertical
} from 'lucide-react';

const icons: Record<string, any> = {
  Utensils, Hotel, Stethoscope, Pill, Wrench, ShoppingCart, 
  Sparkles, GraduationCap, Landmark, Hammer, Smartphone, 
  Bus, Compass, Briefcase, Shirt, Home, Sprout, Music, 
  Dumbbell, Book, MoreHorizontal, Search, MapPin, 
  Phone, MessageCircle, CheckCircle2, Star, ChevronRight, 
  ArrowLeft, PlusCircle, LayoutGrid, Info, X, Clock,
  ShoppingBag, Cpu, HeartPulse, Palmtree, Gavel, Palette,
  HardHat, Car, PartyPopper, Megaphone, Truck, Rocket,
  Leaf, ShieldCheck, Trophy, Navigation, Edit, Lock,
  Eye, EyeOff, Facebook, Instagram, Trash2, MoreVertical
};

export const Icon = ({ name, className = "w-6 h-6", ...props }: { name: string, className?: string, [key: string]: any }) => {
  const LucideIcon = icons[name] || icons.MoreHorizontal;
  return <LucideIcon className={className} {...props} />;
};
