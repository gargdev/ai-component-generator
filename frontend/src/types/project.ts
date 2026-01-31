// export interface Project {
//   id: string
//   name: string
//   description?: string
//   sourceUrl: string
//   thumbnail?: string
//   status: 'pending' | 'scraping' | 'ready' | 'error'
//   createdAt: Date | string
//   updatedAt: Date | string
//   userId: string
//   components?: Component[]
//   scrapeData?: ScrapeData
// }

// export interface CreateProjectInput {
//   name: string
//   description?: string
//   sourceUrl: string
// }

// export interface UpdateProjectInput {
//   name?: string
//   description?: string
//   status?: Project['status']
// }

// Add these imports (assuming you created these files earlier)
import { Component } from './component';
import { ScrapeData } from './scrape';

export interface Project {
  id: string;
  name: string;
  description?: string;
  sourceUrl: string;
  thumbnail?: string;
  status: 'pending' | 'scraping' | 'ready' | 'error';
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
  components?: Component[]; // Now TypeScript knows what this is
  scrapeData?: ScrapeData;   // Now TypeScript knows what this is
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  sourceUrl: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: Project['status'];
}