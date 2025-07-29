export interface AccessibilityIssue {
  type: "error" | "warning" | "info";
  rule: string;
  message: string;
  element?: string;
  selector?: string;
  standard: "WCAG" | "ARIA" | "MDN" | "AXE";
  level?: "A" | "AA" | "AAA";
  impact?: "minor" | "moderate" | "serious" | "critical";
  // Enhanced explanation fields
  detailedExplanation?: string;
  userImpact?: string;
  howToFix?: {
    steps: string[];
    codeExample?: string;
    badExample?: string;
    goodExample?: string;
  };
  why?: string;
  assistiveTechnologyImpact?: string;
  relatedGuidelines?: string[];
  documentationLinks?: string[];
}

export interface EvaluationResult {
  issues: AccessibilityIssue[];
  summary: {
    totalIssues: number;
    errors: number;
    warnings: number;
    info: number;
    byStandard: Record<string, number>;
    byImpact: Record<string, number>;
  };
  passedChecks: string[];
}

export interface ARIAValidationIssue {
  type: "error" | "warning";
  element: string;
  selector: string;
  message: string;
  recommendation: string;
  specification: string;
  detailedExplanation?: string;
  userImpact?: string;
  howToFix?: {
    steps: string[];
    codeExample?: string;
    badExample?: string;
    goodExample?: string;
  };
  why?: string;
  assistiveTechnologyImpact?: string;
  relatedGuidelines?: string[];
  documentationLinks?: string[];
}

export interface ARIAValidationResult {
  issues: ARIAValidationIssue[];
  validUsages: string[];
  statistics: {
    totalARIAElements: number;
    rolesUsed: Set<string>;
    propertiesUsed: Set<string>;
    statesUsed: Set<string>;
  };
}

export interface ARIARole {
  name: string;
  category: "abstract" | "widget" | "document" | "landmark" | "window";
  requiredProperties: string[];
  supportedProperties: string[];
  requiredParent?: string[];
  requiredChildren?: string[];
  implicitSemantics?: string;
}

export interface WCAGCriterion {
  id: string;
  name: string;
  level: "A" | "AA" | "AAA";
  principle: "Perceivable" | "Operable" | "Understandable" | "Robust";
  guideline: string;
  techniques: string[];
  commonFailures: string[];
}

export interface WCAGComplianceReport {
  level: "A" | "AA" | "AAA" | "None";
  passedCriteria: WCAGCriterion[];
  failedCriteria: WCAGCriterion[];
  notApplicableCriteria: WCAGCriterion[];
  overallScore: number;
  detailedScores: {
    perceivable: number;
    operable: number;
    understandable: number;
    robust: number;
  };
  // Additional fields for enhanced reporting
  targetLevel?: "A" | "AA" | "AAA";
  meetsTarget?: boolean;
  recommendations?: string[];
}

// Configuration interfaces
export interface AccessibilityConfig {
  wcag: WCAGConfig;
  aria: ARIAConfig;
  evaluation: EvaluationConfig;
  reporting: ReportingConfig;
  axe?: AxeConfig;
}

export interface PartialAccessibilityConfig {
  wcag?: Partial<WCAGConfig>;
  aria?: Partial<ARIAConfig>;
  evaluation?: Partial<EvaluationConfig>;
  reporting?: Partial<ReportingConfig>;
  axe?: Partial<AxeConfig>;
}

export interface WCAGConfig {
  defaultLevel: "A" | "AA" | "AAA";
  enabledCriteria?: string[];
  disabledCriteria?: string[];
  customCriteria?: WCAGCriterion[];
  strictMode?: boolean;
}

export interface ARIAConfig {
  enableValidation: boolean;
  customRoles?: ARIARole[];
  ignoreDeprecated?: boolean;
  strictMode?: boolean;
}

export interface EvaluationConfig {
  includePassedChecks: boolean;
  minImpactLevel: "minor" | "moderate" | "serious" | "critical";
  enableEnhancedExplanations: boolean;
  includeCodeExamples: boolean;
  enableDocumentationLinks: boolean;
}

export interface ReportingConfig {
  format: "detailed" | "summary" | "compact";
  includeRecommendations: boolean;
  groupByPrinciple?: boolean;
  showProgressScores?: boolean;
  includeMetadata?: boolean;
}

export interface AxeConfig {
  rules?: Record<string, { enabled: boolean; options?: any }>;
  tags?: string[];
  resultTypes?: ("violations" | "incomplete" | "passes")[];
}

export interface Explanation {
  detailedExplanation: string;
  userImpact: string;
  why: string;
  assistiveTechnologyImpact: string;
  howToFix: {
    steps: string[];
    codeExample?: string;
    badExample?: string;
    goodExample?: string;
  };
  relatedGuidelines?: string[];
  documentationLinks?: string[];
}

export interface ExplanationMap {
  [key: string]: Explanation;
}
