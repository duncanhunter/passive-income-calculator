// ExampleUsage.ts

import { calculateForecast } from "./forecastCalculator"; // or wherever you placed the function
import { Profile, Settings, Asset } from "./types";

// 1. Define the default settings for your scenario
const settings: Settings = {
    defaultCapitalGrowthRate: 5,         // 5% growth per year
    defaultExpenseGrowthRate: 3,         // 3% expense growth per year
    defaultLoanToValueRatio: 80,         // 80% LVR
    defaultLoanInterestRate: 6,          // 6% annual interest
    defaultLoanInterestOnlyPeriod: 3,    // 3 years interest-only
};

// 2. Define the profile
const profile: Profile = {
    currentYear: 2025,
    yearsToGoal: 10,           // forecast 10 years
    passiveINcomeGoal: 100000, // aim for $100k net passive income
    assets: [
        {
            name: "Investment Property A",
            type: "investmentProperty",
            purchaseYear: "2025",
            // Suppose we only specify minimal fields, others will use defaults from `Settings`
            purchaseMarketValue: 500000, // $500k
            incomePerWeek: 500,         // $500 / week
            expensesPerYear: 8000,      // $8k / year
            loanAmount: 400000,         // $400k loan
            // We'll leave out capitalGrowthRate, expenseGrowthRate, interestRate, etc.
            // so that the defaults from `settings` apply.
        },
        {
            name: "Stock Portfolio B",
            type: "stockPortfolio",
            purchaseYear: "2023",
            purchaseMarketValue: 200000,
            incomePerWeek: 200,
            expensesPerYear: 200,       // small fees
            loanAmount: 50000,          // maybe used margin loan
            loanInterestOnlyPeriod: 2,  // specify a custom interest-only period 
        },
        {
            name: "Principal Place of Residence",
            type: "principalPlaceOfResidence",
            purchaseYear: "2024",
            purchaseMarketValue: 600000,
            incomePerWeek: 0,
            expensesPerYear: 3000,
            loanAmount: 450000,
            loanInterestOnlyPeriod: 5,  // custom
            // You might not expect to produce income from a principal place of residence,
            // but for completeness, let's include it.
        },
    ],
};

// 3. Calculate the forecast
const forecastResults = calculateForecast(profile, settings);

// 4. Display the results in a simple console table
console.log("Year | Gross Income | Expenses | Net Income | Gap to Goal | #Assets | Asset Value | Loan Balance | Equity");
forecastResults.forEach((result, i) => {
    const yearLabel = profile.currentYear + i;

    console.log(
        `${yearLabel} | ` +
        `${result.grossIncome} | ` +
        `${result.expenses} | ` +
        `${result.netIncome} | ` +
        `${result.gapToIncomeGoal} | ` +
        `${result.numberOfAssets} | ` +
        `${result.assetValue} | ` +
        `${result.assetLoanBalance} | ` +
        `${result.equity}`
    );
});