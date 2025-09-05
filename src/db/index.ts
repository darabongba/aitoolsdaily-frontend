import Dexie, { Table } from 'dexie';

export interface MindMapRecord {
  id?: number;
  url: string;
  markdown: string;
  createdAt: Date;
}

export interface GenImageRecord {
  id: string;
  originalImage: string;
  resultImages: string[];
  markdown: string;
  timestamp: number;
  title?: string;
  createdAt: Date;
}

export class AppDatabase extends Dexie {
  mindMaps!: Table<MindMapRecord>;
  genImages!: Table<GenImageRecord>;

  constructor() {
    super('AppDB');
    this.version(1).stores({
      mindMaps: '++id, url, createdAt'
    });
    
    // 版本2: 添加GenImage表
    this.version(2).stores({
      mindMaps: '++id, url, createdAt',
      genImages: 'id, timestamp, createdAt, title'
    });
  }
}

export const db = new AppDatabase();
