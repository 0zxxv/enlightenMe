import type { ImageSource } from 'expo-image';
import type { Course } from '@/types/models';

const PLACEHOLDER = require('../../assets/images/dars_icon.png');

/**
 * Bundled course art — filenames in assets/images/courses-images match the course.
 * More specific keys are listed first so they win over broader ones (e.g. algorithms before it).
 */
const LOCAL_COURSE_IMAGES: { key: string; match: RegExp; source: ImageSource }[] = [
  {
    key: 'algorithms',
    match: /\b(algorithm|algorithms|itcs347)\b/i,
    source: require('../../assets/images/courses-images/algorithms.png'),
  },
  {
    key: 'physics',
    match: /\b(physics|phys)\b/i,
    source: require('../../assets/images/courses-images/physics.png'),
  },
  {
    key: 'math',
    match: /\b(math|mathematics|calculus|algebra|geometry)\b/i,
    source: require('../../assets/images/courses-images/math.png'),
  },
  {
    key: '3d',
    match: /\b(3d|blender)\b/i,
    source: require('../../assets/images/courses-images/3d.png'),
  },
  {
    key: 'it',
    match: /\b(it|itcs|computer\s*science|coding|programming|software)\b/i,
    source: require('../../assets/images/courses-images/it.png'),
  },
];

function haystack(
  course: Pick<Course, 'title' | 'titleAr' | 'courseCode' | 'major' | 'level'>,
): string {
  return [course.title, course.titleAr, course.courseCode, course.major, course.level]
    .filter(Boolean)
    .join(' ');
}

export function resolveCourseImageSource(
  course: Pick<Course, 'title' | 'titleAr' | 'courseCode' | 'major' | 'level' | 'imageUrl'>,
): { source: ImageSource; isLocal: boolean } {
  const text = haystack(course);
  const lower = text.toLowerCase();
  for (const entry of LOCAL_COURSE_IMAGES) {
    if (entry.match.test(text) || lower.includes(entry.key)) {
      return { source: entry.source, isLocal: true };
    }
  }
  if (course.imageUrl) {
    return { source: { uri: course.imageUrl }, isLocal: false };
  }
  return { source: PLACEHOLDER, isLocal: false };
}
