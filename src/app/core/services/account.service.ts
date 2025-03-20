import { Injectable } from '@angular/core';
import { Account } from '../models/account.model';
import db from './database.service';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  async addAccount(account: Account) {
    return await db.accounts.add(account);
  }

  async getAccounts(): Promise<Account[]> {
    return await db.accounts.toArray();
  }

  async getAccount(id: number): Promise<Account> {
    const account = await db.accounts.get(id);

    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  }

  async deleteAccount(id: number) {
    return await db.accounts.delete(id);
  }
}
