/**
 * Health Validation Engine
 *
 * Rule-based validation for health profiles during registration.
 * Provides disease recognition, stage mapping, medication alignment checks,
 * red flag detection, escalation criteria, and clinical references.
 *
 * IMPORTANT: This is NOT a medical diagnostic tool. It validates data consistency
 * for dietary recommendation purposes only.
 */
export interface HealthValidationInput {
    age: number;
    diseaseName: string;
    stage: string;
    medicines: string;
    symptoms?: string;
    diagnosedBy?: 'self' | 'physician';
}
export interface ValidationCheck {
    category: 'AGE_PLAUSIBILITY' | 'DISEASE_RECOGNITION' | 'STAGE_MAPPING' | 'MEDICATION_ALIGNMENT' | 'INPUT_SPECIFICITY' | 'DRUG_INTERACTION';
    passed: boolean;
    message: string;
    severity: 'info' | 'warning' | 'critical';
}
export interface RedFlag {
    symptom: string;
    urgency: 'IMMEDIATE' | 'WITHIN_24H' | 'SCHEDULE_APPOINTMENT';
    action: string;
}
export interface EscalationCriteria {
    shouldConsultDoctor: boolean;
    reason?: string;
    specialtyRecommended?: string;
    timeframe?: string;
}
export interface ClinicalReference {
    title: string;
    source: string;
    url?: string;
    relevance: string;
}
export interface StructuredSummary {
    patientData: {
        age: number;
        condition: string;
        stage: string;
        medications: string[];
    };
    validationChecks: {
        total: number;
        passed: number;
        failed: number;
    };
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
    dietaryGuidance: string;
    nextSteps: string[];
}
export interface HealthValidationResult {
    valid: boolean;
    confidenceScore: number;
    suggestedAction: 'APPROVE' | 'REQUIRE_MANUAL_REVIEW' | 'REJECT';
    checks: ValidationCheck[];
    dietaryContraindications: string[];
    correctedMedicines: string;
    redFlags: RedFlag[];
    escalation: EscalationCriteria;
    references: ClinicalReference[];
    disclaimers: string[];
    structuredSummary: StructuredSummary;
}
/**
 * Main validation function.
 */
export declare function validateHealthProfile(input: HealthValidationInput): HealthValidationResult;
//# sourceMappingURL=healthValidation.d.ts.map