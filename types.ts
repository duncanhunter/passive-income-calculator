export interface Profile {
    currentYear: number;
    yearsToGoal: number;
    passiveIncomeGoal: number;
    assets: Asset[];
}

export interface Result {
    currentYear: number;
    grossIncome: number;
    expenses: number;
    netIncome: number;
    totalPrincipalPaid: number; // Added: total principal repayments across all assets
    cashFlowAfterPrincipal: number; // Added: net income minus principal payments
    gapToIncomeGoal: number;
    realGapToGoal: number; // Added: gap based on cash flow after principal
    numberOfAssets: number;
    assetValue: number;
    assetLoanBalance: number;
    equity: number;
    assets: AssetYearBreakdown[];
}

export interface Settings {
    defaultCapitalGrowthRate: number;
    defaultExpenseGrowthRate: number;
    defaultIncomeGrowthRate: number;
    defaultLoanToValueRatio: number;
    defaultLoanInterestRate: number;
    defaultLoanInterestOnlyPeriod: number;
    defaultLoanTermYears: number; // Added: default loan term (typically 30 years)
    defaultPrincipalResidenceLoanTermYears: number; // Added: default loan term for PPOR (typically 20 years)
}

export interface Asset {
    name: string;
    type: "investmentProperty"
    | "selfManagedSuperFund"
    | "commercialProperty"
    | "stockPortfolio"
    | "principalPlaceOfResidence";

    // Growth & Income
    capitalGrowthRate?: number;  // e.g. 0.05 => 5%
    incomePerWeek?: number;      // e.g. 500
    incomeGrowthRate?: number;   // e.g. 0.02 => 2%
    expensesPerYear?: number;    // e.g. 8000
    expenseGrowthRate?: number;  // e.g. 0.02 => 2%

    // Purchase info
    purchaseYear: number;        // e.g. "2025"
    purchaseMarketValue?: number; // e.g. 500000

    // Loan info
    loanAmount?: number;         // e.g. 400000
    loanToValueRatio?: number;   // e.g. 0.80
    loanInterestRate?: number;   // e.g. 0.06
    loanInterestOnlyPeriod?: number; // in years
    loanTermYears?: number; // Added: optional custom loan term in years
}

export interface AssetYearBreakdown {
    name: string;
    type: string;
    grossIncome: number;
    operatingExpenses: number;
    interestPaid: number;
    principalPaid: number;
    netIncome: number;
    cashFlowAfterPrincipal: number; // Added: net income minus principal payments
    loanBalanceEnd: number;
    assetValue: number;
}
