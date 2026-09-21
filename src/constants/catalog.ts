import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const POPULAR_SUBJECTS = [
  { id: 'math', en: 'Mathematics', ar: 'الرياضيات', icon: 'calculator-outline' as IconName, tint: '#2F6B4F', soft: '#E4F2EA' },
  { id: 'physics', en: 'Physics', ar: 'الفيزياء', icon: 'flash-outline' as IconName, tint: '#C46A2B', soft: '#F8EBD8' },
  { id: 'english', en: 'English', ar: 'الإنجليزية', icon: 'book-outline' as IconName, tint: '#3A5A8C', soft: '#E6EEF7' },
  { id: 'chemistry', en: 'Chemistry', ar: 'الكيمياء', icon: 'flask-outline' as IconName, tint: '#6B4C9A', soft: '#EDE6F5' },
  { id: 'algorithms', en: 'Algorithms', ar: 'الخوارزميات', icon: 'git-branch-outline' as IconName, tint: '#2C245C', soft: '#E6DFF0' },
  { id: 'blender', en: 'Blender', ar: 'بلندر', icon: 'cube-outline' as IconName, tint: '#9A6B1F', soft: '#F7EED9' },
  { id: 'biology', en: 'Biology', ar: 'الأحياء', icon: 'leaf-outline' as IconName, tint: '#2F6B4F', soft: '#E4F2EA' },
  { id: 'history', en: 'History', ar: 'التاريخ', icon: 'time-outline' as IconName, tint: '#8A5A3A', soft: '#F3E8E0' },
] as const;

export const CATEGORY_CHIPS = [
  {
    id: 'school',
    labelKey: 'home.school' as const,
    icon: 'school-outline' as IconName,
    tint: '#3A5A8C',
    soft: '#E6EEF7',
  },
  {
    id: 'university',
    labelKey: 'home.university' as const,
    icon: 'business-outline' as IconName,
    tint: '#2F6B4F',
    soft: '#E4F2EA',
  },
  {
    id: 'skills',
    labelKey: 'home.skills' as const,
    icon: 'sparkles-outline' as IconName,
    tint: '#6B4C9A',
    soft: '#EDE6F5',
  },
  {
    id: 'institutes',
    labelKey: 'home.institutes' as const,
    icon: 'people-outline' as IconName,
    tint: '#B85C7A',
    soft: '#F8E6EC',
  },
] as const;
