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

  async getEntriesTotal(): Promise<number> {
    return await db.entries.count();
  }

  async deleteEntry(id: number) {
    return await db.entries.delete(id);
  }
}
