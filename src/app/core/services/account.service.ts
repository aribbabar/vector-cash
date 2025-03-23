import { Injectable } from '@angular/core';
import { Account } from '../models/account.model';
import { GlobalEvents } from '../utils/global-events';
import db from './database.service';
import { GlobalEventService } from './global-event.service';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  constructor(private globalEventService: GlobalEventService) {}

  async addAccount(account: Account) {
    await db.accounts.add(account);
    this.globalEventService.emitEvent(GlobalEvents.REFRESH_ACCOUNTS);
  }

  async getAccounts(): Promise<Account[]> {
    return await db.accounts.toArray();
  }

  /**
   *
   * @returns All active accounts
   */
  async getActiveAccounts(): Promise<Account[]> {
    const accounts = await db.accounts.toArray();
    return accounts.filter((account) => account.isActive);
  }

  async getAccount(id: number): Promise<Account> {
    const account = await db.accounts.get(id);

    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  }

  async updateAccount(account: Account) {
    await db.accounts.update(account.id!, account);
    this.globalEventService.emitEvent(GlobalEvents.REFRESH_ACCOUNTS);
  }

  async deleteAccount(id: number) {
    await db.accounts.delete(id);
    this.globalEventService.emitEvent(GlobalEvents.REFRESH_ACCOUNTS);
  }
}
