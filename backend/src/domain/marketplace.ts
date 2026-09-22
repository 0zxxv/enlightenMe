/**
 * Central marketplace capability map.
 * Service type = what is sold. Provider type = who sells it.
 * Learner type is independent and must NOT gate browsing/purchase.
 */

export const SERVICE_TYPES = [
  'SchoolCourse',
  'UniversityCourse',
  'TrainingSkill',
] as const;

export type ServiceTypeId = (typeof SERVICE_TYPES)[number];

export const PROVIDER_TYPES = ['Teacher', 'Institute', 'Trainer'] as const;
export type ProviderTypeId = (typeof PROVIDER_TYPES)[number];

export const LEARNER_TYPES = [
  'SchoolStudent',
  'UniversityStudent',
  'Individual',
] as const;
export type LearnerTypeId = (typeof LEARNER_TYPES)[number];

/** Allowed provider types for each service type. */
export const PROVIDERS_BY_SERVICE: Record<ServiceTypeId, readonly ProviderTypeId[]> = {
  SchoolCourse: ['Teacher', 'Institute'],
  UniversityCourse: ['Teacher', 'Institute'],
  TrainingSkill: ['Trainer', 'Institute'],
};

export function providersForService(serviceType: ServiceTypeId): readonly ProviderTypeId[] {
  return PROVIDERS_BY_SERVICE[serviceType] ?? [];
}

export function isProviderAllowedForService(
  serviceType: ServiceTypeId,
  providerType: ProviderTypeId,
): boolean {
  return providersForService(serviceType).includes(providerType);
}

/** Map legacy CourseType values used in older clients/seeds. */
export function normalizeServiceType(input: string): ServiceTypeId | null {
  const value = input.trim();
  const map: Record<string, ServiceTypeId> = {
    SchoolCourse: 'SchoolCourse',
    UniversityCourse: 'UniversityCourse',
    TrainingSkill: 'TrainingSkill',
    School: 'SchoolCourse',
    University: 'UniversityCourse',
    Skills: 'TrainingSkill',
    school: 'SchoolCourse',
    university: 'UniversityCourse',
    skills: 'TrainingSkill',
    SCHOOL_COURSE: 'SchoolCourse',
    UNIVERSITY_COURSE: 'UniversityCourse',
    TRAINING_SKILL: 'TrainingSkill',
  };
  return map[value] ?? null;
}

export function normalizeProviderType(input: string): ProviderTypeId | null {
  const value = input.trim();
  const map: Record<string, ProviderTypeId> = {
    Teacher: 'Teacher',
    Institute: 'Institute',
    Trainer: 'Trainer',
    TEACHER: 'Teacher',
    INSTITUTE: 'Institute',
    TRAINER: 'Trainer',
    teacher: 'Teacher',
    institute: 'Institute',
    trainer: 'Trainer',
  };
  return map[value] ?? null;
}
