export interface ScrapeData {
  id: string
  projectId: string
  html: string
  css?: string
  metadata?: PageMetadata
  sections?: DetectedSection[]
  createdAt: Date | string
}

export interface PageMetadata {
  title: string
  description?: string
  favicon?: string
  ogImage?: string
  viewport?: string
  language?: string
}

export interface DetectedSection {
  id: string
  type: SectionType
  html: string
  css?: string
  selector: string
  confidence: number
  bounds?: {
    top: number
    left: number
    width: number
    height: number
  }
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
  | 'other'

export interface ScrapeRequest {
  url: string
  waitForSelector?: string
  timeout?: number
}

export interface ScrapeResponse {
  success: boolean
  data: {
    url: string
    metadata: PageMetadata
    sections: DetectedSection[]
    totalSections: number
  }
}