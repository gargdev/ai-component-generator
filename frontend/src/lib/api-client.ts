import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: BACKEND_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available (we'll implement this later)
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Handle errors globally
        if (error.response) {
          console.error('API Error:', error.response.data)
        } else if (error.request) {
          console.error('Network Error:', error.message)
        }
        return Promise.reject(error)
      }
    )
  }

  // Generic request method
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config)
    return response.data
  }

  // GET request
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url })
  }

  // POST request - Replaced 'any' with 'unknown'
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data })
  }

  // PUT request - Replaced 'any' with 'unknown'
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data })
  }

  // DELETE request
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url })
  }

  // Scraping endpoints
  async scrapeWebsite(url: string, options?: { waitForSelector?: string; timeout?: number }) {
    return this.post('/api/scrape', { url, ...options })
  }

  async getSectionData(url: string, sectionType: string) {
    return this.post('/api/scrape/section', { url, sectionType })
  }

  async takeScreenshot(url: string, options?: { fullPage?: boolean; selector?: string }) {
    return this.post('/api/scrape/screenshot', { url, ...options })
  }

  // AI generation endpoints
  async generateComponent(data: {
    html: string
    css?: string
    sectionType?: string
    componentName?: string
    requirements?: string
  }) {
    return this.post('/api/analyze/generate', data)
  }

  async refineComponent(data: {
    code: string
    instruction: string
    componentName?: string
  }) {
    return this.post('/api/analyze/refine', data)
  }

  async detectSections(html: string) {
    return this.post('/api/analyze/detect-sections', { html })
  }

  // Health check
  async healthCheck() {
    return this.get('/api/health')
  }
}

export const apiClient = new ApiClient()
export default apiClient