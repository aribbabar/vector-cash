import { Injectable } from '@angular/core';
import { Entry } from '../models/entry.model';
import db from './database.service';

@Injectable({
  providedIn: 'root'
})
export class EntryService {
  async addEntry(entry: Entry) {
    return await db.entries.add(entry);
  }

  async getEntries(): Promise<Entry[]> {
    return await db.entries.toArray();
  }

  async getTotalEntries(): Promise<number> {
    return await db.entries.count();
  }

  async getPaginatedEntries(offset: number, limit: number): Promise<Entry[]> {
    return await db.entries
      .orderBy('date')
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  }

  async deleteEntry(id: number) {
    return await db.entries.delete(id);
  }
}
