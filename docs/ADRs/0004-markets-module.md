# ADR-0004: Markets Module

- Date: 2025-11-13
- Status: Accepted

## Context

We are introducing a crypto markets domain module as the first real domain feature in Archimedes. This module will manage market data, token information, and price feeds for cryptocurrency trading pairs.

## Decision

We will:

1. **Use in-memory placeholder data** for markets, tokens, and price feeds
   - No external API dependencies at this stage
   - Simple, deterministic data for development and testing
   - Easily replaceable with real data sources later

2. **Define core domain types**:
   - `Token`: Represents a cryptocurrency or asset (id, symbol, name, decimals)
   - `Market`: Represents a trading pair (baseTokenId, quoteTokenId, venue, status)
   - `PriceFeed`: Represents price data for a market (marketId, price, timestamp)

3. **Keep domain logic pure and isolated** in `app/web/modules/markets`
   - Pure functions with no async operations or I/O
   - Clear separation between data (data.ts), business logic (service.ts), and types (types.ts)
   - Public API exported via barrel file (index.ts)

4. **Expose read-only APIs** via `/api/markets` and `/api/markets/[id]`
   - Use existing API response helpers (`ok()`, `error()`)
   - Follow established patterns from system module
   - Return 404 for non-existent markets
   - Include related token data in responses

## Module Structure

```
app/web/modules/markets/
├── index.ts      # Public API exports
├── types.ts      # Domain type definitions
├── data.ts       # In-memory placeholder data
└── service.ts    # Pure domain functions
```

## API Endpoints

### GET /api/markets
Returns all available markets with their base and quote token details.

### GET /api/markets/[id]
Returns a specific market by ID along with its latest price feed. Returns 404 if market not found.

## Rationale

- **Stability**: In-memory data provides a stable foundation for frontend development
- **Testability**: Pure functions are easy to test without mocks or external dependencies
- **Flexibility**: Data layer can be swapped for real exchange APIs without changing the domain logic
- **Consistency**: Following established patterns ensures codebase coherence

## Consequences

### Positive
- We have a stable, testable domain surface for market data
- Frontend can start integrating against a stable API shape
- Clear path to add real data sources (exchange APIs, databases) later
- Minimal coupling to infrastructure at this stage
- Pattern established for future domain modules

### Negative
- Manual data updates required until real data sources are integrated
- Limited market data (only BTC/USDT and ETH/USDT initially)
- Price feeds are mock data and don't reflect real market conditions

## Future Work

- Integrate real exchange APIs (Binance, Coinbase, Kraken)
- Add WebSocket support for real-time price updates
- Implement data persistence layer
- Add market analytics and historical data
- Support for more trading pairs and venues
