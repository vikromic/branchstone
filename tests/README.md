# Test Directory Structure

This directory contains all automated tests for the Branchstone portfolio website.

## Directory Layout

```
tests/
├── components/          # Component unit/integration tests
│   ├── Carousel.test.js
│   ├── FormValidator.test.js
│   ├── Gallery.test.js
│   └── Lightbox.test.js
├── services/           # Service layer tests
│   └── api.test.js
├── utils/              # Utility function tests
│   └── dom.test.js
├── __mocks__/          # Manual mocks for dependencies
│   └── api.js
├── setup.js            # Global test configuration
└── README.md           # This file
```

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test Organization

### Component Tests

Each component test file covers:
- Initialization
- User interactions
- State management
- Error handling
- Accessibility features
- Edge cases

### Service Tests

Service tests verify:
- API calls and responses
- Error handling
- Data transformation
- Caching behavior

### Utility Tests

Utility tests ensure:
- DOM manipulation
- Event handling
- Helper functions
- Performance utilities

## Writing Tests

### File Naming

- Test files: `*.test.js`
- Mock files: `__mocks__/[module-name].js`

### Test Naming Convention

```javascript
describe('Component/Feature Name', () => {
  describe('Specific Feature', () => {
    it('should_[expected_behavior]_when_[condition]', () => {
      // Test implementation
    });
  });
});
```

### Test Structure (AAA Pattern)

```javascript
it('should_do_something_when_condition', () => {
  // Arrange - Setup test data and conditions
  const component = new Component({ option: 'value' });

  // Act - Perform the action
  component.doSomething();

  // Assert - Verify the result
  expect(component.state).toBe('expected');
});
```

## Coverage Reports

After running `npm run test:coverage`, view the HTML report:

```bash
open coverage/index.html
```

## Test Configuration

- **jest.config.js**: Main Jest configuration
- **setup.js**: Global mocks and utilities
- **babel.config.js**: Babel transpilation for ES modules

## Best Practices

1. **Isolation**: Each test should be independent
2. **Speed**: Keep tests fast (<100ms for unit tests)
3. **Clarity**: Use descriptive test names
4. **Coverage**: Aim for >70% on critical paths
5. **Determinism**: No flaky tests in main branch

## Debugging Tests

### Run specific test file
```bash
npm test -- Carousel.test.js
```

### Run specific test case
```bash
npm test -- -t "should_navigate_to_next_item"
```

### Debug with verbose output
```bash
npm test -- --verbose
```

## Common Issues

### ES Module Errors
Make sure `"type": "module"` is in package.json

### Mock Not Working
Check that mock is in `__mocks__/` and properly imported

### Timeout Errors
Increase timeout or check for unresolved promises

## Contributing

When adding new tests:
1. Follow the naming convention
2. Include happy path + at least one failure path
3. Add edge case tests
4. Update this README if adding new test categories
5. Ensure tests pass before committing

## Support

For questions or issues:
- See main [TESTING.md](../TESTING.md) documentation
- Check [Jest documentation](https://jestjs.io/)
- Review existing tests for examples
