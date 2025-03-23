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

  async updateEntry(entry: Entry) {
    if (!entry.id) {
      throw new Error('Cannot update an entry without an ID');
    }

    await db.entries.update(entry.id, entry);
    this.globalEventService.emitEvent(GlobalEvents.REFRESH_ENTRIES);
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
   *
   * @param date MM/DD/YYYY
   * @returns
   */
  async entryExists(date: string): Promise<boolean> {
    return (await db.entries.where('date').equals(date).count()) > 0;
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
