import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { scraperLimiter } from '../middleware/rate-limit.middleware';
import scraperService from '../services/scraper.service';
import parserService from '../services/parser.service';
import sectionDetectorService from '../services/section-detector.service';
import storageService from '../services/storage.service';
import { validate, scrapeRequestSchema } from '../utils/validators';
import { ScrapeRequest } from '../types';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/scrape
 * Scrape a website and return structured data
 */
router.post(
  '/',
  scraperLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Received scrape request');

    // Validate request
    const validatedData = validate<ScrapeRequest>(scrapeRequestSchema, req.body);

    // Scrape the page
    const scrapeResult = await scraperService.scrapePage(validatedData);

    if (!scrapeResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: scrapeResult.error || 'Scraping failed',
          code: 'SCRAPE_FAILED',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Detect sections
    const sections = sectionDetectorService.detectSections(scrapeResult.html);

    // Filter valid sections
    const validSections = sections.filter((section) =>
      sectionDetectorService.isValidSection(section)
    );

    // Optimize sections for response (reduce size)
    const optimizedSections = validSections.map((section) => ({
      id: section.id,
      type: section.type,
      selector: section.selector,
      confidence: section.confidence,
      summary: sectionDetectorService.getSectionSummary(section),
      // Don't send full HTML yet - only on request
    }));

    logger.info(`Scrape completed: ${validSections.length} sections detected`);

    res.json({
      success: true,
      data: {
        url: scrapeResult.url,
        metadata: scrapeResult.metadata,
        sections: optimizedSections,
        totalSections: validSections.length,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/scrape/screenshot
 * Take a screenshot of a URL
 */
router.post(
  '/screenshot',
  scraperLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { url, fullPage = false, selector } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'URL is required',
          code: 'VALIDATION_ERROR',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Take screenshot
    const screenshot = await scraperService.takeScreenshot(url, {
      fullPage,
      selector,
    });

    // Save screenshot
    const timestamp = Date.now();
    const filename = `screenshot-${timestamp}.jpg`;
    const fileInfo = await storageService.saveScreenshot(screenshot, filename);

    res.json({
      success: true,
      data: {
        filename: fileInfo.filename,
        path: fileInfo.path,
        size: fileInfo.size,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/scrape/section
 * Get full HTML for a specific section
 */
router.post(
  '/section',
  asyncHandler(async (req: Request, res: Response) => {
    const { url, sectionType, selector } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'URL is required',
          code: 'VALIDATION_ERROR',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Scrape the page
    const scrapeResult = await scraperService.scrapePage({ url });

    if (!scrapeResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: scrapeResult.error || 'Scraping failed',
          code: 'SCRAPE_FAILED',
        },
        timestamp: new Date().toISOString(),
      });
    }

    let sectionHtml: string | null = null;

    if (selector) {
      // Extract by selector
      sectionHtml = parserService.extractSection(scrapeResult.html, selector);
    } else if (sectionType) {
      // Extract by type
      const section = sectionDetectorService.extractSectionByType(
        scrapeResult.html,
        sectionType
      );
      sectionHtml = section ? section.html : null;
    }

    if (!sectionHtml) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Section not found',
          code: 'SECTION_NOT_FOUND',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Optimize for AI
    const optimized = sectionDetectorService.optimizeSectionForAI(sectionHtml);

    // Extract relevant CSS
    const relevantCSS = parserService.extractRelevantCSS(optimized, scrapeResult.css);

    res.json({
      success: true,
      data: {
        html: optimized,
        css: relevantCSS,
        originalSize: sectionHtml.length,
        optimizedSize: optimized.length,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;