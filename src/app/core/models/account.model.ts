import { AccountCategory } from '../enums/account-category.enum';

export class Account {
  id?: number;
  type!: string;
  category!: AccountCategory;
  institutionName!: string;

  toString(): string {
    return `${this.institutionName} - ${this.type}`;
  }
}
