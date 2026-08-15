/**
 * Phase 2 SQLite Database Verification Suite
 * Executes an automated test sequence to verify:
 * 1. Database initialization and migrations
 * 2. Idempotent category seeding
 * 3. User, Account, Transaction, and Transfer CRUD
 * 4. Derived SQL balance aggregation and total balance calculation
 * 5. Atomic transfer logic
 * 6. Foreign key restrictions and CHECK constraints
 */

import { dbManager } from './database';

export interface VerificationResult {
  step: string;
  passed: boolean;
  message: string;
  details?: any;
}

export async function verifyDatabase(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  try {
    // Step 1: Initialization & Migrations
    await dbManager.initialize();
    results.push({
      step: '1. Database Initialization & Migrations',
      passed: true,
      message: 'Database initialized and schema version set to 1 successfully.',
    });

    // Step 2: Idempotent Category Seeding
    const categories = await dbManager.categories.getAll();
    const expCategories = await dbManager.categories.getExpense();
    const incCategories = await dbManager.categories.getIncome();

    const seededCorrectly = expCategories.length === 15 && incCategories.length === 8;
    results.push({
      step: '2. Idempotent Category Seeding',
      passed: seededCorrectly,
      message: `Seeded ${expCategories.length} expense and ${incCategories.length} income categories.`,
    });

    // Re-initialize to verify idempotency
    await dbManager.initialize();
    const categoriesAfterReinit = await dbManager.categories.getAll();
    const noDuplicates = categoriesAfterReinit.length === categories.length;
    results.push({
      step: '3. Seeding Idempotency Check',
      passed: noDuplicates,
      message: noDuplicates
        ? 'Re-initialization did not produce duplicate categories.'
        : 'FAILED: Duplicate categories detected on re-initialization.',
    });

    // Step 3: User Profile Creation
    const user = await dbManager.user.create('Test User', 'INR');
    const fetchedUser = await dbManager.user.get();
    const userPassed = fetchedUser !== null && fetchedUser.name === 'Test User';
    results.push({
      step: '4. User Profile Queries',
      passed: userPassed,
      message: userPassed ? `Created user ${user.name} with currency ${user.currency}` : 'User query failed.',
    });

    // Step 4: Account Creation & Balances
    const acc1 = await dbManager.accounts.create({
      name: 'SBI Savings',
      type: 'bank',
      opening_balance: 1000000, // ₹10,000.00
    });

    const acc2 = await dbManager.accounts.create({
      name: 'HDFC Savings',
      type: 'bank',
      opening_balance: 500000, // ₹5,000.00
    });

    const initialBal1 = await dbManager.accounts.getBalance(acc1.id);
    const initialBal2 = await dbManager.accounts.getBalance(acc2.id);

    const accountsPassed = initialBal1 === 1000000 && initialBal2 === 500000;
    results.push({
      step: '5. Account Creation & Initial Balances',
      passed: accountsPassed,
      message: `Account 1: ₹${initialBal1 / 100}, Account 2: ₹${initialBal2 / 100}`,
    });

    // Step 5: Income & Expense Transactions
    const salaryCat = incCategories[0];
    const foodCat = expCategories[0];

    // Income +₹5,000.00 to Acc 1
    await dbManager.transactions.create({
      account_id: acc1.id,
      category_id: salaryCat.id,
      type: 'income',
      amount: 500000,
      note: 'Monthly Salary',
      transaction_date: '2026-08-01',
    });

    // Expense -₹2,000.00 from Acc 1
    await dbManager.transactions.create({
      account_id: acc1.id,
      category_id: foodCat.id,
      type: 'expense',
      amount: 200000,
      note: 'Groceries',
      transaction_date: '2026-08-02',
    });

    const balAfterTx = await dbManager.accounts.getBalance(acc1.id);
    // Expected: 1000000 + 500000 - 200000 = 1300000 (₹13,000.00)
    const txPassed = balAfterTx === 1300000;
    results.push({
      step: '6. Income/Expense Derived Balance',
      passed: txPassed,
      message: txPassed
        ? `Derived balance matches expected ₹13,000.00 (Actual: ₹${balAfterTx / 100})`
        : `FAILED: Derived balance was ₹${balAfterTx / 100}, expected ₹13,000.00`,
    });

    // Step 6: Atomic Inter-Account Transfer
    // Transfer ₹1,000.00 from Acc 1 to Acc 2
    await dbManager.transfers.create({
      from_account_id: acc1.id,
      to_account_id: acc2.id,
      amount: 100000,
      note: 'Transfer for rent',
      transfer_date: '2026-08-03',
    });

    const bal1AfterTrf = await dbManager.accounts.getBalance(acc1.id); // 1300000 - 100000 = 1200000 (₹12,000.00)
    const bal2AfterTrf = await dbManager.accounts.getBalance(acc2.id); // 500000 + 100000 = 600000 (₹6,000.00)

    const trfPassed = bal1AfterTrf === 1200000 && bal2AfterTrf === 600000;
    results.push({
      step: '7. Inter-Account Transfer Balance Derived Aggregation',
      passed: trfPassed,
      message: trfPassed
        ? `Acc1: ₹${bal1AfterTrf / 100}, Acc2: ₹${bal2AfterTrf / 100}`
        : `FAILED: Balances after transfer were Acc1: ₹${bal1AfterTrf / 100}, Acc2: ₹${bal2AfterTrf / 100}`,
    });

    // Step 7: Total Balance Aggregation (Excluding internal transfers)
    const totalBal = await dbManager.accounts.getTotalBalance();
    // Expected total = 1200000 + 600000 = 1800000 (₹18,000.00)
    const totalPassed = totalBal === 1800000;
    results.push({
      step: '8. Total Balance Aggregation (Excludes double-counted transfers)',
      passed: totalPassed,
      message: totalPassed
        ? `Total combined balance = ₹${totalBal / 100}`
        : `FAILED: Total balance was ₹${totalBal / 100}, expected ₹18,000.00`,
    });

    // Step 8: Constraint Validations
    let constraintPassed = false;
    try {
      // Attempt transfer to same account (Should throw error)
      await dbManager.transfers.create({
        from_account_id: acc1.id,
        to_account_id: acc1.id,
        amount: 50000,
        transfer_date: '2026-08-04',
      });
    } catch (e) {
      constraintPassed = true;
    }

    results.push({
      step: '9. Constraint Enforcement (Same account transfer rejection)',
      passed: constraintPassed,
      message: constraintPassed ? 'Rejected invalid transfer to same account.' : 'FAILED: Constraint did not reject invalid transfer.',
    });

    // Step 9: Foreign Key RESTRICT Protection
    let fkPassed = false;
    try {
      await dbManager.db.execute('DELETE FROM accounts WHERE id = ?;', [acc1.id]);
    } catch (e) {
      fkPassed = true;
    }

    results.push({
      step: '10. Foreign Key RESTRICT Protection',
      passed: fkPassed,
      message: fkPassed ? 'Prevented accidental deletion of account with transaction history.' : 'FAILED: FK restriction failed.',
    });

  } catch (err: any) {
    results.push({
      step: 'Verification Suite Error',
      passed: false,
      message: err?.message || String(err),
    });
  }

  return results;
}
