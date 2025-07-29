import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

interface DocumentationSource {
  name: string;
  baseUrl: string;
  type: 'wcag' | 'aria' | 'mdn' | 'apg';
}

interface CachedDocument {
  url: string;
  content: string;
  timestamp: number;
  type: string;
}

export class DocumentationFetcher {
  private cacheDir: string;
  private cacheTTL: number; // in milliseconds
  
  constructor(cacheDir: string = './cache', cacheTTL: number = 7 * 24 * 60 * 60 * 1000) {
    this.cacheDir = cacheDir;
    this.cacheTTL = cacheTTL;
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  private getCacheKey(url: string): string {
    return crypto.createHash('md5').update(url).digest('hex');
  }

  private async getCachedDocument(url: string): Promise<CachedDocument | null> {
    try {
      const cacheKey = this.getCacheKey(url);
      const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);
      const data = await fs.readFile(cachePath, 'utf-8');
      const cached = JSON.parse(data) as CachedDocument;
      
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached;
      }
    } catch {
      // Cache miss or error
    }
    return null;
  }

  private async cacheDocument(url: string, content: string, type: string): Promise<void> {
    const cacheKey = this.getCacheKey(url);
    const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);
    const cached: CachedDocument = {
      url,
      content,
      timestamp: Date.now(),
      type
    };
    await fs.writeFile(cachePath, JSON.stringify(cached));
  }

  async fetchDocument(url: string, type: string): Promise<string> {
    // Check cache first
    const cached = await this.getCachedDocument(url);
    if (cached) {
      return cached.content;
    }

    // Fetch from web
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract main content based on common patterns
      let content = '';
      
      // Try different content selectors based on the source
      const contentSelectors = [
        'main',
        '[role="main"]',
        '#main-content',
        '.main-content',
        'article',
        '.content'
      ];
      
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text();
          break;
        }
      }
      
      if (!content) {
        // Fallback to body content
        content = $('body').text();
      }
      
      // Clean up content
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      // Cache the content
      await this.cacheDocument(url, content, type);
      
      return content;
    } catch (error) {
      throw new Error(`Failed to fetch document from ${url}: ${error}`);
    }
  }

  async fetchWCAGGuidelines(): Promise<Map<string, string>> {
    const guidelines = new Map<string, string>();
    
    // Key WCAG documentation pages
    const wcagUrls = [
      'https://www.w3.org/WAI/WCAG21/quickref/',
      'https://www.w3.org/WAI/WCAG21/Understanding/',
      'https://www.w3.org/WAI/WCAG21/Techniques/'
    ];
    
    for (const url of wcagUrls) {
      try {
        const content = await this.fetchDocument(url, 'wcag');
        const key = url.split('/').pop() || 'wcag';
        guidelines.set(key, content);
      } catch (error) {
        console.error(`Failed to fetch WCAG content from ${url}:`, error);
      }
    }
    
    return guidelines;
  }

  async fetchARIADocumentation(): Promise<Map<string, string>> {
    const ariaDocs = new Map<string, string>();
    
    // Key ARIA documentation
    const ariaUrls = [
      'https://www.w3.org/TR/wai-aria/',
      'https://www.w3.org/TR/wai-aria-practices-1.2/',
      'https://www.w3.org/WAI/ARIA/apg/patterns/'
    ];
    
    for (const url of ariaUrls) {
      try {
        const content = await this.fetchDocument(url, 'aria');
        const key = url.split('/').slice(-2).join('-') || 'aria';
        ariaDocs.set(key, content);
      } catch (error) {
        console.error(`Failed to fetch ARIA content from ${url}:`, error);
      }
    }
    
    return ariaDocs;
  }

  async fetchMDNAccessibilityGuides(): Promise<Map<string, string>> {
    const mdnGuides = new Map<string, string>();
    
    // Key MDN accessibility guides
    const mdnUrls = [
      'https://developer.mozilla.org/en-US/docs/Web/Accessibility',
      'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA',
      'https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_WCAG'
    ];
    
    for (const url of mdnUrls) {
      try {
        const content = await this.fetchDocument(url, 'mdn');
        const key = url.split('/').pop() || 'mdn';
        mdnGuides.set(key, content);
      } catch (error) {
        console.error(`Failed to fetch MDN content from ${url}:`, error);
      }
    }
    
    return mdnGuides;
  }

  async fetchAllDocumentation(): Promise<{
    wcag: Map<string, string>;
    aria: Map<string, string>;
    mdn: Map<string, string>;
  }> {
    const [wcag, aria, mdn] = await Promise.all([
      this.fetchWCAGGuidelines(),
      this.fetchARIADocumentation(),
      this.fetchMDNAccessibilityGuides()
    ]);
    
    return { wcag, aria, mdn };
  }
} 