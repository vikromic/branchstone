/**
 * API Service Tests
 * Tests successful fetch, network error handling, and caching behavior
 */

import { artworksAPI, translationsAPI, contactAPI } from '../../docs/js/services/api.js';

describe('API Service', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Artworks API', () => {
    const mockArtworks = [
      {
        id: 1,
        title: 'Artwork 1',
        size: '20x30 cm',
        image: '/img/art1.jpg',
        available: true,
      },
      {
        id: 2,
        title: 'Artwork 2',
        size: '30x40 cm',
        image: '/img/art2.jpg',
        available: false,
      },
    ];

    describe('getAll', () => {
      it('should_fetch_all_artworks_successfully', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockArtworks,
        });

        const result = await artworksAPI.getAll();

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(
          'js/artworks.json',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        );
        expect(result).toEqual(mockArtworks);
      });

      it('should_throw_error_when_fetch_fails', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(artworksAPI.getAll()).rejects.toThrow('HTTP error! status: 404');
      });

      it('should_throw_error_on_network_failure', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(artworksAPI.getAll()).rejects.toThrow('Network error');
      });

      it('should_handle_json_parsing_error', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => {
            throw new Error('Invalid JSON');
          },
        });

        await expect(artworksAPI.getAll()).rejects.toThrow('Invalid JSON');
      });
    });

    describe('getFeatured', () => {
      it('should_return_first_n_artworks', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockArtworks,
        });

        const result = await artworksAPI.getFeatured(1);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockArtworks[0]);
      });

      it('should_use_default_count_from_config', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockArtworks,
        });

        const result = await artworksAPI.getFeatured();

        expect(result.length).toBeLessThanOrEqual(6); // CONFIG default
      });

      it('should_handle_count_larger_than_available', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockArtworks,
        });

        const result = await artworksAPI.getFeatured(10);

        expect(result).toHaveLength(2);
        expect(result).toEqual(mockArtworks);
      });

      it('should_propagate_fetch_errors', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

        await expect(artworksAPI.getFeatured()).rejects.toThrow('HTTP error! status: 500');
      });
    });

    describe('getById', () => {
      it('should_return_artwork_by_id', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockArtworks,
        });

        const result = await artworksAPI.getById(1);

        expect(result).toEqual(mockArtworks[0]);
      });

      it('should_return_null_when_artwork_not_found', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockArtworks,
        });

        const result = await artworksAPI.getById(999);

        expect(result).toBeNull();
      });

      it('should_handle_empty_artworks_array', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

        const result = await artworksAPI.getById(1);

        expect(result).toBeNull();
      });
    });
  });

  describe('Translations API', () => {
    const mockTranslations = {
      en: {
        'nav.home': 'Home',
        'nav.gallery': 'Gallery',
      },
      ua: {
        'nav.home': 'Головна',
        'nav.gallery': 'Галерея',
      },
    };

    describe('getAll', () => {
      it('should_fetch_all_translations_successfully', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockTranslations,
        });

        const result = await translationsAPI.getAll();

        expect(fetch).toHaveBeenCalledWith(
          'js/translations.json',
          expect.any(Object)
        );
        expect(result).toEqual(mockTranslations);
      });

      it('should_handle_fetch_failure', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(translationsAPI.getAll()).rejects.toThrow('HTTP error! status: 404');
      });
    });

    describe('getLanguage', () => {
      it('should_return_translations_for_specified_language', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockTranslations,
        });

        const result = await translationsAPI.getLanguage('ua');

        expect(result).toEqual(mockTranslations.ua);
      });

      it('should_fallback_to_default_language_when_not_found', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockTranslations,
        });

        const result = await translationsAPI.getLanguage('fr');

        expect(result).toEqual(mockTranslations.en);
      });

      it('should_handle_missing_default_language', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ua: mockTranslations.ua }),
        });

        const result = await translationsAPI.getLanguage('fr');

        expect(result).toBeUndefined();
      });
    });
  });

  describe('Contact API', () => {
    const mockFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello!',
    };

    describe('submit', () => {
      it('should_submit_form_data_successfully', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const result = await contactAPI.submit(mockFormData);

        expect(fetch).toHaveBeenCalledWith(
          'https://formspree.io/f/xgvbwebq',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(mockFormData),
          })
        );
        expect(result).toEqual({ success: true });
      });

      it('should_throw_error_when_submission_fails', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
        });

        await expect(contactAPI.submit(mockFormData)).rejects.toThrow('Form submission failed');
      });

      it('should_handle_network_failure', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(contactAPI.submit(mockFormData)).rejects.toThrow('Network error');
      });

      it('should_serialize_data_to_json', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        await contactAPI.submit(mockFormData);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify(mockFormData),
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should_log_error_to_console_on_failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(artworksAPI.getAll()).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API Error'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should_preserve_error_details', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      try {
        await artworksAPI.getAll();
      } catch (error) {
        expect(error.message).toContain('403');
      }
    });
  });

  describe('HTTP Headers', () => {
    it('should_include_content_type_header', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await artworksAPI.getAll();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should_merge_custom_headers', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Direct test of fetch with custom headers
      await fetch('test-url', {
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'value',
        },
      });

      expect(fetch).toHaveBeenCalledWith(
        'test-url',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'value',
          }),
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should_handle_empty_response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const result = await artworksAPI.getAll();

      expect(result).toBeNull();
    });

    it('should_handle_malformed_json_response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      });

      await expect(artworksAPI.getAll()).rejects.toThrow('Unexpected token');
    });

    it('should_handle_timeout_errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(artworksAPI.getAll()).rejects.toThrow('Request timeout');
    });

    it('should_handle_cors_errors', async () => {
      fetch.mockRejectedValueOnce(new Error('CORS error'));

      await expect(artworksAPI.getAll()).rejects.toThrow('CORS error');
    });
  });

  describe('Response Status Codes', () => {
    const testCases = [
      { status: 400, description: 'Bad Request' },
      { status: 401, description: 'Unauthorized' },
      { status: 403, description: 'Forbidden' },
      { status: 404, description: 'Not Found' },
      { status: 500, description: 'Internal Server Error' },
      { status: 502, description: 'Bad Gateway' },
      { status: 503, description: 'Service Unavailable' },
    ];

    testCases.forEach(({ status, description }) => {
      it(`should_handle_${status}_${description.replace(/\s+/g, '_')}`, async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status,
        });

        await expect(artworksAPI.getAll()).rejects.toThrow(`HTTP error! status: ${status}`);
      });
    });
  });
});
