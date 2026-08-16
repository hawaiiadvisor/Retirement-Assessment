export interface Step {
  number: number;
  title: string;
  description?: string;
}

export const INTAKE_STEPS: Step[] = [
  { number: 1, title: "Household & Timing" },
  { number: 2, title: "Life Expectancy" },
  { number: 3, title: "Spending" },
  { number: 4, title: "Guaranteed Income" },
  { number: 5, title: "Portfolio" },
  { number: 6, title: "Stress & Behavior" },
  { number: 7, title: "Final Review" },
];
