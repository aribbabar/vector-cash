import { AccountCategory } from '../models/account-category.model';
import { Account } from '../models/account.model';
import { Entry } from '../models/entry.model';

export class SeedDataGenerator {
  static generateAccountCategories(): AccountCategory[] {
    return [
      { name: 'Checking', type: 'Asset', isActive: true },
      { name: 'Savings', type: 'Asset', isActive: true },
      { name: 'Investment', type: 'Asset', isActive: true },
      { name: 'Retirement', type: 'Asset', isActive: true },
      { name: 'Cash', type: 'Asset', isActive: true },
      { name: 'Credit Card', type: 'Liability', isActive: true },
      { name: 'Loan', type: 'Liability', isActive: true }
    ];
  }

  static generateAccounts(): Account[] {
    return [
      { name: 'Chase Checking', categoryId: 1, isActive: true },
      {
        name: 'Bank of America Checking',
        categoryId: 1,
        isActive: true
      },
      {
        name: 'Capital One Savings',
        categoryId: 2,
        isActive: true
      },
      {
        name: 'Ally High-Yield Savings',
        categoryId: 2,
        isActive: true
      },
      { name: 'Discover it', categoryId: 6, isActive: true },
      {
        name: 'Chase Sapphire',
        categoryId: 6,
        isActive: true
      },
      {
        name: 'Fidelity Brokerage',
        categoryId: 3,
        isActive: true
      },
      {
        name: 'Vanguard Index Fund',
        categoryId: 3,
        isActive: true
      },
      { name: 'Roth IRA', categoryId: 4, isActive: true },
      { name: '401(k)', categoryId: 4, isActive: true },
      { name: 'Mortgage', categoryId: 7, isActive: true },
      { name: 'Auto Loan', categoryId: 7, isActive: true },
      { name: 'Wallet', categoryId: 5, isActive: true }
    ];
  }

  static generateEntries(): Entry[] {
    const entries: Entry[] = [];
    const accounts = this.generateAccounts();
    const today = new Date('03/21/2025');
    const twoYearsAgo = new Date('03/21/2023');

    // Create monthly entries for each account over the past 2 years
    for (
      let d = new Date(twoYearsAgo);
      d <= today;
      d.setMonth(d.getMonth() + 1)
    ) {
      const currentDate = new Date(d);

      accounts.forEach((account, index) => {
        // Generate realistic balance progression
        const monthsFromStart = Math.floor(
          (currentDate.getTime() - twoYearsAgo.getTime()) /
            (30 * 24 * 60 * 60 * 1000)
        );
        let baseBalance = 0;

        // Set different starting balances based on account type
        switch (account.categoryId) {
          case 1: // Checking
            baseBalance =
              2500 + monthsFromStart * 50 + (Math.random() * 1000 - 500); // Fluctuating with slight uptrend
            break;
          case 2: // Savings
            baseBalance = 10000 + monthsFromStart * 150; // Steady growth
            break;
          case 3: // Investment
            baseBalance =
              25000 + monthsFromStart * 400 + (Math.random() * 2000 - 1000); // Higher growth with volatility
            break;
          case 4: // Retirement
            baseBalance = 50000 + monthsFromStart * 500; // Steady higher growth
            break;
          case 5: // Cash
            baseBalance = 100 + (Math.random() * 200 - 100); // Small fluctuating
            break;
          case 6: // Credit Cards (Liability)
            baseBalance = 1000 + Math.random() * 1500; // Negative balances, fluctuating
            break;
          case 7: // Loans (Liability)
            baseBalance = 200000 - monthsFromStart * 800; // Decreasing negative balance
            break;
          default:
            baseBalance = 1000 + Math.random() * 500; // Default case
            break;
        }

        // Round to 2 decimal places
        baseBalance = Math.round(baseBalance * 100) / 100;

        entries.push({
          date: Intl.DateTimeFormat('en-US').format(currentDate),
          accountId: index + 1, // Assuming accountId starts from 1
          balance: baseBalance
        });
      });
    }

    return entries;
  }
}
