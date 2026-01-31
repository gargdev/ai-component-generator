// Scraper Types
export interface ScrapeRequest {
  url: string;
  waitForSelector?: string;
  timeout?: number;
  userAgent?: string;
}

export interface ScrapeResult {
  success: boolean;
  url: string;
  html: string;
  css: string;
  metadata: PageMetadata;
  sections?: DetectedSection[];
  error?: string;
}

export interface PageMetadata {
  title: string;
  description?: string;
  favicon?: string;
  ogImage?: string;
  viewport?: string;
  language?: string;
}

export interface DetectedSection {
  id: string;
  type: SectionType;
  html: string;
  css?: string;
  selector: string;
  confidence: number;
  bounds?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export type SectionType =
  | 'hero'
  | 'navbar'
  | 'footer'
  | 'pricing'
  | 'features'
  | 'testimonials'
  | 'cta'
  | 'form'
  | 'gallery'
  | 'other';

// Component Generation Types
export interface GenerateComponentRequest {
  html: string;
  css?: string;
  sectionType?: SectionType;
  componentName?: string;
  requirements?: string;
}

export interface GenerateComponentResponse {
  success: boolean;
  component: {
    name: string;
    code: string;
    preview: string;
    description?: string;
    props?: ComponentProp[];
  };
  error?: string;
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface RefineComponentRequest {
  code: string;
  instruction: string;
  componentName?: string;
}

export interface RefineComponentResponse {
  success: boolean;
  component: {
    code: string;
    preview: string;
    changes?: string;
  };
  error?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}