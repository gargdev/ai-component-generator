import { DetectedSection, SectionType } from "../types";
import logger from "../utils/logger";
import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";

interface SectionPattern {
  type: SectionType;
  selectors: string[];
  keywords: string[];
  classPatterns: RegExp[];
  minHeight?: number;
  minChildren?: number;
}

class SectionDetectorService {
  private sectionPatterns: SectionPattern[] = [
    {
      type: "hero",
      selectors: ["header:first-of-type", '[class*="hero"]', '[id*="hero"]'],
      keywords: ["hero", "banner", "jumbotron", "splash", "intro"],
      classPatterns: [/hero/i, /banner/i, /jumbotron/i, /splash/i],
      minHeight: 300,
    },
    {
      type: "navbar",
      selectors: ["nav", "header nav", '[role="navigation"]'],
      keywords: ["nav", "navigation", "menu", "header"],
      classPatterns: [/nav/i, /menu/i, /header/i],
      minChildren: 2,
    },
    {
      type: "footer",
      selectors: ["footer", '[class*="footer"]', '[id*="footer"]'],
      keywords: ["footer", "bottom", "copyright"],
      classPatterns: [/footer/i, /bottom/i],
    },
    {
      type: "pricing",
      selectors: ['[class*="pricing"]', '[id*="pricing"]', '[class*="plan"]'],
      keywords: ["pricing", "plan", "subscription", "package", "tier"],
      classPatterns: [/pricing/i, /plan/i, /subscription/i, /package/i],
      minChildren: 2,
    },
    {
      type: "features",
      selectors: ['[class*="feature"]', '[id*="feature"]'],
      keywords: ["feature", "benefit", "service", "offering"],
      classPatterns: [/feature/i, /benefit/i, /service/i],
      minChildren: 3,
    },
    {
      type: "testimonials",
      selectors: ['[class*="testimonial"]', '[class*="review"]'],
      keywords: ["testimonial", "review", "feedback", "customer", "client"],
      classPatterns: [/testimonial/i, /review/i, /feedback/i],
      minChildren: 1,
    },
    {
      type: "cta",
      selectors: ['[class*="cta"]', '[class*="call-to-action"]'],
      keywords: ["cta", "call-to-action", "signup", "get-started"],
      classPatterns: [
        /cta/i,
        /call[-_]to[-_]action/i,
        /signup/i,
        /get[-_]started/i,
      ],
    },
    {
      type: "form",
      selectors: ["form", '[class*="form"]'],
      keywords: ["form", "contact", "subscribe", "newsletter"],
      classPatterns: [/form/i, /contact/i, /subscribe/i],
    },
    {
      type: "gallery",
      selectors: ['[class*="gallery"]', '[class*="portfolio"]'],
      keywords: ["gallery", "portfolio", "showcase", "works"],
      classPatterns: [/gallery/i, /portfolio/i, /showcase/i],
    },
  ];

  public detectSections(html: string): DetectedSection[] {
    const $ = cheerio.load(html);
    const detected: DetectedSection[] = [];
    const processed = new Set<string>();

    this.sectionPatterns.forEach((pattern) => {
      detected.push(...this.findSectionsByPattern($, pattern, processed));
    });

    return detected;
  }

  private findSectionsByPattern(
    $: cheerio.CheerioAPI,
    pattern: SectionPattern,
    processed: Set<string>,
  ): DetectedSection[] {
    const sections: DetectedSection[] = [];

    pattern.selectors.forEach((selector) => {
      $(selector).each((_, node) => {
        const id = this.getElementIdentifier($, node);
        if (processed.has(id)) return;

        const confidence = this.calculateConfidence($, node, pattern);
        if (confidence <= 0.3) return;

        sections.push({
          id: `${pattern.type}-${sections.length}`,
          type: pattern.type,
          html: $.html(node) ?? "",
          selector,
          confidence,
        });

        processed.add(id);
      });
    });

    return sections;
  }

  private calculateConfidence(
    $: cheerio.CheerioAPI,
    node: AnyNode,
    pattern: SectionPattern,
  ): number {
    if (node.type !== "tag") return 0;

    let score = 0;
    const element = node as Element;
    const $el = $(element);

    const classNames = ($el.attr("class") || "").toLowerCase();
    pattern.classPatterns.forEach((r) => {
      if (r.test(classNames)) score += 0.4;
    });

    const id = ($el.attr("id") || "").toLowerCase();
    if (pattern.keywords.some((k) => id.includes(k))) score += 0.3;

    const text = $el.text().toLowerCase();
    score += Math.min(
      pattern.keywords.filter((k) => text.includes(k)).length * 0.1,
      0.3,
    );

    if (pattern.minChildren && $el.children().length >= pattern.minChildren) {
      score += 0.2;
    }

    if ($el.text().trim().length > 50) score += 0.1;

    if (
      element.name === pattern.type ||
      element.name === "section" ||
      element.name === "article"
    ) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  private getElementIdentifier($: cheerio.CheerioAPI, node: AnyNode): string {
    if (node.type !== "tag") return `non-tag-${Math.random()}`;

    const el = node as Element;
    const $el = $(el);

    return `${el.name}-${$el.attr("id") || "no-id"}-${
      $el.attr("class") || "no-class"
    }-${$el.index()}`;
  }

  public optimizeSectionForAI(html: string): string {
    const $ = cheerio.load(html);

    $("*").each((_, node) => {
      if (node.type !== "tag") return;

      const el = node as Element;
      const $el = $(el);
      const keep = ["class", "id", "href", "src", "alt", "type", "placeholder"];

      Object.keys(el.attribs || {}).forEach((attr) => {
        if (!keep.includes(attr)) $el.removeAttr(attr);
      });
    });

    $("*").each((_, el) => {
      const $el = $(el);
      if (!$el.children().length && !$el.text().trim()) $el.remove();
    });

    return $.html()?.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim() || "";
  }

  public isValidSection(section: DetectedSection): boolean {
    const $ = cheerio.load(section.html);
    return $.text().trim().length > 20 && $("*").length > 3;
  }

  /** Used in /api/scrape */
  public getSectionSummary(section: DetectedSection): string {
    const $ = cheerio.load(section.html);
    return $.text().replace(/\s+/g, " ").trim().slice(0, 160);
  }

  /** Used in /api/scrape/section */
  public extractSectionByType(
    html: string,
    type: SectionType,
  ): DetectedSection | null {
    const sections = this.detectSections(html);
    return sections.find((s) => s.type === type) || null;
  }
}

export default new SectionDetectorService();
