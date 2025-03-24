export class AccountCategory {
  id?: number;
  name!: string; // e.g, "Checking", "Savings", "Credit Card", "Investment"
  type!: 'Asset' | 'Liability';
  isActive: boolean = true;

  toString(): string {
    return this.name;
  }
}
