import { z } from 'zod';
import { Gravity, Occurrence, Exposition, Detectability, RiskLevel } from './types';

// Enums as Zod Native Enums for validation
export const AssessmentSchema = z.object({
    gravity: z.nativeEnum(Gravity).or(z.number()),
    occurrence: z.nativeEnum(Occurrence).or(z.string()),
    exposition: z.nativeEnum(Exposition).or(z.number()),
    detectability: z.nativeEnum(Detectability).or(z.number()),
    computedLevel: z.nativeEnum(RiskLevel).or(z.string()),
});

export const RiskEntrySchema = z.object({
    id: z.string(),
    studyNumber: z.string().default(''),
    experimentation: z.string().default(''),
    activityTitle: z.string().default(''),
    aircraft: z.string().default(''),
    dreadedEvent: z.string().default(''),
    mitigationMeasures: z.string().default(''),
    synthesis: z.string().default(''),
    initialRisk: AssessmentSchema,
    residualRisk: AssessmentSchema,
    updatedAt: z.number().default(() => Date.now()),
});

export const RiskCatalogEntrySchema = z.object({
    id: z.string(),
    title: z.string(),
    category: z.string(),
    dreadedEvent: z.string(),
    mitigationMeasures: z.string(),
    defaultGravity: z.nativeEnum(Gravity),
    defaultOccurrence: z.nativeEnum(Occurrence),
});

export const StudyContextSchema = z.object({
    studyName: z.string().default(''),
    experimentation: z.string().default(''),
    aircraft: z.string().default(''),
    date: z.string().default(''),
    globalSynthesis: z.string().default(''),
});

export const StudySchema = z.object({
    id: z.string(),
    name: z.string().default(''),
    experimentation: z.string().default(''),
    aircraft: z.string().default(''),
    date: z.string().default(''),
    globalSynthesis: z.string().default(''),
    risks: z.array(RiskEntrySchema).default([]),
    updatedAt: z.number().default(() => Date.now()),
});

// For array validations
export const StudyArraySchema = z.array(StudySchema);
