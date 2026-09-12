import assert from 'node:assert/strict';

function formatPrice(amount, currency = 'BHD') {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(value)) return `${currency} —`;
  return `${currency} ${value.toFixed(3)}`;
}

function fullName(first, last) {
  return [first, last].filter(Boolean).join(' ').trim();
}

function courseTitle(course, language) {
  if (language === 'ar' && course.titleAr) return course.titleAr;
  return course.title;
}

assert.equal(formatPrice(12.5, 'BHD'), 'BHD 12.500');
assert.equal(fullName('Zahra', 'Ali'), 'Zahra Ali');
assert.equal(courseTitle({ title: 'Blender', titleAr: 'بلندر' }, 'ar'), 'بلندر');

console.log('format utils tests passed');
