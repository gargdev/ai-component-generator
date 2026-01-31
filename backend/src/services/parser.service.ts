import * as cheerio from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import logger from '../utils/logger';
import { ValidationError } from '../utils/errors';

type CheerioRoot = ReturnType<typeof cheerio.load>;

interface ParsedElement {
  tag: string;
  classes: string[];
  id?: string;
  text?: string;
  html: string;
  children: number;
  attributes: Record<string, string>;
}

class ParserService {
  /**
   * Parse HTML safely
   */
  public parseHTML(html: string): CheerioRoot {
    try {
      return cheerio.load(html);
    } catch (error) {
      logger.error('Failed to parse HTML:', error);
      throw new ValidationError('Invalid HTML content');
    }
  }

  /**
   * Extract main semantic sections
   */
  public extractMainSections(html: string): ParsedElement[] {
    const $ = this.parseHTML(html);
    const sections: ParsedElement[] = [];

    const semanticTags = [
      'header',
      'nav',
      'main',
      'section',
      'article',
      'aside',
      'footer',
    ];

    semanticTags.forEach((tag) => {
      $(tag).each((_, element) => {
        const $el = $(element);
        const parents = $el.parentsUntil('body', semanticTags.join(','));
        if (parents.length > 0) return;
        sections.push(this.parseElement($, element));
      });
    });

    if (sections.length === 0) {
      const fallbackClasses = [
        'hero',
        'banner',
        'header',
        'navbar',
        'content',
        'main',
        'pricing',
        'features',
        'testimonials',
        'footer',
        'cta',
      ];

      fallbackClasses.forEach((cls) => {
        $(`[class*="${cls}"]`).each((_, element) => {
          const $el = $(element);
          if ($el.parents(`[class*="${cls}"]`).length === 0) {
            sections.push(this.parseElement($, element));
          }
        });
      });
    }

    logger.info(`Extracted ${sections.length} main sections`);
    return sections;
  }

  /**
   * Parse a single element
   */
  private parseElement(
  $: CheerioRoot,
  node: AnyNode
): ParsedElement | null {
  if (node.type !== 'tag') return null;

  const element = node as Element;
  const $el = $(element);

  return {
    tag: element.tagName,
    classes: ($el.attr('class') || '').split(' ').filter(Boolean),
    id: $el.attr('id'),
    text: $el.text().trim().slice(0, 200),
    html: $.html(element) || '',
    children: $el.children().length,
    attributes: this.getAttributes(element),
  };
}


  /**
   * Safely extract attributes
   */
  private getAttributes(element: Element): Record<string, string> {
    const attrs: Record<string, string> = {};

    if (element.type === 'tag' && element.attribs) {
      for (const [key, value] of Object.entries(element.attribs)) {
        if (typeof value === 'string' && value.length < 500) {
          attrs[key] = value;
        }
      }
    }

    return attrs;
  }

  /**
   * Extract section HTML by selector
   */
  public extractSection(html: string, selector: string): string | null {
    try {
      const $ = this.parseHTML(html);
      const el = $(selector).first();
      return el.length ? $.html(el) : null;
    } catch (error) {
      logger.error('Failed to extract section:', error);
      return null;
    }
  }

  /**
   * Minify HTML for AI processing
   */
  public minifyHTML(html: string): string {
    const $ = this.parseHTML(html);

    $('script, style').remove();

    $('*')
      .contents()
      .filter((_, el) => el.type === 'comment')
      .remove();

    $('*').each((_, el) => {
      if (el.type === 'tag' && el.attribs) {
        Object.keys(el.attribs).forEach((attr) => {
          if (attr.startsWith('data-') || attr.startsWith('aria-')) {
            $(el).removeAttr(attr);
          }
        });
      }
    });

    let cleaned = $.html() || '';
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/>\s+</g, '><');

    return cleaned.trim();
  }

  /**
   * Filter CSS to only used selectors
   */
  public extractRelevantCSS(html: string, css: string): string {
    const $ = this.parseHTML(html);
    const usedClasses = new Set<string>();
    const usedIds = new Set<string>();

    $('*').each((_, el) => {
      const $el = $(el);

      ($el.attr('class') || '')
        .split(' ')
        .filter(Boolean)
        .forEach((c) => usedClasses.add(c));

      const id = $el.attr('id');
      if (id) usedIds.add(id);
    });

    const result: string[] = [];
    let include = false;

    css.split('\n').forEach((line) => {
      if (line.includes('{')) {
        include = false;
        usedClasses.forEach((c) => line.includes(`.${c}`) && (include = true));
        usedIds.forEach((i) => line.includes(`#${i}`) && (include = true));
      }

      if (include) {
        result.push(line);
        if (line.includes('}')) include = false;
      }
    });

    return result.join('\n');
  }

  /**
   * Element metadata
   */
  public getElementInfo(html: string, selector: string) {
    const $ = this.parseHTML(html);
    const el = $(selector);

    if (!el.length) return null;

    const node = el.get(0);

    return {
      exists: true,
      tag: node?.type === 'tag' ? node.tagName : undefined,
      classes: (el.attr('class') || '').split(' ').filter(Boolean),
      id: el.attr('id'),
      children: el.children().length,
      textLength: el.text().length,
      hasImages: el.find('img').length > 0,
      hasLinks: el.find('a').length > 0,
    };
  }
}

export default new ParserService();
