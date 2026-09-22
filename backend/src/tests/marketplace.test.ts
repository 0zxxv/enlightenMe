import { describe, expect, it } from 'vitest';
import {
  isProviderAllowedForService,
  normalizeServiceType,
  providersForService,
} from '../domain/marketplace.js';

describe('marketplace capabilities', () => {
  it('allows teachers and institutes for school courses', () => {
    expect(providersForService('SchoolCourse')).toEqual(['Teacher', 'Institute']);
    expect(isProviderAllowedForService('SchoolCourse', 'Teacher')).toBe(true);
    expect(isProviderAllowedForService('SchoolCourse', 'Trainer')).toBe(false);
  });

  it('allows trainers and institutes for training skills', () => {
    expect(providersForService('TrainingSkill')).toEqual(['Trainer', 'Institute']);
    expect(isProviderAllowedForService('TrainingSkill', 'Trainer')).toBe(true);
    expect(isProviderAllowedForService('TrainingSkill', 'Teacher')).toBe(false);
  });

  it('normalizes legacy course type values', () => {
    expect(normalizeServiceType('School')).toBe('SchoolCourse');
    expect(normalizeServiceType('University')).toBe('UniversityCourse');
    expect(normalizeServiceType('Skills')).toBe('TrainingSkill');
    expect(normalizeServiceType('SchoolCourse')).toBe('SchoolCourse');
  });
});
