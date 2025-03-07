
export interface Profile {
    currentYear: number;
    yearsToGoal: number;
    passiveIncomeGoal: number;
    assets: Asset[];
}

export interface Result {
    grossIncome: number;
    expenses: number;
    netIncome: number;
    gapToIncomeGoal: number;
    numberOfAssets: number;
    assetValue: number;
    assetLoanBalance: number;
    equity: number;
}

export interface Settings {
    /**
     * Default annual capital growth rate (%). e.g. 5 => 5%.
     * Will be converted to 0.05 in code.
     */
    defaultCapitalGrowthRate: number;

    /**
     * Default annual expense growth rate (%). e.g. 3 => 3%.
     * Will be converted to 0.03 in code.
     */
    defaultExpenseGrowthRate: number;

    /**
     * Default loan-to-value ratio (%). e.g. 80 => 80%.
     * Will be converted to 0.80 in code.
     */
    defaultLoanToValueRatio: number;

    /**
     * Default annual loan interest rate (%). e.g. 6 => 6%.
     * Will be converted to 0.06 in code.
     */
    defaultLoanInterestRate: number;

    /**
     * Default interest-only period (in years).
     */
    defaultLoanInterestOnlyPeriod: number;
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
    purchaseYear: string;        // e.g. "2025"
    purchaseMarketValue?: number; // e.g. 500000

    // Loan info
    loanAmount?: number;         // e.g. 400000
    loanToValueRatio?: number;   // e.g. 0.80
    loanInterestRate?: number;   // e.g. 0.06
    loanInterestOnlyPeriod?: number; // in years
}

export interface AssetForecast extends Asset {
    currentValue: number;
    currentYear: number;
}
