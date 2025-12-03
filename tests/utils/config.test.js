/**
 * Sample Test File - Configuration Module
 * Tests for docs/js/config.js
 */

import { describe, it, expect } from '@jest/globals';

describe('Configuration Module', () => {
  it('should pass basic sanity check', () => {
    expect(true).toBe(true);
  });

  it('should perform basic arithmetic', () => {
    const sum = 2 + 2;
    expect(sum).toBe(4);
  });

  it('should handle string operations', () => {
    const greeting = 'Hello, World!';
    expect(greeting).toContain('World');
    expect(greeting).toHaveLength(13);
  });

  it('should work with arrays', () => {
    const items = ['artwork', 'gallery', 'portfolio'];
    expect(items).toHaveLength(3);
    expect(items).toContain('gallery');
  });

  it('should work with objects', () => {
    const artwork = {
      id: 1,
      title: 'Test Artwork',
      available: true,
    };
    expect(artwork).toHaveProperty('id');
    expect(artwork.title).toBe('Test Artwork');
    expect(artwork.available).toBe(true);
  });
});

describe('DOM Testing Capabilities', () => {
  it('should have access to document', () => {
    expect(document).toBeDefined();
    expect(document.body).toBeDefined();
  });

  it('should be able to create elements', () => {
    const div = document.createElement('div');
    div.className = 'test-element';
    div.textContent = 'Test Content';

    expect(div.className).toBe('test-element');
    expect(div.textContent).toBe('Test Content');
  });

  it('should be able to query elements', () => {
    document.body.innerHTML = `
      <div id="test-container">
        <h1 class="title">Test Title</h1>
        <p class="description">Test Description</p>
      </div>
    `;

    const container = document.getElementById('test-container');
    const title = document.querySelector('.title');
    const description = document.querySelector('.description');

    expect(container).not.toBeNull();
    expect(title?.textContent).toBe('Test Title');
    expect(description?.textContent).toBe('Test Description');
  });
});

describe('Async Testing Capabilities', () => {
  it('should handle promises', async () => {
    const promise = Promise.resolve('resolved value');
    const result = await promise;
    expect(result).toBe('resolved value');
  });

  it('should handle async/await with fake timers', async () => {
    const fetchData = async () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ data: 'test data' }), 10);
      });
    };

    const resultPromise = fetchData();

    // Advance fake timers to resolve the setTimeout
    jest.advanceTimersByTime(20);

    const result = await resultPromise;
    expect(result).toEqual({ data: 'test data' });
  });
});

describe('Mock Testing Capabilities', () => {
  it('should have localStorage available', () => {
    expect(localStorage).toBeDefined();
    localStorage.setItem('testKey', 'testValue');
    expect(localStorage.getItem('testKey')).toBe('testValue');
  });

  it('should have fetch available', () => {
    expect(fetch).toBeDefined();
    expect(typeof fetch).toBe('function');
  });

  it('should have matchMedia available', () => {
    expect(window.matchMedia).toBeDefined();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    expect(mediaQuery).toBeDefined();
  });
});
