import Dexie, { Table } from 'dexie';

export interface MindMapRecord {
  id?: number;
  url: string;
  markdown: string;
  createdAt: Date;
}

export class AppDatabase extends Dexie {
  mindMaps!: Table<MindMapRecord>;

  constructor() {
    super('mindMapDB');
    this.version(1).stores({
      mindMaps: '++id, url, createdAt'
    });
  }
}

export const db = new AppDatabase();
