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

// ─── Type Definitions ───────────────────────────────────────────────────────

export interface HealthValidationInput {
  age: number;
  diseaseName: string;
  stage: string;
  medicines: string;
  symptoms?: string;
  diagnosedBy?: 'self' | 'physician';
}

export interface ValidationCheck {
  category: 'AGE_PLAUSIBILITY' | 'DISEASE_RECOGNITION' | 'STAGE_MAPPING'
          | 'MEDICATION_ALIGNMENT' | 'INPUT_SPECIFICITY' | 'DRUG_INTERACTION';
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
  patientData: { age: number; condition: string; stage: string; medications: string[] };
  validationChecks: { total: number; passed: number; failed: number };
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

// ─── Disease Rules Dictionary ───────────────────────────────────────────────

interface StageInfo {
  label: string;
  expectedMeds: string[];
}

interface DiseaseRule {
  aliases: string[];
  stages: Record<string, StageInfo>;
  dietaryRestrictions: string[];
  detailedGuidance?: string;
  redFlagSymptoms: { symptom: string; urgency: RedFlag['urgency']; action: string }[];
  specialist: string;
  ageRange: { min: number; max: number; note?: string };
  references: ClinicalReference[];
}

const DISEASE_RULES: Record<string, DiseaseRule> = {
  'diabetes_type_2': {
    aliases: ['diabetes type 2', 'type 2 diabetes', 'diabetes mellitus type 2', 'dm2', 't2dm', 'type 2', 'diabetes'],
    stages: {
      '1': { label: 'Pre-diabetes / Early', expectedMeds: ['metformin'] },
      '2': { label: 'Controlled with oral medication', expectedMeds: ['metformin', 'glipizide', 'glimepiride', 'sitagliptin'] },
      '3': { label: 'Insulin-dependent / Advanced', expectedMeds: ['insulin'] },
    },
    dietaryRestrictions: ['High Sugar', 'High Glycemic Index Foods', 'Refined Carbohydrates', 'Sugary Beverages'],
    detailedGuidance: `### Disease Context
- **Condition:** Type 2 Diabetes
- **Patient Context:** Adult (typically managed with lifestyle changes or medication).
- **Goal:** Maintain stable blood sugar levels and reduce cardiovascular risks.

### Typical Menu & Unhealthy Items
- **Breakfast:** Sweetened cereal, white bread toast, fruit juice (High glycemic index, spikes blood sugar).
- **Lunch:** White rice, fried foods, large portions of pasta (Refined carbs).
- **Dinner:** Processed meats, creamy sauces, dessert (High saturated fat and added sugars).
- **Snacks:** Cookies, chips, sweetened beverages.

### Healthier Substitutes
- **Breakfast:** Oatmeal with nuts and seeds, whole-grain toast with avocado, whole fruit instead of juice. (Lower GI, higher fiber).
- **Lunch:** Quinoa, brown rice, baked or grilled protein (e.g., chicken, fish), steamed vegetables. (Sustained energy).
- **Dinner:** Lean proteins, salads with olive oil dressing, clear soups. (Lower calories and saturated fat).
- **Snacks:** Greek yogurt, unsalted nuts, raw vegetable sticks.

### Implementation Tips
- **Reading Labels:** Check for "Added Sugars" and total carbohydrates.
- **Portion Control:** Use the "Plate Method" (1/2 non-starchy veggies, 1/4 lean protein, 1/4 whole grains).
- **Contraindications:** Avoid sugary drinks entirely, including fruit juices and regular soda.`,
    redFlagSymptoms: [
      { symptom: 'blurred vision', urgency: 'WITHIN_24H', action: 'May indicate diabetic retinopathy. Schedule an eye exam with an ophthalmologist.' },
      { symptom: 'numbness', urgency: 'SCHEDULE_APPOINTMENT', action: 'Numbness or tingling in extremities may indicate peripheral neuropathy. Consult a neurologist.' },
      { symptom: 'tingling', urgency: 'SCHEDULE_APPOINTMENT', action: 'Tingling in hands/feet may indicate peripheral neuropathy. Consult a neurologist.' },
      { symptom: 'frequent urination', urgency: 'WITHIN_24H', action: 'Combined with excessive thirst, may indicate uncontrolled blood sugar. Check glucose levels immediately.' },
      { symptom: 'extreme thirst', urgency: 'WITHIN_24H', action: 'May indicate hyperglycemia. Check blood glucose and consult your doctor.' },
      { symptom: 'slow healing', urgency: 'SCHEDULE_APPOINTMENT', action: 'Slow wound healing is common in diabetes. Monitor closely and consult your physician.' },
      { symptom: 'frequent infections', urgency: 'WITHIN_24H', action: 'Frequent infections may indicate poorly controlled diabetes. Seek medical review.' },
    ],
    specialist: 'Endocrinologist',
    ageRange: { min: 18, max: 120, note: 'Type 2 Diabetes is uncommon in individuals under 18. Did you mean Type 1?' },
    references: [
      { title: 'Standards of Care in Diabetes — 2024', source: 'American Diabetes Association (ADA)', url: 'https://diabetesjournals.org/care', relevance: 'Stage classification and treatment guidelines' },
      { title: 'Diabetes Diet and Nutrition Guidelines', source: 'CDC', url: 'https://www.cdc.gov/diabetes/managing/eat-well.html', relevance: 'Dietary recommendations for diabetic patients' },
    ]
  },

  'diabetes_type_1': {
    aliases: ['diabetes type 1', 'type 1 diabetes', 'diabetes mellitus type 1', 'dm1', 't1dm', 'type 1', 'juvenile diabetes'],
    stages: {
      '1': { label: 'Newly diagnosed', expectedMeds: ['insulin'] },
      '2': { label: 'Managed with insulin therapy', expectedMeds: ['insulin'] },
      '3': { label: 'With complications', expectedMeds: ['insulin'] },
    },
    dietaryRestrictions: ['High Sugar', 'High Glycemic Index Foods', 'Excessive Carbohydrates'],
    detailedGuidance: `### Disease Context
- **Condition:** Type 1 Diabetes
- **Patient Context:** Managed primarily with insulin therapy. Diet must be carefully coordinated with insulin dosing.
- **Goal:** Tight glycemic control, preventing severe hypo/hyperglycemia.

### Typical Menu & Unhealthy Items
- **Breakfast:** Pancakes with syrup, sweetened yogurts (Causes rapid, unpredictable blood sugar spikes).
- **Lunch:** Fast food burgers, large fries (High fat delays carb absorption, complicating insulin timing).
- **Dinner:** Heavy pasta dishes, pizza (Complex to dose insulin for prolonged carb release).
- **Snacks:** Candy, regular sodas (unless treating hypoglycemia).

### Healthier Substitutes
- **Breakfast:** Scrambled eggs, whole wheat toast, unsweetened yogurt with berries.
- **Lunch:** Whole grain wraps, lean proteins, side salad.
- **Dinner:** Grilled chicken, baked sweet potato, large portion of green vegetables.
- **Snacks:** Cheese sticks, nuts, apple slices with peanut butter.

### Implementation Tips
- **Carb Counting:** Accurately count carbohydrates to match insulin doses.
- **Meal Timing:** Keep meal times consistent.
- **Contraindications:** Avoid high-sugar foods unless actively treating a low blood sugar event.`,
    redFlagSymptoms: [
      { symptom: 'blurred vision', urgency: 'WITHIN_24H', action: 'May indicate diabetic retinopathy. Schedule an eye exam.' },
      { symptom: 'nausea', urgency: 'IMMEDIATE', action: 'Nausea with diabetes may indicate diabetic ketoacidosis (DKA). Seek emergency care.' },
      { symptom: 'vomiting', urgency: 'IMMEDIATE', action: 'Vomiting with Type 1 Diabetes may indicate DKA. Seek emergency care immediately.' },
      { symptom: 'fruity breath', urgency: 'IMMEDIATE', action: 'Fruity breath odor is a sign of diabetic ketoacidosis. Seek emergency care.' },
      { symptom: 'confusion', urgency: 'IMMEDIATE', action: 'Mental confusion may indicate severe hypo/hyperglycemia. Seek emergency care.' },
    ],
    specialist: 'Endocrinologist',
    ageRange: { min: 1, max: 120 },
    references: [
      { title: 'Type 1 Diabetes Management', source: 'ADA', url: 'https://diabetesjournals.org/care', relevance: 'Insulin therapy and management guidelines' },
    ]
  },

  'hypertension': {
    aliases: ['hypertension', 'high blood pressure', 'htn', 'bp', 'high bp', 'elevated blood pressure'],
    stages: {
      '1': { label: 'Elevated (120-129 / <80 mmHg)', expectedMeds: [] },
      '2': { label: 'Stage 1 (130-139 / 80-89 mmHg)', expectedMeds: ['lisinopril', 'amlodipine', 'losartan', 'hydrochlorothiazide'] },
      '3': { label: 'Stage 2 (≥140 / ≥90 mmHg)', expectedMeds: ['amlodipine', 'losartan', 'metoprolol', 'hydrochlorothiazide'] },
    },
    dietaryRestrictions: ['High Sodium', 'Processed Foods', 'Excessive Caffeine', 'Alcohol', 'Saturated Fats'],
    detailedGuidance: `### Disease Context
- **Condition:** Hypertension (High Blood Pressure)
- **Patient Context:** Adult managing blood pressure, often salt-sensitive.
- **Goal:** Lower blood pressure, reduce risk of stroke and heart disease.

### Typical Menu & Unhealthy Items
- **Breakfast:** Bacon, sausage, heavily salted hash browns (Extremely high sodium).
- **Lunch:** Canned soups, deli meat sandwiches, pickles (Hidden sodium).
- **Dinner:** Frozen pre-packaged meals, soy sauce-heavy dishes (Excessive sodium and preservatives).
- **Snacks:** Salted chips, pretzels, salted nuts.

### Healthier Substitutes
- **Breakfast:** Oatmeal with fresh fruit, unsalted eggs, whole grain toast.
- **Lunch:** Homemade soup with low-sodium broth, fresh roasted poultry, fresh salads.
- **Dinner:** Freshly prepared fish or chicken, steamed vegetables flavored with herbs instead of salt.
- **Snacks:** Fresh fruits, unsalted nuts, carrot sticks.

### Implementation Tips
- **Reading Labels:** Look for "Low Sodium" or "No Salt Added" (aim for < 1500-2300mg total per day).
- **Flavoring:** Use herbs, spices, lemon juice, and vinegar instead of salt.
- **Contraindications:** Avoid high-sodium processed foods, cured meats, and excessive alcohol.`,
    redFlagSymptoms: [
      { symptom: 'severe headache', urgency: 'IMMEDIATE', action: 'Severe headache with hypertension may indicate hypertensive crisis. Seek emergency care.' },
      { symptom: 'chest pain', urgency: 'IMMEDIATE', action: 'Chest pain is a medical emergency. Call emergency services immediately.' },
      { symptom: 'vision changes', urgency: 'IMMEDIATE', action: 'Sudden vision changes may indicate hypertensive emergency. Seek immediate care.' },
      { symptom: 'difficulty breathing', urgency: 'IMMEDIATE', action: 'Difficulty breathing with hypertension requires immediate medical attention.' },
      { symptom: 'nosebleed', urgency: 'WITHIN_24H', action: 'Frequent nosebleeds may indicate poorly controlled blood pressure. Consult your physician.' },
      { symptom: 'dizziness', urgency: 'WITHIN_24H', action: 'Dizziness may be medication-related or indicate blood pressure fluctuations. Consult your doctor.' },
    ],
    specialist: 'Cardiologist',
    ageRange: { min: 10, max: 120, note: 'Hypertension is uncommon in children under 10. Please verify the diagnosis.' },
    references: [
      { title: 'ACC/AHA Guideline for Prevention, Detection, Evaluation, and Management of High Blood Pressure', source: 'American Heart Association', url: 'https://www.heart.org/en/health-topics/high-blood-pressure', relevance: 'Blood pressure staging and treatment guidelines' },
      { title: 'DASH Eating Plan', source: 'NHLBI', url: 'https://www.nhlbi.nih.gov/education/dash-eating-plan', relevance: 'Dietary approaches to manage hypertension' },
    ]
  },

  'ckd': {
    aliases: ['chronic kidney disease', 'kidney disease', 'ckd', 'renal disease', 'renal failure', 'kidney failure'],
    stages: {
      '1': { label: 'GFR ≥ 90 (Mild / Normal function with damage)', expectedMeds: [] },
      '2': { label: 'GFR 30-89 (Moderate reduction)', expectedMeds: ['ace inhibitor', 'lisinopril', 'enalapril'] },
      '3': { label: 'GFR < 30 (Severe / Approaching dialysis)', expectedMeds: ['erythropoietin', 'phosphate binder', 'calcitriol'] },
    },
    dietaryRestrictions: ['High Potassium', 'High Phosphorus', 'Excessive Protein', 'High Sodium', 'Processed Meats'],
    detailedGuidance: `### Disease Context
- **Condition:** Chronic Kidney Disease (CKD)
- **Patient Context:** Requires strict control of minerals to prevent further kidney damage.
- **Goal:** Manage blood pressure, reduce kidney workload, and control potassium/phosphorus.

### Typical Menu & Unhealthy Items
- **Breakfast:** Banana, orange juice, bran cereal (High potassium and phosphorus).
- **Lunch:** Deli meats, cheese, whole wheat bread (High sodium and phosphorus).
- **Dinner:** Potatoes, tomatoes, dark colas, processed meats (High potassium, high phosphorus, high sodium).
- **Snacks:** Chocolate, nuts, salted chips (High phosphorus and sodium).

### Healthier Substitutes
- **Breakfast:** Apples, berries, refined white bread/rice (Lower potassium/phosphorus).
- **Lunch:** Fresh roasted chicken, cucumber, light-colored sodas (lemon-lime).
- **Dinner:** Cauliflower, green beans, lean meats, white rice.
- **Snacks:** Popcorn (unsalted), grapes, plain crackers.

### Implementation Tips
- **Portion Control:** Strictly control protein portion sizes based on nephrologist's recommendation.
- **Preparation:** Leaching potatoes and vegetables can reduce potassium content.
- **Contraindications:** Avoid dark colas, processed meats, star fruit, and salt substitutes (which contain potassium).`,
    redFlagSymptoms: [
      { symptom: 'blood in urine', urgency: 'WITHIN_24H', action: 'Blood in urine (hematuria) requires urgent nephrology consultation.' },
      { symptom: 'swelling', urgency: 'WITHIN_24H', action: 'Swelling in legs, ankles, or face may indicate worsening kidney function. Contact your nephrologist.' },
      { symptom: 'difficulty breathing', urgency: 'IMMEDIATE', action: 'Difficulty breathing with CKD may indicate fluid overload. Seek emergency care.' },
      { symptom: 'severe fatigue', urgency: 'SCHEDULE_APPOINTMENT', action: 'Severe fatigue may indicate anemia from CKD. Schedule a blood test.' },
      { symptom: 'decreased urination', urgency: 'WITHIN_24H', action: 'Significant decrease in urine output requires medical evaluation.' },
    ],
    specialist: 'Nephrologist',
    ageRange: { min: 5, max: 120 },
    references: [
      { title: 'KDIGO Clinical Practice Guidelines for CKD', source: 'Kidney Disease: Improving Global Outcomes (KDIGO) 2024', url: 'https://kdigo.org/guidelines/', relevance: 'CKD staging and management guidelines' },
      { title: 'Nutrition in CKD', source: 'National Kidney Foundation', url: 'https://www.kidney.org/nutrition', relevance: 'Dietary guidelines for kidney disease' },
    ]
  },

  'asthma': {
    aliases: ['asthma', 'bronchial asthma', 'reactive airway disease'],
    stages: {
      '1': { label: 'Intermittent / Mild', expectedMeds: ['salbutamol', 'albuterol'] },
      '2': { label: 'Moderate persistent', expectedMeds: ['inhaled corticosteroid', 'budesonide', 'fluticasone', 'montelukast'] },
      '3': { label: 'Severe persistent', expectedMeds: ['fluticasone', 'salmeterol', 'prednisone', 'omalizumab'] },
    },
    dietaryRestrictions: ['Sulfites', 'Known Allergens'],
    detailedGuidance: `### Disease Context
- **Condition:** Asthma
- **Patient Context:** Chronic airway inflammation; triggered by environmental or dietary factors.
- **Goal:** Reduce systemic inflammation and avoid dietary triggers.

### Typical Menu & Unhealthy Items
- **Breakfast:** Dried fruits, preserved meats (Contain sulfites which can trigger asthma).
- **Lunch:** Fast food, highly processed meals (High saturated fats may increase inflammation).
- **Dinner:** Wine, pickled foods (High sulfites and histamines).
- **Snacks:** Packaged snacks with artificial additives.

### Healthier Substitutes
- **Breakfast:** Fresh fruits, oatmeal.
- **Lunch:** Fresh salads, grilled fish (Omega-3 fatty acids reduce inflammation).
- **Dinner:** Freshly prepared meals with ginger, turmeric, and garlic.
- **Snacks:** Fresh vegetables, yogurt.

### Implementation Tips
- **Awareness:** Keep a food diary to identify personal triggers (e.g., dairy or gluten if sensitive).
- **Anti-inflammatory Diet:** Focus on foods rich in Omega-3s, Vitamin D, and antioxidants.
- **Contraindications:** Avoid foods high in sulfites (dried fruits, wine, pickled foods) if sensitive.`,
    redFlagSymptoms: [
      { symptom: 'difficulty breathing', urgency: 'IMMEDIATE', action: 'Severe breathing difficulty requires emergency care. Use rescue inhaler and call emergency services.' },
      { symptom: 'wheezing', urgency: 'WITHIN_24H', action: 'Persistent wheezing not relieved by rescue inhaler — seek medical attention.' },
      { symptom: 'chest tightness', urgency: 'WITHIN_24H', action: 'Chest tightness may indicate worsening asthma. Consult your pulmonologist.' },
      { symptom: 'blue lips', urgency: 'IMMEDIATE', action: 'Blue lips or fingertips indicate oxygen deprivation. Call emergency services immediately.' },
    ],
    specialist: 'Pulmonologist',
    ageRange: { min: 1, max: 120 },
    references: [
      { title: 'Global Strategy for Asthma Management and Prevention', source: 'GINA 2024', url: 'https://ginasthma.org/', relevance: 'Asthma classification and treatment step therapy' },
    ]
  },

  'thyroid': {
    aliases: ['hypothyroidism', 'thyroid', 'underactive thyroid', 'hashimoto', 'hyperthyroidism', 'overactive thyroid', 'graves disease'],
    stages: {
      '1': { label: 'Subclinical / Mild', expectedMeds: [] },
      '2': { label: 'Clinical / Moderate', expectedMeds: ['levothyroxine', 'methimazole'] },
      '3': { label: 'Severe / With complications', expectedMeds: ['levothyroxine', 'methimazole', 'propranolol'] },
    },
    dietaryRestrictions: ['Excessive Soy', 'Raw Cruciferous Vegetables (in large amounts)', 'Excessive Iodine'],
    detailedGuidance: `### Disease Context
- **Condition:** Thyroid Disorder (Hypothyroidism/Hyperthyroidism)
- **Patient Context:** Metabolic regulation issues; medication absorption is easily affected.
- **Goal:** Support thyroid function and ensure optimal medication absorption.

### Typical Menu & Unhealthy Items
- **Breakfast:** Large bowl of soy milk, raw kale smoothie (Goitrogens can interfere with thyroid function).
- **Lunch:** Highly processed foods with excessive iodine or hidden soy.
- **Dinner:** Fast food, excessive cruciferous vegetables (raw).
- **Snacks:** Soy-based bars.

### Healthier Substitutes
- **Breakfast:** Almond or oat milk, cooked greens (cooking reduces goitrogenic activity).
- **Lunch:** Lean proteins, whole grains, foods rich in selenium (e.g., brazil nuts in moderation).
- **Dinner:** Steamed broccoli or cauliflower (cooking is key), grilled fish.
- **Snacks:** Fresh fruit, nuts (non-soy).

### Implementation Tips
- **Medication Timing:** Take thyroid medication on an empty stomach, waiting at least 30-60 minutes before eating.
- **Preparation:** Always cook cruciferous vegetables (cabbage, broccoli, kale) to reduce goitrogens.
- **Contraindications:** Avoid consuming calcium or iron supplements within 4 hours of taking thyroid medication. Avoid excessive soy.`,
    redFlagSymptoms: [
      { symptom: 'rapid heartbeat', urgency: 'WITHIN_24H', action: 'Rapid heart rate may indicate thyroid storm. Seek urgent medical evaluation.' },
      { symptom: 'extreme fatigue', urgency: 'SCHEDULE_APPOINTMENT', action: 'Severe fatigue may indicate dosage adjustment needed. Consult endocrinologist.' },
      { symptom: 'sudden weight change', urgency: 'SCHEDULE_APPOINTMENT', action: 'Rapid weight gain/loss may indicate thyroid level changes. Schedule blood work.' },
      { symptom: 'neck swelling', urgency: 'WITHIN_24H', action: 'Neck swelling may indicate goiter. Consult your endocrinologist.' },
    ],
    specialist: 'Endocrinologist',
    ageRange: { min: 5, max: 120 },
    references: [
      { title: 'ATA Guidelines for Thyroid Disease', source: 'American Thyroid Association', url: 'https://www.thyroid.org/professionals/ata-professional-guidelines/', relevance: 'Thyroid disease management and dietary considerations' },
    ]
  },
};

// ─── Common Medication Misspellings ─────────────────────────────────────────

const MED_CORRECTIONS: Record<string, string> = {
  'insuline': 'insulin',
  'inslin': 'insulin',
  'metformine': 'metformin',
  'metforman': 'metformin',
  'amlodipin': 'amlodipine',
  'amlodopine': 'amlodipine',
  'lisinpril': 'lisinopril',
  'lisinoprel': 'lisinopril',
  'losarton': 'losartan',
  'metopralol': 'metoprolol',
  'metropolol': 'metoprolol',
  'glipzide': 'glipizide',
  'levothyroxin': 'levothyroxine',
  'levothroxine': 'levothyroxine',
  'methimazol': 'methimazole',
  'prednezone': 'prednisone',
  'prednisol': 'prednisone',
  'fluticason': 'fluticasone',
  'salbutomol': 'salbutamol',
  'montelukest': 'montelukast',
  'hydrochlorthiazide': 'hydrochlorothiazide',
  'enalopril': 'enalapril',
};

// ─── Vague Input Terms ──────────────────────────────────────────────────────

const VAGUE_TERMS = ['pain', 'hurt', 'sick', 'ill', 'ache', 'problem', 'issue', 'bad', 'not well', 'unwell', 'sore'];

// ─── Universal Red Flags ────────────────────────────────────────────────────

const UNIVERSAL_RED_FLAGS: { symptom: string; urgency: RedFlag['urgency']; action: string }[] = [
  { symptom: 'chest pain', urgency: 'IMMEDIATE', action: 'Chest pain is a medical emergency. Call emergency services (112/911) immediately.' },
  { symptom: 'difficulty breathing', urgency: 'IMMEDIATE', action: 'Severe breathing difficulty requires emergency medical attention.' },
  { symptom: 'unconscious', urgency: 'IMMEDIATE', action: 'Loss of consciousness is a medical emergency. Call emergency services immediately.' },
  { symptom: 'seizure', urgency: 'IMMEDIATE', action: 'Seizure activity requires immediate emergency care.' },
  { symptom: 'unexplained weight loss', urgency: 'SCHEDULE_APPOINTMENT', action: 'Unexplained weight loss of >10% body weight should be evaluated by a physician.' },
  { symptom: 'persistent fever', urgency: 'WITHIN_24H', action: 'Persistent fever (>3 days) requires medical evaluation.' },
  { symptom: 'blood in stool', urgency: 'WITHIN_24H', action: 'Blood in stool requires prompt medical evaluation.' },
];

// ─── Engine Functions ───────────────────────────────────────────────────────

/**
 * Resolve a user-provided disease name to a known disease key.
 */
function matchDisease(input: string): { key: string; rule: DiseaseRule } | null {
  const lower = input.toLowerCase().trim();
  for (const [key, rule] of Object.entries(DISEASE_RULES)) {
    for (const alias of rule.aliases) {
      if (lower.includes(alias) || alias.includes(lower)) {
        return { key, rule };
      }
    }
  }
  return null;
}

/**
 * Auto-correct common medication misspellings.
 */
function correctMedications(medicines: string): { corrected: string; corrections: string[] } {
  let result = medicines;
  const corrections: string[] = [];
  
  for (const [wrong, right] of Object.entries(MED_CORRECTIONS)) {
    const regex = new RegExp(wrong, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, right);
      corrections.push(`Auto-corrected '${wrong}' → '${right}'`);
    }
  }
  
  return { corrected: result, corrections };
}

/**
 * Detect red flag symptoms from user input.
 */
function detectRedFlags(symptoms: string, diseaseRule: DiseaseRule | null): RedFlag[] {
  const flags: RedFlag[] = [];
  if (!symptoms) return flags;
  
  const lower = symptoms.toLowerCase();
  
  // Check disease-specific red flags
  if (diseaseRule) {
    for (const rf of diseaseRule.redFlagSymptoms) {
      if (lower.includes(rf.symptom)) {
        flags.push({ symptom: rf.symptom, urgency: rf.urgency, action: rf.action });
      }
    }
  }
  
  // Check universal red flags (only add if not already flagged)
  for (const rf of UNIVERSAL_RED_FLAGS) {
    if (lower.includes(rf.symptom) && !flags.some(f => f.symptom === rf.symptom)) {
      flags.push({ symptom: rf.symptom, urgency: rf.urgency, action: rf.action });
    }
  }
  
  return flags;
}

/**
 * Main validation function.
 */
export function validateHealthProfile(input: HealthValidationInput): HealthValidationResult {
  const checks: ValidationCheck[] = [];
  let confidenceScore = 1.0;
  const flaggedItems: string[] = [];

  // ── 1. Input Specificity Check ────────────────────────────────────────
  const lowerDisease = (input.diseaseName || '').toLowerCase().trim();
  
  if (lowerDisease.length < 4 || VAGUE_TERMS.some(term => lowerDisease === term || lowerDisease === term + 's')) {
    checks.push({
      category: 'INPUT_SPECIFICITY',
      passed: false,
      message: 'Please provide a specific medical diagnosis (e.g., "Diabetes Type 2") rather than a symptom or vague term.',
      severity: 'critical'
    });
    confidenceScore -= 0.5;
  } else {
    checks.push({
      category: 'INPUT_SPECIFICITY',
      passed: true,
      message: 'Condition name is specific enough for validation.',
      severity: 'info'
    });
  }

  // ── 2. Disease Recognition ────────────────────────────────────────────
  const match = matchDisease(input.diseaseName);
  
  if (match) {
    checks.push({
      category: 'DISEASE_RECOGNITION',
      passed: true,
      message: `Recognized condition: "${input.diseaseName}" matched to ${match.key.replace(/_/g, ' ')}`,
      severity: 'info'
    });
    confidenceScore += 0.05;
  } else {
    checks.push({
      category: 'DISEASE_RECOGNITION',
      passed: false,
      message: `Condition "${input.diseaseName}" is not in our validated database. Dietary recommendations may be generic. Consider consulting your physician for specific dietary guidance.`,
      severity: 'warning'
    });
    confidenceScore -= 0.15;
  }

  // ── 3. Age Plausibility Check ─────────────────────────────────────────
  const age = Number(input.age);
  if (isNaN(age) || age < 1 || age > 120) {
    checks.push({
      category: 'AGE_PLAUSIBILITY',
      passed: false,
      message: 'Age must be between 1 and 120.',
      severity: 'critical'
    });
    confidenceScore -= 0.3;
  } else if (match && (age < match.rule.ageRange.min || age > match.rule.ageRange.max)) {
    checks.push({
      category: 'AGE_PLAUSIBILITY',
      passed: false,
      message: match.rule.ageRange.note || `Age ${age} is unusual for ${input.diseaseName}. Please verify.`,
      severity: 'warning'
    });
    confidenceScore -= 0.2;
  } else {
    checks.push({
      category: 'AGE_PLAUSIBILITY',
      passed: true,
      message: `Age ${age} is consistent with ${match ? input.diseaseName : 'general health assessment'}.`,
      severity: 'info'
    });
  }

  // ── 4. Stage Mapping Check ────────────────────────────────────────────
  const stage = input.stage || '1';
  if (match) {
    const stageInfo = match.rule.stages[stage];
    if (stageInfo) {
      checks.push({
        category: 'STAGE_MAPPING',
        passed: true,
        message: `Stage ${stage}: ${stageInfo.label}`,
        severity: 'info'
      });
    } else {
      checks.push({
        category: 'STAGE_MAPPING',
        passed: false,
        message: `Stage "${stage}" is not recognized for ${input.diseaseName}.`,
        severity: 'warning'
      });
      confidenceScore -= 0.1;
    }
  } else {
    checks.push({
      category: 'STAGE_MAPPING',
      passed: true,
      message: `Stage ${stage} noted. Generic severity mapping applied.`,
      severity: 'info'
    });
  }

  // ── 5. Medication Alignment ───────────────────────────────────────────
  const { corrected: correctedMeds, corrections } = correctMedications(input.medicines || '');
  const lowerMeds = correctedMeds.toLowerCase();
  
  // Add correction flags as info checks
  for (const corr of corrections) {
    checks.push({
      category: 'MEDICATION_ALIGNMENT',
      passed: true,
      message: corr,
      severity: 'info'
    });
  }

  if (match && lowerMeds.trim()) {
    const stageInfo = match.rule.stages[stage];
    if (stageInfo && stageInfo.expectedMeds.length > 0) {
      const hasExpected = stageInfo.expectedMeds.some(med => lowerMeds.includes(med));
      if (!hasExpected) {
        checks.push({
          category: 'MEDICATION_ALIGNMENT',
          passed: false,
          message: `Stage ${stage} ${input.diseaseName} typically involves: ${stageInfo.expectedMeds.join(', ')}. Your listed medications don't include these. Please verify with your physician.`,
          severity: 'warning'
        });
        confidenceScore -= 0.15;
      } else {
        checks.push({
          category: 'MEDICATION_ALIGNMENT',
          passed: true,
          message: 'Medications align with the reported condition and stage.',
          severity: 'info'
        });
      }
    }
  } else if (match && !lowerMeds.trim()) {
    const stageInfo = match.rule.stages[stage];
    if (stageInfo && stageInfo.expectedMeds.length > 0) {
      checks.push({
        category: 'MEDICATION_ALIGNMENT',
        passed: false,
        message: `No medications listed for Stage ${stage} ${input.diseaseName}. Typical medications include: ${stageInfo.expectedMeds.join(', ')}. If you are on medication, please add them.`,
        severity: 'warning'
      });
      confidenceScore -= 0.1;
    }
  }

  // ── 6. Red Flag Detection ────────────────────────────────────────────
  const redFlags = detectRedFlags(input.symptoms || '', match?.rule || null);

  // ── 7. Calculate Final Results ───────────────────────────────────────
  confidenceScore = Math.max(0, Math.min(1, confidenceScore));
  
  const passedChecks = checks.filter(c => c.passed).length;
  const failedChecks = checks.filter(c => !c.passed).length;
  const hasCritical = checks.some(c => !c.passed && c.severity === 'critical');
  const hasImmediate = redFlags.some(rf => rf.urgency === 'IMMEDIATE');
  
  const valid = !hasCritical && confidenceScore >= 0.5;
  
  let suggestedAction: HealthValidationResult['suggestedAction'] = 'APPROVE';
  if (hasCritical || confidenceScore < 0.4) {
    suggestedAction = 'REJECT';
  } else if (failedChecks > 0 || confidenceScore < 0.7) {
    suggestedAction = 'REQUIRE_MANUAL_REVIEW';
  }

  // Dietary contraindications
  const dietaryContraindications = match?.rule.dietaryRestrictions || [];

  // Escalation
  const escalation: EscalationCriteria = {
    shouldConsultDoctor: hasImmediate || redFlags.length > 0 || !valid || input.diagnosedBy === 'self',
    reason: hasImmediate
      ? 'Urgent symptoms detected that require immediate medical attention.'
      : redFlags.length > 0
        ? 'Symptoms reported that should be evaluated by a healthcare professional.'
        : !valid
          ? 'Health profile could not be fully validated. A physician consultation is recommended.'
          : input.diagnosedBy === 'self'
            ? 'Self-reported diagnosis should be confirmed by a healthcare professional.'
            : undefined,
    specialtyRecommended: match?.rule.specialist,
    timeframe: hasImmediate ? 'Immediately' : redFlags.length > 0 ? 'Within 1 week' : !valid ? 'At your earliest convenience' : undefined,
  };

  // References
  const references: ClinicalReference[] = match?.rule.references || [];

  // Risk level
  let riskLevel: StructuredSummary['riskLevel'] = 'LOW';
  if (hasImmediate || stage === '3') riskLevel = 'HIGH';
  else if (redFlags.length > 0 || stage === '2' || failedChecks > 0) riskLevel = 'MODERATE';

  // Medications as array
  const medsArray = correctedMeds
    ? correctedMeds.split(/[,;\n]+/).map(m => m.trim()).filter(Boolean)
    : [];

  // Dietary guidance string
  const dietaryGuidance = match?.rule.detailedGuidance
    ? match.rule.detailedGuidance
    : dietaryContraindications.length > 0
      ? `Avoid: ${dietaryContraindications.join(', ')}. Prioritize whole, unprocessed foods suitable for your condition.`
      : 'No specific dietary restrictions identified. Maintain a balanced, healthy diet.';

  // Next steps
  const nextSteps: string[] = [];
  if (escalation.shouldConsultDoctor && escalation.specialtyRecommended) {
    nextSteps.push(`Consult a ${escalation.specialtyRecommended} ${escalation.timeframe ? escalation.timeframe.toLowerCase() : 'at your convenience'}.`);
  }
  for (const rf of redFlags) {
    nextSteps.push(rf.action);
  }
  if (dietaryContraindications.length > 0) {
    nextSteps.push(`Review Foods66 menu for items tagged as safe for your condition.`);
  }
  if (medsArray.length > 0) {
    nextSteps.push('Verify your medication list with your physician at your next appointment.');
  }
  if (nextSteps.length === 0) {
    nextSteps.push('Continue following your current treatment plan and healthy eating habits.');
  }

  // Disclaimers
  const disclaimers = [
    'This analysis is for dietary recommendation purposes only and is NOT a medical diagnosis.',
    'Always consult your physician before making changes to medications or diet.',
    'The confidence score reflects data consistency, not clinical accuracy.',
    'If you experience any emergency symptoms, seek medical attention immediately.',
  ];

  // Structured summary
  const structuredSummary: StructuredSummary = {
    patientData: {
      age,
      condition: input.diseaseName,
      stage: match ? (match.rule.stages[stage]?.label || `Stage ${stage}`) : `Stage ${stage}`,
      medications: medsArray
    },
    validationChecks: { total: checks.length, passed: passedChecks, failed: failedChecks },
    riskLevel,
    dietaryGuidance,
    nextSteps,
  };

  return {
    valid,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    suggestedAction,
    checks,
    dietaryContraindications,
    correctedMedicines: correctedMeds,
    redFlags,
    escalation,
    references,
    disclaimers,
    structuredSummary,
  };
}
