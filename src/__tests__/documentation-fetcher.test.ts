import { DocumentationFetcher } from '../documentation-fetcher.js';
import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Mock dependencies
jest.mock('node-fetch');
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn()
  }
}));

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe('DocumentationFetcher', () => {
  let fetcher: DocumentationFetcher;
  const testCacheDir = './test-cache';

  beforeEach(() => {
    fetcher = new DocumentationFetcher(testCacheDir, 1000); // 1 second TTL for tests
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should create cache directory', async () => {
      await fetcher.initialize();
      expect(mockFs.mkdir).toHaveBeenCalledWith(testCacheDir, { recursive: true });
    });
  });

  describe('fetchDocument', () => {
    const testUrl = 'https://example.com/test';
    const testContent = '<html><body><main>Test content</main></body></html>';
    const testType = 'wcag';

    it('should fetch and cache document when not in cache', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      mockFetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(testContent)
      } as any);

      const result = await fetcher.fetchDocument(testUrl, testType);

      expect(mockFetch).toHaveBeenCalledWith(testUrl);
      expect(result).toContain('Test content');
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should return cached document when valid', async () => {
      const cachedData = {
        url: testUrl,
        content: 'Cached content',
        timestamp: Date.now() - 500, // 500ms ago
        type: testType
      };
      mockFs.readFile.mockResolvedValue(JSON.stringify(cachedData));

      const result = await fetcher.fetchDocument(testUrl, testType);

      expect(result).toBe('Cached content');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should refetch when cache is expired', async () => {
      const cachedData = {
        url: testUrl,
        content: 'Old cached content',
        timestamp: Date.now() - 2000, // 2 seconds ago (expired)
        type: testType
      };
      mockFs.readFile.mockResolvedValue(JSON.stringify(cachedData));
      mockFetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(testContent)
      } as any);

      const result = await fetcher.fetchDocument(testUrl, testType);

      expect(mockFetch).toHaveBeenCalledWith(testUrl);
      expect(result).toContain('Test content');
    });

    it('should throw error when fetch fails', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
      } as any);

      await expect(fetcher.fetchDocument(testUrl, testType))
        .rejects.toThrow('Failed to fetch https://example.com/test: Not Found');
    });

    it('should extract content from various selectors', async () => {
      const htmlVariants = [
        '<html><body><article>Article content</article></body></html>',
        '<html><body><div class="main-content">Main content</div></body></html>',
        '<html><body><div id="main-content">ID content</div></body></html>',
        '<html><body><div role="main">ARIA main</div></body></html>'
      ];

      for (const html of htmlVariants) {
        mockFs.readFile.mockRejectedValue(new Error('File not found'));
        mockFetch.mockResolvedValue({
          ok: true,
          text: jest.fn().mockResolvedValue(html)
        } as any);

        const result = await fetcher.fetchDocument(testUrl, testType);
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(0);
      }
    });
  });

  describe('fetchWCAGGuidelines', () => {
    it('should fetch multiple WCAG URLs', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      mockFetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('<html><body>WCAG content</body></html>')
      } as any);

      const guidelines = await fetcher.fetchWCAGGuidelines();

      expect(guidelines).toBeInstanceOf(Map);
      expect(guidelines.size).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalledTimes(3); // Three WCAG URLs
    });

    it('should handle partial failures gracefully', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue('<html><body>WCAG content 1</body></html>')
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Server Error'
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue('<html><body>WCAG content 3</body></html>')
        } as any);

      const guidelines = await fetcher.fetchWCAGGuidelines();

      expect(guidelines.size).toBe(2); // Only successful fetches
    });
  });

  describe('fetchARIADocumentation', () => {
    it('should fetch ARIA documentation URLs', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      mockFetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('<html><body>ARIA content</body></html>')
      } as any);

      const ariaDocs = await fetcher.fetchARIADocumentation();

      expect(ariaDocs).toBeInstanceOf(Map);
      expect(ariaDocs.size).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalledTimes(3); // Three ARIA URLs
    });
  });

  describe('fetchMDNAccessibilityGuides', () => {
    it('should fetch MDN guides', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      mockFetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('<html><body>MDN content</body></html>')
      } as any);

      const mdnGuides = await fetcher.fetchMDNAccessibilityGuides();

      expect(mdnGuides).toBeInstanceOf(Map);
      expect(mdnGuides.size).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalledTimes(3); // Three MDN URLs
    });
  });

  describe('fetchAllDocumentation', () => {
    it('should fetch all documentation sources in parallel', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      mockFetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('<html><body>Content</body></html>')
      } as any);

      const allDocs = await fetcher.fetchAllDocumentation();

      expect(allDocs).toHaveProperty('wcag');
      expect(allDocs).toHaveProperty('aria');
      expect(allDocs).toHaveProperty('mdn');
      expect(allDocs.wcag).toBeInstanceOf(Map);
      expect(allDocs.aria).toBeInstanceOf(Map);
      expect(allDocs.mdn).toBeInstanceOf(Map);
    });
  });
}); 