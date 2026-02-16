import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { IntakeData, ResultsData } from "@shared/schema";

type AssessmentContextType = {
  intakeData: Partial<IntakeData>;
  setIntakeData: (data: Partial<IntakeData>) => void;
  results: ResultsData | null;
  setResults: (results: ResultsData | null) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  resetAssessment: () => void;
};

const AssessmentContext = createContext<AssessmentContextType | null>(null);

const STORAGE_KEY_INTAKE = "rra_intake_data";
const STORAGE_KEY_RESULTS = "rra_results";
const STORAGE_KEY_STEP = "rra_current_step";

const DEFAULT_INTAKE: Partial<IntakeData> = {
  flexibility_score: 5,
  has_mortgage: false,
  spending_confidence: 5,
  ss_not_sure: false,
  has_pension: false,
  has_rental_business_income: false,
  diversification_confidence: 5,
  readiness_feel: 5
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [intakeData, setIntakeDataRaw] = useState<Partial<IntakeData>>(() =>
    loadFromStorage(STORAGE_KEY_INTAKE, DEFAULT_INTAKE)
  );
  const [results, setResultsRaw] = useState<ResultsData | null>(() =>
    loadFromStorage(STORAGE_KEY_RESULTS, null)
  );
  const [currentStep, setCurrentStepRaw] = useState<number>(() =>
    loadFromStorage(STORAGE_KEY_STEP, 1)
  );

  const setIntakeData = (data: Partial<IntakeData>) => {
    setIntakeDataRaw(data);
    saveToStorage(STORAGE_KEY_INTAKE, data);
  };

  const setResults = (data: ResultsData | null) => {
    setResultsRaw(data);
    saveToStorage(STORAGE_KEY_RESULTS, data);
  };

  const setCurrentStep = (step: number) => {
    setCurrentStepRaw(step);
    saveToStorage(STORAGE_KEY_STEP, step);
  };

  const resetAssessment = () => {
    setIntakeDataRaw(DEFAULT_INTAKE);
    setResultsRaw(null);
    setCurrentStepRaw(1);
    localStorage.removeItem(STORAGE_KEY_INTAKE);
    localStorage.removeItem(STORAGE_KEY_RESULTS);
    localStorage.removeItem(STORAGE_KEY_STEP);
  };

  return (
    <AssessmentContext.Provider value={{ intakeData, setIntakeData, results, setResults, currentStep, setCurrentStep, resetAssessment }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used within AssessmentProvider");
  return ctx;
}
