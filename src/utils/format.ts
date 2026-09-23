export function formatPrice(amount: number | string, currency = 'BHD') {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(value)) return `— ${currency}`;
  const whole = Math.round(value);
  return `${whole} ${currency}`;
}

export function fullName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(' ').trim();
}

export function greetingKey(date = new Date()): 'home.goodMorning' | 'home.goodAfternoon' | 'home.goodEvening' {
  const hour = date.getHours();
  if (hour < 12) return 'home.goodMorning';
  if (hour < 18) return 'home.goodAfternoon';
  return 'home.goodEvening';
}

export function formatDate(value: string | Date, locale = 'en') {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString(locale === 'ar' ? 'ar-BH' : 'en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(value: string | Date, locale = 'en') {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleTimeString(locale === 'ar' ? 'ar-BH' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function courseTitle(course: { title: string; titleAr?: string | null }, language: string) {
  if (language === 'ar' && course.titleAr) return course.titleAr;
  return course.title;
}
