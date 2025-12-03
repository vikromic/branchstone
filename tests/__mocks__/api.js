/**
 * Mock API Service
 * Provides test doubles for API calls
 */

export const artworksAPI = {
  getAll: jest.fn(),
  getFeatured: jest.fn(),
  getById: jest.fn(),
};

export const translationsAPI = {
  getAll: jest.fn(),
  getLanguage: jest.fn(),
};

export const contactAPI = {
  submit: jest.fn(),
};

export default {
  artworks: artworksAPI,
  translations: translationsAPI,
  contact: contactAPI,
};
