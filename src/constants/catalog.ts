export const POPULAR_SUBJECTS = [
  { id: 'math', en: 'Mathematics', ar: 'الرياضيات' },
  { id: 'physics', en: 'Physics', ar: 'الفيزياء' },
  { id: 'english', en: 'English', ar: 'الإنجليزية' },
  { id: 'chemistry', en: 'Chemistry', ar: 'الكيمياء' },
  { id: 'algorithms', en: 'Algorithms', ar: 'الخوارزميات' },
  { id: 'blender', en: 'Blender', ar: 'بلندر' },
] as const;

export const CATEGORY_CHIPS = [
  { id: 'school', labelKey: 'home.school' as const },
  { id: 'university', labelKey: 'home.university' as const },
  { id: 'skills', labelKey: 'home.skills' as const },
  { id: 'institutes', labelKey: 'home.institutes' as const },
] as const;
