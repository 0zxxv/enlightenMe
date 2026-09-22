/**
 * Frontend mirror of backend marketplace capabilities.
 * Keep in sync with backend/src/domain/marketplace.ts
 */

export const SERVICE_TYPES = [
  'SchoolCourse',
  'UniversityCourse',
  'TrainingSkill',
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export const PROVIDER_TYPES = ['Teacher', 'Institute', 'Trainer'] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export const LEARNER_TYPES = [
  'SchoolStudent',
  'UniversityStudent',
  'Individual',
] as const;
export type LearnerType = (typeof LEARNER_TYPES)[number];

export const PROVIDERS_BY_SERVICE: Record<ServiceType, readonly ProviderType[]> = {
  SchoolCourse: ['Teacher', 'Institute'],
  UniversityCourse: ['Teacher', 'Institute'],
  TrainingSkill: ['Trainer', 'Institute'],
};

export function providersForService(serviceType: ServiceType): readonly ProviderType[] {
  return PROVIDERS_BY_SERVICE[serviceType] ?? [];
}

export function isProviderAllowedForService(
  serviceType: ServiceType,
  providerType: ProviderType,
): boolean {
  return providersForService(serviceType).includes(providerType);
}

export function normalizeServiceType(input: string): ServiceType | null {
  const map: Record<string, ServiceType> = {
    SchoolCourse: 'SchoolCourse',
    UniversityCourse: 'UniversityCourse',
    TrainingSkill: 'TrainingSkill',
    School: 'SchoolCourse',
    University: 'UniversityCourse',
    Skills: 'TrainingSkill',
    school: 'SchoolCourse',
    university: 'UniversityCourse',
    skills: 'TrainingSkill',
  };
  return map[input] ?? null;
}

export const SERVICE_TYPE_LABEL_KEYS = {
  SchoolCourse: 'marketplace.schoolCourses',
  UniversityCourse: 'marketplace.universityCourses',
  TrainingSkill: 'marketplace.trainingSkills',
} as const;

export const SERVICE_TYPE_SINGULAR_KEYS = {
  SchoolCourse: 'marketplace.schoolCourse',
  UniversityCourse: 'marketplace.universityCourse',
  TrainingSkill: 'marketplace.trainingSkill',
} as const;

export const PROVIDER_TYPE_LABEL_KEYS = {
  Teacher: 'marketplace.teachers',
  Institute: 'marketplace.institutes',
  Trainer: 'marketplace.trainers',
} as const;

export const PROVIDER_TYPE_SINGULAR_KEYS = {
  Teacher: 'marketplace.teacher',
  Institute: 'marketplace.institute',
  Trainer: 'marketplace.trainer',
} as const;

export const LEARNER_TYPE_LABEL_KEYS = {
  SchoolStudent: 'marketplace.schoolStudent',
  UniversityStudent: 'marketplace.universityStudent',
  Individual: 'marketplace.individual',
} as const;
