import Big from "big.js";
import { Profile, Result, Settings } from "./types.js";

/**
 * A helper to convert a "percentage integer" (e.g. 5 for 5%) to decimal (0.05).
 */
function toDecimalRate(inputRate: number): number {
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
    const raw = assetValue != null ? assetValue : defaultPercentage;
    return toDecimalRate(raw);
}

function getOrDefaultNumber(
    assetValue: number | undefined,
    defaultVal: number
): number {
    return assetValue != null ? assetValue : defaultVal;
}

/**
 * Compute the fixed annual payment for a Principal+Interest loan (annual compounding/repayments).
 *
 * @param principal original loan amount
 * @param annualInterest decimal (e.g. 0.06 for 6%)
 * @param yearsOfRepayment number of years to fully repay
 * @returns The fixed annual payment required to amortize over `yearsOfRepayment`.
 *          If annualInterest=0 => principal/yearsOfRepayment
 */
function computeAnnualPiPayment(
    principal: Big,
    annualInterest: Big,
    yearsOfRepayment: number
): Big {
    if (yearsOfRepayment <= 0) {
        // no years to repay => treat as zero or immediate
        return Big(0);
    }
    if (annualInterest.eq(0)) {
        // no interest => just principal / years
        return principal.div(yearsOfRepayment);
    }
    // Formula: Payment = P * [ i / (1 - (1+i)^(-n)) ]
    // i = annualInterest, n = yearsOfRepayment
    const i = annualInterest;
    const n = yearsOfRepayment; // Use the number directly
    // (1 + i)^(-n)
    const denom = Big(1).minus(
        Big(1).plus(i).pow(-n) // Use negative number directly instead of Big.times(-1)
    );
    if (denom.eq(0)) {
        // avoid division by zero if something is off
        return Big(0);
    }
    return principal.times(
        i.div(denom)
    );
}

/**
 * Main forecast calculation:
 * - Iterates year by year from startYear (earliest purchase) up to startYear+49
 * - Tracks each asset's loan balance so that:
 *    1. For years <= interestOnlyPeriod: interest-only payments.
 *    2. After interestOnlyPeriod: principal+interest amortization over remaining term (based on asset type).
 * - Returns a detailed breakdown each year, including per-asset data.
 */
export function calculateForecast(
    profile: Profile,
    settings: Settings
): Result[] {
    // We'll get the loan term based on asset type
    // Default to 30 if not specified in settings
    const DEFAULT_LOAN_TERM_YEARS = settings.defaultLoanTermYears || 30;
    const DEFAULT_PPOR_LOAN_TERM_YEARS = settings.defaultPrincipalResidenceLoanTermYears || 20;

    // 1) Convert numeric defaults
    const defaultCapitalGrowth = toDecimalRate(settings.defaultCapitalGrowthRate);
    const defaultExpenseGrowth = toDecimalRate(settings.defaultExpenseGrowthRate);
    const defaultLoanToValue = toDecimalRate(settings.defaultLoanToValueRatio);
    const defaultLoanInterest = toDecimalRate(settings.defaultLoanInterestRate);

    // 2) Preprocess assets: parse purchase year, fill in default rates
    const assetsProcessed = profile.assets.map((asset) => {
        const parsedPurchaseYear = asset.purchaseYear;

        // Make sure we store capitalGrowthRate etc. in decimal
        const capitalGrowthRate = getOrDefaultRate(
            asset.capitalGrowthRate,
            settings.defaultCapitalGrowthRate
        );
        const incomeGrowthRate = getOrDefaultRate(asset.incomeGrowthRate, settings.defaultIncomeGrowthRate);
        const expenseGrowthRate = getOrDefaultRate(
            asset.expenseGrowthRate,
            settings.defaultExpenseGrowthRate
        );
        const loanInterestRate = getOrDefaultRate(
            asset.loanInterestRate,
            settings.defaultLoanInterestRate
        );

        // Determine loan term based on asset type or specified term
        let loanTermYears = asset.loanTermYears;
        if (loanTermYears == null) {
            // No specific term provided, use default based on type
            loanTermYears = asset.type === "principalPlaceOfResidence"
                ? DEFAULT_PPOR_LOAN_TERM_YEARS
                : DEFAULT_LOAN_TERM_YEARS;
        }

        return {
            ...asset,
            _purchaseYear: parsedPurchaseYear,
            capitalGrowthRate,
            // Support both incomePerYear and incomePerWeek for backwards compatibility
            incomePerYear: getOrDefaultNumber(
                asset.incomePerYear,
                0
            ),
            incomeGrowthRate,
            expensesPerYear: getOrDefaultNumber(asset.expensesPerYear, 0),
            expenseGrowthRate,
            purchaseMarketValue: getOrDefaultNumber(asset.purchaseMarketValue, 0),
            loanAmount: getOrDefaultNumber(asset.loanAmount, 0),
            loanToValueRatio: getOrDefaultRate(
                asset.loanToValueRatio,
                settings.defaultLoanToValueRatio
            ),
            loanInterestRate,
            loanInterestOnlyPeriod: getOrDefaultNumber(
                asset.loanInterestOnlyPeriod,
                settings.defaultLoanInterestOnlyPeriod
            ),
            loanTermYears, // Store the loan term we determined
        };
    });

    // 3) We'll track each asset's current loan balance from year to year.
    //    We also need to pre-calc the "annual P+I payment" after interest-only ends,
    //    for that asset's remaining term (loanTermYears - interestOnly).
    const assetStates = assetsProcessed.map((asset) => {
        const originalPrincipal = Big(asset.loanAmount);
        const interestRate = Big(asset.loanInterestRate);
        const ioPeriod = asset.loanInterestOnlyPeriod;
        const piYears = asset.loanTermYears - ioPeriod;
        // If piYears < 0, that means interestOnlyPeriod is bigger than total term,
        // so we'll clamp it to 0 => there's effectively never P+I.
        const finalPiYears = piYears > 0 ? piYears : 0;

        const annualPiPayment = computeAnnualPiPayment(
            originalPrincipal,
            interestRate,
            finalPiYears
        );

        return {
            currentLoanBalance: originalPrincipal, // start at original principal
            annualPiPayment,                      // fixed P+I payment once IO ends
        };
    });

    // Use the provided startYear if available, otherwise use currentYear
    // This allows us to calculate from the earliest purchase year
    const startYear = profile.startYear || profile.currentYear;

    // Create results array
    const results: Result[] = [];

    // 4) Forecast loop from startYear up to startYear + 49 (50 years total)
    for (let yearOffset = 0; yearOffset < 50; yearOffset++) {
        const forecastYear = startYear + yearOffset;

        // Per-year totals (across all assets)
        let totalGrossIncome = Big(0);
        let totalExpenses = Big(0);
        let totalAssetValue = Big(0);
        let totalLoanBalance = Big(0);
        let numberOfActiveAssets = 0;

        // We'll also create a per-asset breakdown for this year:
        const assetsBreakdown: {
            name: string;
            type: string;
            grossIncome: number;
            operatingExpenses: number;
            interestPaid: number;
            principalPaid: number;
            netIncome: number;
            cashFlowAfterPrincipal: number;
            loanBalanceEnd: number;
            assetValue: number;
            // you can add more fields if desired
        }[] = [];

        // Loop over each asset
        assetsProcessed.forEach((asset, i) => {
            const yearsHeld = forecastYear - asset._purchaseYear;
            if (yearsHeld < 0) {
                // not purchased yet
                return;
            }

            // The asset is active this year
            numberOfActiveAssets++;

            // 4.1 Capital Growth
            // Value(t) = purchaseMarketValue * (1 + capitalGrowthRate)^yearsHeld
            const currentValue = Big(asset.purchaseMarketValue!).times(
                Big(1).plus(asset.capitalGrowthRate!).pow(Math.max(0, yearsHeld))
            );

            // 4.2 Income (annual)
            // Just use the annual income directly instead of calculating from weekly
            const baseAnnualIncome = Big(asset.incomePerYear!);
            const grownAnnualIncome = baseAnnualIncome.times(
                Big(1).plus(asset.incomeGrowthRate!).pow(Math.max(0, yearsHeld))
            );

            // 4.3 Operating Expenses
            // annualExpenses = expensesPerYear * (1 + expenseGrowthRate)^yearsHeld
            const baseExpenses = Big(asset.expensesPerYear!);
            const grownExpenses = baseExpenses.times(
                Big(1).plus(asset.expenseGrowthRate!).pow(Math.max(0, yearsHeld))
            );

            // 4.4 Loan - interest + principal
            //    - If yearsHeld <= interestOnlyPeriod => interest-only
            //    - Else => P+I payment
            // We'll track interestPaid and principalPaid separately
            let interestPaid = Big(0);
            let principalPaid = Big(0);

            const loanBalanceBefore = assetStates[i].currentLoanBalance; // from end of last year
            let loanBalanceAfter = loanBalanceBefore;                   // will update

            if (loanBalanceBefore.gt(0)) {
                const interestRate = Big(asset.loanInterestRate!);
                const ioPeriod = asset.loanInterestOnlyPeriod!;
                const loanTermYears = asset.loanTermYears!; // Use the asset-specific loan term
                const yearOfLoan = yearsHeld + 1;
                // e.g. in the purchase year, yearsHeld=0 => yearOfLoan=1

                // total P+I years after IO:
                const piYears = loanTermYears - ioPeriod;
                // If we've exceeded total loan term years, the loan should be fully repaid
                if (yearOfLoan > loanTermYears) {
                    // beyond the entire loan term
                    interestPaid = Big(0);
                    principalPaid = Big(0);
                    loanBalanceAfter = Big(0);
                } else {
                    if (yearOfLoan <= ioPeriod) {
                        // Interest-only period
                        interestPaid = loanBalanceBefore.times(interestRate);
                        principalPaid = Big(0);
                        loanBalanceAfter = loanBalanceBefore; // no change to principal
                    } else {
                        // We are in P+I territory
                        // We'll use the precomputed annualPiPayment
                        const annualPiPayment = assetStates[i].annualPiPayment;
                        // interest portion
                        interestPaid = loanBalanceBefore.times(interestRate);
                        const totalPayment = annualPiPayment;

                        // if totalPayment < interest, you'd have negative principalPaid => that means 
                        // the payment is not even covering interest. We'll assume that doesn't happen 
                        // in a standard amortized scenario. If it does, principal grows.
                        principalPaid = totalPayment.minus(interestPaid);
                        if (principalPaid.lt(0)) {
                            // This would be a "negative amortization" scenario
                            // We'll clamp principalPaid to 0 for safety.
                            principalPaid = Big(0);
                        }
                        // If principalPaid is more than the remaining balance, we just pay it off
                        if (principalPaid.gt(loanBalanceBefore)) {
                            principalPaid = loanBalanceBefore;
                        }
                        loanBalanceAfter = loanBalanceBefore.minus(principalPaid);
                    }
                }
            }

            // Update the asset’s state for next year
            assetStates[i].currentLoanBalance = loanBalanceAfter;

            // Add the loan portion (interest) to expenses
            const totalAssetExpenses = grownExpenses.plus(interestPaid);

            // Summations
            totalGrossIncome = totalGrossIncome.plus(grownAnnualIncome);
            totalExpenses = totalExpenses.plus(totalAssetExpenses);
            totalAssetValue = totalAssetValue.plus(currentValue);
            totalLoanBalance = totalLoanBalance.plus(loanBalanceAfter);

            // Net for this asset = grossIncome - (operating + interest)
            const assetNet = grownAnnualIncome.minus(totalAssetExpenses);

            // Add a new metric: Cash flow after all payments including principal
            const cashFlowAfterAllPayments = assetNet.minus(principalPaid);

            // Build the per-asset breakdown object
            assetsBreakdown.push({
                name: asset.name,
                type: asset.type,
                grossIncome: +grownAnnualIncome.toFixed(2),
                operatingExpenses: +grownExpenses.toFixed(2),
                interestPaid: +interestPaid.toFixed(2),
                principalPaid: +principalPaid.toFixed(2),
                netIncome: +assetNet.toFixed(2),
                cashFlowAfterPrincipal: +cashFlowAfterAllPayments.toFixed(2),
                loanBalanceEnd: +loanBalanceAfter.toFixed(2),
                assetValue: +currentValue.toFixed(2),
            });
        }); // end forEach(asset)

        // Final net, gap, equity across *all* assets
        const netIncome = totalGrossIncome.minus(totalExpenses);
        let totalPrincipalPaid = Big(0);
        assetsBreakdown.forEach(asset => {
            totalPrincipalPaid = totalPrincipalPaid.plus(asset.principalPaid);
        });
        const cashFlowAfterAllPrincipal = netIncome.minus(totalPrincipalPaid);
        const gapToIncomeGoal = Big(profile.passiveIncomeGoal).minus(netIncome);
        const realGapToGoal = Big(profile.passiveIncomeGoal).minus(cashFlowAfterAllPrincipal);
        const equity = totalAssetValue.minus(totalLoanBalance);

        // Create the year result
        results.push({
            currentYear: forecastYear,
            grossIncome: +totalGrossIncome.toFixed(2),
            expenses: +totalExpenses.toFixed(2),
            netIncome: +netIncome.toFixed(2),
            totalPrincipalPaid: +totalPrincipalPaid.toFixed(2),
            cashFlowAfterPrincipal: +cashFlowAfterAllPrincipal.toFixed(2),
            gapToIncomeGoal: +gapToIncomeGoal.toFixed(2),
            realGapToGoal: +realGapToGoal.toFixed(2),
            numberOfAssets: numberOfActiveAssets,
            assetValue: +totalAssetValue.toFixed(2),
            assetLoanBalance: +totalLoanBalance.toFixed(2),
            equity: +equity.toFixed(2),

            // NEW: attach the per-asset breakdown for this year
            assets: assetsBreakdown,
        });
    } // end for each forecastYear

    return results;
}