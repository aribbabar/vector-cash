import { Injectable } from '@angular/core';
import { Entry } from '../models/entry.model';
import { GlobalEvents } from '../utils/global-events';
import db from './database.service';
import { GlobalEventService } from './global-event.service';

@Injectable({
  providedIn: 'root'
})
export class EntryService {
  constructor(private globalEventService: GlobalEventService) {}

  async addEntry(entry: Entry) {
    this.globalEventService.emitEvent(GlobalEvents.REFRESH_ENTRIES);
    await db.entries.add(entry);
  }

  async getEntries(): Promise<Entry[]> {
    return await db.entries.toArray();
  }

  async getEntriesTotal(): Promise<number> {
    return await db.entries.count();
  }

  async getEntryByAccountAndDate(
    accountId: number,
    date: string
  ): Promise<Entry | null> {
    try {
      const entries = await this.getEntries();
      return (
        entries.find(
          (entry) => entry.accountId === accountId && entry.date === date
        ) || null
      );
    } catch (error) {
      console.error('Error fetching entry:', error);
      throw error;
    }
  }

  /**
   * Returns the account balance for the entry on the latest date
   * @param accountId
   * @returns
   */
  async getAccountBalance(accountId: number): Promise<number> {
    const entries = await this.getEntries();
    const latestEntry = entries
      .filter((entry) => entry.accountId === accountId)
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];

    return latestEntry ? latestEntry.balance : 0;
  }

  /**
   *
   * @param date MM/DD/YYYY
   * @returns
   */
  async entryExists(date: string): Promise<boolean> {
    return (await db.entries.where('date').equals(date).count()) > 0;
  }

  async updateEntry(entry: Entry) {
    if (!entry.id) {
      throw new Error('Cannot update an entry without an ID');
    }

    await db.entries.update(entry.id, entry);
    this.globalEventService.emitEvent(GlobalEvents.REFRESH_ENTRIES);
  }

  async deleteEntry(id: number) {
    await db.entries.delete(id);
    this.globalEventService.emitEvent(GlobalEvents.REFRESH_ENTRIES);
  }

  /**
   *
   * @param date MM/DD/YYYY
   */
  async deleteEntries(date: string) {
    await db.entries.where('date').equals(date).delete();
    this.globalEventService.emitEvent(GlobalEvents.REFRESH_ENTRIES);
  }
}
