import { chromium, Browser, Page, BrowserContext } from "playwright";
import logger from "../utils/logger";
import config from "../config";
import { ScraperError } from "../utils/errors";
import { ScrapeRequest, ScrapeResult, PageMetadata } from "../types";

class ScraperService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  /**
   * Initialize browser instance (lazy initialization)
   */
  private async initBrowser(): Promise<void> {
    if (!this.browser) {
      try {
        logger.info("Initializing Playwright browser...");
        this.browser = await chromium.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu",
          ],
        });
        logger.info("Browser initialized successfully");
      } catch (error) {
        logger.error("Failed to initialize browser:", error);
        throw new ScraperError("Failed to initialize browser");
      }
    }
  }

  /**
   * Create a new browser context with proper settings
   */
  private async createContext(): Promise<BrowserContext> {
    await this.initBrowser();

    if (!this.browser) {
      throw new ScraperError("Browser not initialized");
    }

    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true,
    });

    return context;
  }

  /**
   * Validate URL before scraping
   */
  private validateUrl(url: string): void {
    try {
      const urlObj = new URL(url);

      // Check protocol
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        throw new ScraperError("Only HTTP and HTTPS protocols are supported");
      }

      // Block localhost and private IPs in production
      if (config.nodeEnv === "production") {
        const hostname = urlObj.hostname.toLowerCase();
        const privatePatterns = [
          "localhost",
          "127.0.0.1",
          "0.0.0.0",
          "::1",
          "10.",
          "172.16.",
          "192.168.",
        ];

        if (privatePatterns.some((pattern) => hostname.includes(pattern))) {
          throw new ScraperError("Cannot scrape local or private URLs");
        }
      }

      // Block file:// and other dangerous protocols
      const blockedProtocols = ["file:", "ftp:", "data:"];
      if (blockedProtocols.includes(urlObj.protocol)) {
        throw new ScraperError(`Protocol ${urlObj.protocol} is not allowed`);
      }
    } catch (error) {
      if (error instanceof ScraperError) {
        throw error;
      }
      throw new ScraperError("Invalid URL format");
    }
  }

  /**
   * Extract metadata from page
   */
  //   private async extractMetadata(page: Page): Promise<PageMetadata> {
  //     try {
  //       const metadata: PageMetadata = {
  //         title: await page.title(),
  //       };

  //       // Extract meta tags
  //       const metaTags = await page.evaluate(() => {
  //         const getMeta = (name: string): string | undefined => {
  //           const element = document.querySelector(`meta[name="${name}"]`) ||
  //                          document.querySelector(`meta[property="${name}"]`);
  //           return element?.getAttribute('content') || undefined;
  //         };

  //         return {
  //           description: getMeta('description') || getMeta('og:description'),
  //           ogImage: getMeta('og:image'),
  //           favicon: document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href ||
  //                    document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]')?.href,
  //           viewport: getMeta('viewport'),
  //           language: document.documentElement.lang || undefined,
  //         };
  //       });

  //       return { ...metadata, ...metaTags };
  //     } catch (error) {
  //       logger.warn('Failed to extract metadata:', error);
  //       return { title: 'Untitled' };
  //     }
  //   }
  private async extractMetadata(page: Page): Promise<PageMetadata> {
    try {
      const metadata: PageMetadata = {
        title: await page.title(),
      };

      const metaTags = await page.evaluate(() => {
        // ✅ FINAL FIX
        const d = (globalThis as any).document;

        const getMeta = (name: string): string | undefined => {
          const el =
            d.querySelector(`meta[name="${name}"]`) ||
            d.querySelector(`meta[property="${name}"]`);
          return el?.getAttribute("content") || undefined;
        };

        const icon =
          d.querySelector('link[rel="icon"]')?.href ||
          d.querySelector('link[rel="shortcut icon"]')?.href;

        return {
          description: getMeta("description") || getMeta("og:description"),
          ogImage: getMeta("og:image"),
          favicon: icon,
          viewport: getMeta("viewport"),
          language: d.documentElement?.lang || undefined,
        };
      });

      return { ...metadata, ...metaTags };
    } catch (error) {
      logger.warn("Failed to extract metadata:", error);
      return { title: "Untitled" };
    }
  }

  /**
   * Extract inline and linked CSS with optimization
   */

  private async extractCSS(page: Page): Promise<string> {
    try {
      const css = await page.evaluate(() => {
        // ✅ FINAL FIX
        const d = (globalThis as any).document;
        let allCSS = "";

        d.querySelectorAll("style").forEach((s: any) => {
          if (s.textContent) allCSS += s.textContent + "\n";
        });

        d.querySelectorAll('link[rel="stylesheet"]').forEach((l: any) => {
          if (l.href) allCSS += `@import url("${l.href}");\n`;
        });

        return allCSS;
      });

      return css || "";
    } catch (error) {
      logger.warn("Failed to extract CSS:", error);
      return "";
    }
  }

  /**
   * Clean HTML to reduce size and remove unnecessary content
   */
  private cleanHTML(html: string): string {
    // Remove comments
    html = html.replace(/<!--[\s\S]*?-->/g, "");

    // Remove script tags (keep structure, remove content)
    html = html.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "",
    );

    // Remove excessive whitespace
    html = html.replace(/\s+/g, " ");
    html = html.replace(/>\s+</g, "><");

    return html.trim();
  }

  /**
   * Main scraping method with comprehensive error handling
   */
  public async scrapePage(request: ScrapeRequest): Promise<ScrapeResult> {
    const { url, waitForSelector, timeout = config.scraper.timeout } = request;

    logger.info(`Starting scrape for URL: ${url}`);

    // Validate URL
    this.validateUrl(url);

    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      // Create new context
      context = await this.createContext();
      page = await context.newPage();

      // Set timeout
      page.setDefaultTimeout(timeout);

      // Block unnecessary resources to speed up loading
      await page.route("**/*", (route) => {
        const resourceType = route.request().resourceType();
        const blockedTypes = ["font", "media", "websocket"];

        if (blockedTypes.includes(resourceType)) {
          route.abort();
        } else {
          route.continue();
        }
      });

      // Navigate to page
      logger.info(`Navigating to ${url}...`);
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded", // Changed from 'networkidle' to save time
        timeout,
      });

      // Check if page loaded successfully
      if (!response || !response.ok()) {
        throw new ScraperError(
          `Failed to load page: ${response?.status() || "Unknown error"}`,
        );
      }

      // Wait for specific selector if provided
      if (waitForSelector) {
        try {
          await page.waitForSelector(waitForSelector, { timeout: 5000 });
        } catch (error) {
          logger.warn(
            `Selector ${waitForSelector} not found, continuing anyway`,
          );
        }
      }

      // Wait a bit for dynamic content
      await page.waitForTimeout(1000);

      // Extract content
      logger.info("Extracting page content...");
      const [html, css, metadata] = await Promise.all([
        page.content(),
        this.extractCSS(page),
        this.extractMetadata(page),
      ]);

      // Clean HTML
      const cleanedHTML = this.cleanHTML(html);

      // Check size limits
      const htmlSize = Buffer.byteLength(cleanedHTML, "utf8");
      if (htmlSize > config.scraper.maxPageSize) {
        logger.warn(
          `Page size (${htmlSize}) exceeds limit (${config.scraper.maxPageSize})`,
        );
        throw new ScraperError("Page size exceeds maximum allowed limit");
      }

      logger.info(`Scrape completed successfully for ${url}`);
      logger.info(`HTML size: ${(htmlSize / 1024).toFixed(2)} KB`);

      return {
        success: true,
        url,
        html: cleanedHTML,
        css,
        metadata,
      };
    } catch (error) {
      logger.error(`Scrape failed for ${url}:`, error);

      if (error instanceof ScraperError) {
        throw error;
      }

      // Handle specific Playwright errors
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          throw new ScraperError("Page load timeout exceeded");
        }
        if (error.message.includes("net::")) {
          throw new ScraperError("Network error while loading page");
        }
        if (error.message.includes("SSL")) {
          throw new ScraperError("SSL certificate error");
        }
      }

      throw new ScraperError("Failed to scrape page");
    } finally {
      // Cleanup
      if (page) {
        await page.close().catch((e) => logger.warn("Error closing page:", e));
      }
      if (context) {
        await context
          .close()
          .catch((e) => logger.warn("Error closing context:", e));
      }
    }
  }

  /**
   * Take screenshot of the page (optional feature)
   */
  public async takeScreenshot(
    url: string,
    options?: { fullPage?: boolean; selector?: string },
  ): Promise<Buffer> {
    logger.info(`Taking screenshot of ${url}`);

    this.validateUrl(url);

    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      context = await this.createContext();
      page = await context.newPage();

      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: config.scraper.timeout,
      });

      await page.waitForTimeout(1000);

      let screenshot: Buffer;

      if (options?.selector) {
        const element = await page.$(options.selector);
        if (!element) {
          throw new ScraperError(`Selector ${options.selector} not found`);
        }
        screenshot = await element.screenshot();
      } else {
        screenshot = await page.screenshot({
          fullPage: options?.fullPage || false,
        });
      }

      logger.info("Screenshot captured successfully");
      return screenshot;
    } catch (error) {
      logger.error("Screenshot failed:", error);
      throw new ScraperError("Failed to capture screenshot");
    } finally {
      if (page) await page.close().catch(() => {});
      if (context) await context.close().catch(() => {});
    }
  }

  /**
   * Cleanup browser instance
   */
  public async cleanup(): Promise<void> {
    if (this.browser) {
      logger.info("Closing browser...");
      await this.browser.close();
      this.browser = null;
      logger.info("Browser closed");
    }
  }
}

// Export singleton instance
export default new ScraperService();
