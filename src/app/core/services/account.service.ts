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

  async deleteAccount(id: number) {
    return await db.accounts.delete(id);
  }
}
