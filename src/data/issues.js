export const ISSUE_CATEGORIES = Object.freeze([
  { code: 1, label: "Agriculture" },
  { code: 2, label: "Animal Welfare" },
  { code: 3, label: "Arts/Humanities" },
  { code: 4, label: "Banking/Finance" },
  { code: 5, label: "Budget/Spending" },
  { code: 6, label: "Children/Families" },
  { code: 7, label: "Crime/Law Enforcement" },
  { code: 8, label: "Defense/Military" },
  { code: 9, label: "Education" },
  { code: 10, label: "Economy/Business" },
  { code: 11, label: "Elections/Campaign Finance" },
  { code: 12, label: "Energy" },
  { code: 13, label: "Environment" },
  { code: 14, label: "Foreign Affairs" },
  { code: 15, label: "Guns" },
  { code: 16, label: "Health Care" },
  { code: 17, label: "Homeland Security" },
  { code: 18, label: "Housing" },
  { code: 19, label: "Immigration" },
  { code: 20, label: "Judges/Courts" },
  { code: 21, label: "Labor" },
  { code: 22, label: "Medicare/Medicaid" },
  { code: 23, label: "Reproductive Rights/Abortion" },
  { code: 24, label: "Regulations" },
  { code: 25, label: "Seniors Issues" },
  { code: 26, label: "Social Security" },
  { code: 27, label: "Taxes" },
  { code: 28, label: "Science/Technology" },
  { code: 29, label: "Trade" },
  { code: 30, label: "Transportation" },
  { code: 31, label: "Veterans Issues" },
  { code: 32, label: "Government Operations/Congress" },
]);

export function issueLabel(code) {
  const c = Number(code);
  const found = ISSUE_CATEGORIES.find((x) => x.code === c);
  return found ? found.label : `Issue #${c}`;
}
