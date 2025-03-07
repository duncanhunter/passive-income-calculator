import Big from "big.js";
import { Profile, Result, Settings } from "./types";

/**
 * A helper to convert a "percentage integer" (e.g. 5 for 5%) to decimal (0.05).
 * If you already store everything as decimal in the `Asset`, you may not need this.
 */
function toDecimalRate(inputRate: number): number {
    // If the user sets, for example, defaultCapitalGrowthRate = 5 (meaning 5%), convert to 0.05
    // If they already store e.g. 0.05, you can skip or adjust this logic.
    return inputRate > 1 ? inputRate / 100 : inputRate;
}

/**
 * Safely get a numeric property from the asset; if missing/null, use the default from settings.
 * For rates, we apply `toDecimalRate` to the default only if the asset’s property is nullish.
 */
function getOrDefaultRate(
    assetValue: number | undefined,
    defaultPercentage: number
): number {
    return assetValue != null
        ? assetValue
        : toDecimalRate(defaultPercentage);
}

function getOrDefaultNumber(
    assetValue: number | undefined,
    defaultVal: number
): number {
    return assetValue != null ? assetValue : defaultVal;
}

/**
 * Main forecast calculation:
 * - Iterates year by year from 0..(profile.yearsToGoal-1)
 * - Aggregates each asset's income, expenses, loan interest
 * - Applies growth rates with exponent
 */
export function calculateForecast(
    profile: Profile,
    settings: Settings
): Result[] {
    const results: Result[] = [];

    // Convert numeric defaults to decimal-based rates where relevant
    const defaultCapitalGrowth = toDecimalRate(settings.defaultCapitalGrowthRate);
    const defaultExpenseGrowth = toDecimalRate(settings.defaultExpenseGrowthRate);
    const defaultLoanToValue = toDecimalRate(settings.defaultLoanToValueRatio);
    const defaultLoanInterest = toDecimalRate(settings.defaultLoanInterestRate);

    // Preprocess assets to parse purchase year
    // (Assumes purchaseYear is something like "2025" or "2030")
    const assetsProcessed = profile.assets.map((asset) => {
        const parsedPurchaseYear = parseInt(asset.purchaseYear, 10);

        // Fill in any missing fields from settings
        return {
            ...asset,
            capitalGrowthRate: getOrDefaultRate(
                asset.capitalGrowthRate,
                settings.defaultCapitalGrowthRate
            ),
            incomePerWeek: getOrDefaultNumber(asset.incomePerWeek, 0),
            incomeGrowthRate: getOrDefaultRate(
                asset.incomeGrowthRate,
                0
            ), // default 0 if missing
            expensesPerYear: getOrDefaultNumber(asset.expensesPerYear, 0),
            expenseGrowthRate: getOrDefaultRate(
                asset.expenseGrowthRate,
                settings.defaultExpenseGrowthRate
            ),
            purchaseMarketValue: getOrDefaultNumber(asset.purchaseMarketValue, 0),
            loanAmount: getOrDefaultNumber(asset.loanAmount, 0),
            loanToValueRatio: getOrDefaultRate(
                asset.loanToValueRatio,
                settings.defaultLoanToValueRatio
            ),
            loanInterestRate: getOrDefaultRate(
                asset.loanInterestRate,
                settings.defaultLoanInterestRate
            ),
            loanInterestOnlyPeriod: getOrDefaultNumber(
                asset.loanInterestOnlyPeriod,
                settings.defaultLoanInterestOnlyPeriod
            ),
            // extra field:
            _purchaseYear: parsedPurchaseYear
        };
    });

    // Iterate each forecast year
    for (let yearOffset = 0; yearOffset < profile.yearsToGoal; yearOffset++) {
        const forecastYear = profile.currentYear + yearOffset;

        // Track sums in Big.js to reduce floating-point errors
        let totalGrossIncome = Big(0);
        let totalExpenses = Big(0);
        let totalAssetValue = Big(0);
        let totalLoanBalance = Big(0);
        let numberOfActiveAssets = 0;

        // For each asset
        for (const asset of assetsProcessed) {
            // If the asset is purchased on or before this forecast year
            if (asset._purchaseYear <= forecastYear) {
                const yearsHeld = forecastYear - asset._purchaseYear;
                numberOfActiveAssets++;

                // ----- Calculate the capital value of the asset this year -----
                // capitalGrowthRate is already stored as decimal (e.g. 0.05 for 5%)
                // Value(t) = purchaseMarketValue * (1 + capitalGrowthRate)^yearsHeld
                const currentValue = Big(asset.purchaseMarketValue!).times(
                    Big(1).plus(asset.capitalGrowthRate!).pow(yearsHeld > 0 ? yearsHeld : 0)
                );
                totalAssetValue = totalAssetValue.plus(currentValue);

                // ----- Loan Balance (Assume interest-only, principal stays constant) -----
                // If the asset has been purchased, the loan is the same as at the beginning.
                const currentLoanBalance = Big(asset.loanAmount!);
                totalLoanBalance = totalLoanBalance.plus(currentLoanBalance);

                // ----- Calculate annual income from the asset -----
                // annualIncome(t) = (incomePerWeek * 52) * (1 + incomeGrowthRate)^yearsHeld
                const baseAnnualIncome = Big(asset.incomePerWeek!).times(52);
                const grownAnnualIncome = baseAnnualIncome.times(
                    Big(1).plus(asset.incomeGrowthRate!).pow(yearsHeld > 0 ? yearsHeld : 0)
                );
                totalGrossIncome = totalGrossIncome.plus(grownAnnualIncome);

                // ----- Calculate expenses (asset-level) -----
                // annualExpenses(t) = expensesPerYear * (1 + expenseGrowthRate)^yearsHeld
                const baseExpenses = Big(asset.expensesPerYear!);
                const grownExpenses = baseExpenses.times(
                    Big(1).plus(asset.expenseGrowthRate!).pow(yearsHeld > 0 ? yearsHeld : 0)
                );

                // ----- Loan Interest (interest-only) -----
                // If (yearsHeld <= loanInterestOnlyPeriod) => interest is 0 or minimal, 
                // otherwise interest = loanAmount * loanInterestRate
                let interestCost = Big(0);
                if (yearsHeld > asset.loanInterestOnlyPeriod!) {
                    interestCost = currentLoanBalance.times(asset.loanInterestRate!);
                }

                // Summation
                const totalAssetExpenses = grownExpenses.plus(interestCost);
                totalExpenses = totalExpenses.plus(totalAssetExpenses);
            }
        } // end for each asset

        // Now compute net, gap, etc.
        const netIncome = totalGrossIncome.minus(totalExpenses);
        const gapToIncomeGoal = Big(profile.passiveIncomeGoal).minus(netIncome);
        const equity = totalAssetValue.minus(totalLoanBalance);

        const result: Result = {
            grossIncome: +totalGrossIncome.toFixed(2),
            expenses: +totalExpenses.toFixed(2),
            netIncome: +netIncome.toFixed(2),
            gapToIncomeGoal: +gapToIncomeGoal.toFixed(2),
            numberOfAssets: numberOfActiveAssets,
            assetValue: +totalAssetValue.toFixed(2),
            assetLoanBalance: +totalLoanBalance.toFixed(2),
            equity: +equity.toFixed(2),
        };

        results.push(result);
    }

    return results;
}