export class AccountCategory {
  id?: number;
  name!: string; // e.g, "Checking", "Savings", "Credit Card", "Investment"
  type!: 'Asset' | 'Liability';
  description: string = '';
  isActive: boolean = true;

  toString(): string {
    return this.name;
  }
}
