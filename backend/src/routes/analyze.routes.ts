import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { aiLimiter } from '../middleware/rate-limit.middleware';
import aiService from '../services/ai.service';
import sectionDetectorService from '../services/section-detector.service';
import parserService from '../services/parser.service';
import storageService from '../services/storage.service';
import {
  validate,
  generateComponentSchema,
  refineComponentSchema,
} from '../utils/validators';
import {
  GenerateComponentRequest,
  RefineComponentRequest,
} from '../types';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/analyze/generate
 * Generate React component from HTML/CSS
 */
router.post(
  '/generate',
  aiLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Received component generation request');

    // Validate request
    const validatedData = validate<GenerateComponentRequest>(
      generateComponentSchema,
      req.body
    );

    // Optimize HTML for AI processing
    const optimizedHtml = parserService.minifyHTML(validatedData.html);

    // Extract relevant CSS if provided
    let optimizedCss = validatedData.css;
    if (optimizedCss) {
      optimizedCss = parserService.extractRelevantCSS(optimizedHtml, optimizedCss);
    }

    // Estimate tokens
    const estimatedTokens = aiService.estimateTokens(
      optimizedHtml + (optimizedCss || '')
    );
    logger.info(`Estimated tokens: ${estimatedTokens}`);

    if (estimatedTokens > 30000) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Content too large. Please select a smaller section.',
          code: 'CONTENT_TOO_LARGE',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Generate component
    const result = await aiService.generateComponent({
      ...validatedData,
      html: optimizedHtml,
      css: optimizedCss,
    });

    // Save generated component
    const componentFile = await storageService.saveComponentExport(
      result.component.code,
      result.component.name
    );

    res.json({
      success: true,
      data: {
        component: result.component,
        file: {
          filename: componentFile.filename,
          path: componentFile.path,
        },
        estimatedTokens,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/analyze/refine
 * Refine existing component based on instructions
 */
router.post(
  '/refine',
  aiLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Received component refinement request');

    // Validate request
    const validatedData = validate<RefineComponentRequest>(
      refineComponentSchema,
      req.body
    );

    // Estimate tokens
    const estimatedTokens = aiService.estimateTokens(
      validatedData.code + validatedData.instruction
    );
    logger.info(`Estimated tokens: ${estimatedTokens}`);

    // Refine component
    const result = await aiService.refineComponent(validatedData);

    // Save refined component
    const componentName = validatedData.componentName || 'RefinedComponent';
    const componentFile = await storageService.saveComponentExport(
      result.component.code,
      componentName
    );

    res.json({
      success: true,
      data: {
        component: result.component,
        file: {
          filename: componentFile.filename,
          path: componentFile.path,
        },
        estimatedTokens,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/analyze/detect-sections
 * Analyze HTML and detect sections without full scraping
 */
router.post(
  '/detect-sections',
  asyncHandler(async (req: Request, res: Response) => {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'HTML is required',
          code: 'VALIDATION_ERROR',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Detect sections
    const sections = sectionDetectorService.detectSections(html);

    // Filter valid sections
    const validSections = sections.filter((section) =>
      sectionDetectorService.isValidSection(section)
    );

    res.json({
      success: true,
      data: {
        sections: validSections.map((s) => ({
          id: s.id,
          type: s.type,
          confidence: s.confidence,
          selector: s.selector,
        })),
        totalSections: validSections.length,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

router.post(
  '/generate-mock',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Received MOCK component generation request');

    const { html, componentName = 'MockComponent' } = req.body;

    if (!html) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'HTML is required',
          code: 'VALIDATION_ERROR',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Create a mock component
    const mockCode = `import React from 'react';

interface ${componentName}Props {
  title?: string;
  description?: string;
}

export default function ${componentName}({ 
  title = "Default Title", 
  description = "Default Description" 
}: ${componentName}Props) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-lg text-gray-600">{description}</p>
    </div>
  );
}`;

    // Save mock component
    const componentFile = await storageService.saveComponentExport(
      mockCode,
      componentName
    );

    res.json({
      success: true,
      data: {
        component: {
          name: componentName,
          code: mockCode,
          preview: '<div>Mock Preview</div>',
          description: 'Mock component generated for testing',
        },
        file: {
          filename: componentFile.filename,
          path: componentFile.path,
        },
        mode: 'MOCK (AI disabled)',
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;