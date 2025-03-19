import { AccountType } from '../enums/account-type.enum';

export interface Account {
  id?: number;
  name: string;
  type: AccountType;
  categoryId: number;
}
