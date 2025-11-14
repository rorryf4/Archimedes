# ADR-0005: Domain Testing Strategy

- Date: 2025-11-14
- Status: Accepted

## Context

We now have a growing set of pure domain modules under `app/web/modules` (starting with the markets module introduced in Milestone 5). As the application grows, we need confidence in domain behavior independent of UI components or infrastructure dependencies.

Without a testing strategy:
- Domain logic changes risk introducing regressions
- Business logic correctness is difficult to verify
- Refactoring becomes risky and time-consuming
- Integration between domain layers is harder to debug

## Decision

We will implement a comprehensive testing strategy for domain modules:

1. **Test Framework**: Use [Vitest](https://vitest.dev/) as the test runner
   - Fast, Vite-native test runner
   - Compatible with TypeScript and ES modules
   - Built-in coverage reporting
   - Excellent developer experience

2. **Test Location**: Place tests in `app/web/tests/<module>/` directory
   - Example: `tests/markets/service.test.ts`
   - Mirrors the module structure for easy discovery
   - Keeps tests separate from implementation code

3. **Test Scope**: Focus on pure domain logic
   - Test domain modules in `app/web/modules/`
   - No network calls, no external APIs, no I/O operations
   - Test against in-memory data (TOKENS, MARKETS arrays)
   - Pure functions only - deterministic and fast

4. **Test Coverage**: Ensure core domain functions are tested
   - Happy paths: Valid inputs return expected outputs
   - Edge cases: Empty results, missing data
   - Error cases: Invalid inputs, undefined returns
   - Type safety: Verify correct TypeScript types

5. **Test Scripts**: Add npm scripts for running tests
   - `pnpm test`: Run all tests once (for CI)
   - `pnpm test:watch`: Run tests in watch mode (for development)

## Rationale

- **Confidence**: Unit tests provide safety net for refactoring domain logic
- **Speed**: Pure unit tests run in milliseconds, enabling fast feedback loops
- **Clarity**: Tests serve as living documentation of domain behavior
- **Isolation**: Testing domain logic separately from UI and infrastructure simplifies debugging
- **Quality**: Automated tests catch regressions before they reach production

## Consequences

### Positive
- Easier and safer refactoring of domain logic
- Clear separation between domain tests and future integration/API tests
- Fast test execution enables frequent test runs during development
- Tests document expected behavior for new team members
- Improved code quality through test-driven thinking
- CI/CD pipeline can enforce test passing before deployment

### Negative
- Developers must write and maintain tests alongside domain code
- Initial time investment to set up test infrastructure
- Learning curve for team members unfamiliar with Vitest
- Test maintenance overhead when domain requirements change

## Implementation

### Test Setup
- **Config**: `vitest.config.ts` in `app/web/`
- **Framework**: Vitest 2.x
- **Test files**: `tests/<module>/*.test.ts`

### Example Test Structure
```typescript
describe('markets service', () => {
  describe('listTokens', () => {
    it('returns all tokens from TOKENS array', () => {
      const tokens = listTokens();
      expect(tokens.length).toBeGreaterThan(0);
    });
  });
});
```

### Current Coverage
Markets module (`tests/markets/service.test.ts`):
- `listTokens()`: 4 tests
- `listMarkets()`: 3 tests
- `getMarketById()`: 3 tests
- `getLatestPriceFeedForMarket()`: 4 tests
- **Total: 14 tests passing**

## Future Work

- Add integration tests for API routes
- Add E2E tests for UI workflows
- Implement code coverage reporting
- Set up pre-commit hooks to run tests
- Add performance benchmarks for critical domain functions
- Consider property-based testing for complex domain logic
