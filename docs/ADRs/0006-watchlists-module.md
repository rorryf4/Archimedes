# ADR-0006: Watchlists Module and API Design

**Status:** Accepted
**Date:** 2025-01-14 (Updated: 2025-01-15)
**Deciders:** Engineering Team
**Related:** ADR-0004 (Markets Module), ADR-0005 (Domain Testing Strategy)

## Context

Users need the ability to organize and track specific tokens and markets of interest. A watchlist feature allows users to create custom collections of crypto assets they want to monitor closely.

**Milestone 10-11** introduced a read-only watchlists domain module with static data and UI pages for viewing watchlists.

**Milestone 12** extends the module with full CRUD (Create, Read, Update, Delete) operations, including:
- Creating new watchlists
- Updating watchlist metadata
- Adding/removing tokens and markets
- Deleting watchlists
- In-memory persistence layer with repository pattern

## Decision

We will implement the watchlists domain module following the established modular architecture pattern from ADR-0004:

### Module Structure

```
app/web/modules/watchlists/
├── types.ts        # Type definitions
├── data.ts         # Initial data / fixtures
├── service.ts      # Read-only domain functions with relations
├── repository.ts   # CRUD operations (Milestone 12)
├── validation.ts   # Zod schemas for input validation (Milestone 12)
└── index.ts        # Public exports
```

### Core Types

**WatchlistItem**: Represents a single item in a watchlist
- `id`: Unique identifier
- `tokenId?`: Optional reference to a token
- `marketId?`: Optional reference to a market
- `createdAt`: ISO 8601 timestamp

Items can reference either a token OR a market (or neither in edge cases), providing flexibility for different types of watchlist entries.

**Watchlist**: Base watchlist structure
- `id`: Unique identifier
- `name`: Display name
- `description?`: Optional description
- `items`: Array of WatchlistItem
- `createdAt`: ISO 8601 timestamp (Milestone 12)
- `updatedAt`: ISO 8601 timestamp (Milestone 12)

**WatchlistWithRelations**: Enriched watchlist with resolved references
- Same as Watchlist, but items include full `Token` and `Market` objects
- Enables efficient rendering without additional lookups

### Service Functions (Read-Only)

All functions are pure and synchronous:

1. `listWatchlists()`: Returns all watchlists without relations
2. `getWatchlistById(id)`: Returns single watchlist by ID
3. `listWatchlistsWithRelations()`: Returns all watchlists with resolved token/market data
4. `getWatchlistWithRelationsById(id)`: Returns single enriched watchlist

The service layer uses the markets module to resolve tokenId and marketId references to full entity objects.

### Repository Functions (Milestone 12)

The repository layer provides async CRUD operations:

1. `createWatchlist(input)`: Creates a new watchlist
2. `updateWatchlist(id, input)`: Updates watchlist metadata (name, description)
3. `addTokenToWatchlist(id, tokenId)`: Adds a token to a watchlist
4. `addMarketToWatchlist(id, marketId)`: Adds a market to a watchlist
5. `removeItemFromWatchlist(id, itemId)`: Removes an item from a watchlist
6. `deleteWatchlist(id)`: Deletes a watchlist
7. `resetStore()`: Resets to initial data (testing utility)

All operations maintain timestamps (createdAt, updatedAt) and enforce uniqueness constraints.

### Validation Layer (Milestone 12)

Zod schemas for input validation:

- `CreateWatchlistInput`: Name (required, 1-100 chars), description (optional, max 500 chars)
- `UpdateWatchlistInput`: Name and/or description (both optional)
- `AddTokenInput`: Token ID (required)
- `AddMarketInput`: Market ID (required)
- `RemoveItemInput`: Item ID (required)
- `PatchWatchlistInput`: Discriminated union for all PATCH operations

### API Endpoints

**GET /api/watchlists**
- Lists all watchlists with token/market relations
- Returns `{ success: true, data: { watchlists: WatchlistWithRelations[] } }`

**POST /api/watchlists** (Milestone 12)
- Creates a new watchlist
- Body: `CreateWatchlistInput`
- Returns `{ success: true, data: { watchlist: Watchlist } }` (201)

**GET /api/watchlists/[id]**
- Gets single watchlist with relations
- Returns watchlist or 404

**PATCH /api/watchlists/[id]** (Milestone 12)
- Supports multiple operations via discriminated union:
  - `{ action: "update-metadata", data: UpdateWatchlistInput }`
  - `{ action: "add-token", data: { tokenId: string } }`
  - `{ action: "add-market", data: { marketId: string } }`
  - `{ action: "remove-item", data: { itemId: string } }`
- Returns updated watchlist or 404/400

**DELETE /api/watchlists/[id]** (Milestone 12)
- Deletes a watchlist
- Returns `{ success: true }` or 404

### Data Model

Static data includes two sample watchlists:
- **My Favorites**: Mixed collection of tokens (BTC, ETH) and markets (BTC/USDT)
- **Trending Markets**: Focus on active markets and quote tokens

This provides realistic test data for UI development.

## Consequences

### Positive

- **Flexible References**: Items can point to tokens or markets independently
- **Efficient Data Loading**: WithRelations pattern pre-resolves all references
- **Consistent Architecture**: Follows established patterns from markets module
- **Type Safety**: Full TypeScript coverage with strict typing
- **Testable**: Pure functions enable comprehensive unit testing
- **Cross-Module Integration**: Demonstrates proper use of module public APIs

### Negative

- **In-Memory Persistence**: Changes are lost on server restart (acceptable for prototype)
- **No Authentication**: No user ownership or multi-tenancy support yet
- **No Validation of References**: tokenId/marketId are not validated against actual tokens/markets
- **Mutable Global State**: Repository uses mutable in-memory store (not thread-safe for concurrent requests)
- **Circular Dependencies**: Watchlists depends on markets module (acceptable for now)

### Future Considerations

- **Database Persistence**: Replace in-memory store with Prisma/Supabase/etc.
- **User Ownership**: Associate watchlists with authenticated users
- **Reference Validation**: Verify tokenId/marketId exist before adding
- **Optimistic Locking**: Add version field to prevent concurrent update conflicts
- **Real-time Updates**: Add WebSocket support for live price updates in watchlists
- **Sorting/Filtering**: Allow users to organize and filter watchlist items
- **Bulk Operations**: Support adding multiple items at once
- **Sharing**: Allow users to share watchlists publicly or with specific users

## Testing

Following ADR-0005 testing strategy:

**Milestone 10-11**: 20 unit tests for read-only service functions
- Basic list and get operations
- Structure validation
- Relations enrichment
- Token and market data resolution
- Edge cases (non-existent IDs, empty results)

**Milestone 12**: 25+ unit tests for repository CRUD operations
- `tests/watchlists/repository.test.ts`:
  - Creating watchlists with/without descriptions
  - Updating metadata (name, description, timestamps)
  - Adding tokens and markets (with duplicate detection)
  - Removing items from watchlists
  - Deleting watchlists
  - Store reset functionality
  - Error handling for not-found scenarios

All tests use Vitest with beforeEach hooks to reset store state, ensuring test isolation.

**Milestone 14**: 15+ unit tests for enrichment layer
- `tests/watchlists/enrichment.test.ts`:
  - Enriching watchlists with token items (symbol, name, price, change, volume)
  - Enriching watchlists with market items (pair symbols, price data)
  - Handling mixed token/market items
  - Graceful handling of non-existent token/market IDs
  - Handling items with neither tokenId nor marketId
  - Price caching functionality and cache clearing
  - Batch enrichment of multiple watchlists

## Enrichment Layer (Milestone 14)

### Overview

The enrichment layer transforms raw watchlist data from the repository into display-ready view models with market data, prices, and metadata. This layer sits between the repository and the API routes, providing a clean separation between data storage and presentation logic.

### Architecture

**Location**: `app/web/modules/watchlists/enrichment.ts`

**Flow**:
1. Repository returns raw `Watchlist` objects with only IDs
2. Enrichment layer resolves IDs to full entities using markets module
3. Adds price data, 24h changes, and volume from markets module
4. Returns `WatchlistEnriched` objects ready for UI consumption

### Enriched Types

**WatchlistItemEnriched**:
- `kind`: Discriminator ('token' | 'market')
- `symbol`: Display symbol (e.g., "BTC" or "BTC/USDT")
- `name`: Human-readable name
- `price`: Current price (USD)
- `priceChange24h`: 24h percentage change (mocked for now)
- `volume24h`: 24h trading volume (mocked for now)
- `baseSymbol` / `quoteSymbol`: For markets only

**WatchlistEnriched**:
- Same metadata as `Watchlist` (id, name, description, timestamps)
- `items`: Array of `WatchlistItemEnriched` instead of raw `WatchlistItem`

### Data Sources

Enrichment uses existing infrastructure:
- **Token metadata**: `listTokens()` from markets module
- **Market metadata**: `getMarketById()` from markets module
- **Price data**: `getLatestPriceFeedForMarket()` from markets module
- **24h change**: Mock calculation (production would use price history service)
- **24h volume**: Mock calculation (production would use volume tracking service)

### Caching Strategy

To avoid redundant price lookups, the enrichment layer implements in-memory caching:
- **Cache Key**: Market ID
- **Cache TTL**: 60 seconds
- **Implementation**: Simple `Map<string, CacheEntry<number>>`
- **Invalidation**: Time-based expiration + manual `clearPriceCache()` for testing

This reduces repeated calls to `getLatestPriceFeedForMarket()` when enriching multiple watchlists or re-fetching the same watchlist within the TTL window.

### API Integration

API routes now use enrichment instead of raw service layer:
- **GET /api/watchlists**: `enrichWatchlists(await repository.listWatchlists())`
- **GET /api/watchlists/[id]**: `enrichWatchlist(await repository.getWatchlistById(id))`

POST/PATCH/DELETE operations still return raw watchlists from repository (no enrichment needed for write operations).

### UI Integration

**Watchlists listing page** (`/watchlists`):
- Shows preview of top 3 items per watchlist
- Displays symbol, name, price, and 24h change for each preview item
- Color-coded price changes (green for positive, red for negative)

**Watchlist detail page** (`/watchlists/[id]`):
- Full card per item with large price display
- Shows kind (token/market), symbol, name
- Displays current price, 24h change percentage, and 24h volume
- Clickable links to token/market detail pages

### Design Decisions

**Separation of concerns**: Enrichment is a pure function layer, not mixed into repository or components. This keeps data storage logic separate from presentation logic.

**Synchronous enrichment**: Currently synchronous since all data sources are in-memory. When price data becomes async (e.g., external API), enrichment functions can easily become async.

**Mock data for metrics**: 24h change and volume are currently mocked with stable hash-based values. This provides realistic UI without implementing full price history tracking. Production would replace these with real time-series data.

**No enrichment on writes**: POST/PATCH/DELETE return raw watchlists to avoid unnecessary enrichment overhead. Clients can re-fetch with GET to get enriched data.

## Alternatives Considered

### Combined Token/Market Field
Store a single `assetId` field instead of separate `tokenId`/`marketId`.

**Rejected**: Would require type disambiguation and make queries more complex. Separate fields provide clearer intent and simpler service logic.

### Direct Entity Storage
Store full Token/Market objects in WatchlistItem instead of IDs.

**Rejected**: Creates data duplication and synchronization issues. Reference-based approach maintains single source of truth.

### API-Level Filtering
Allow query parameters to filter watchlists by type (token/market only).

**Deferred**: Not needed for read-only MVP. Can be added later if usage patterns show demand.

## References

- ADR-0004: Markets Module - Established modular architecture pattern
- ADR-0005: Domain Testing Strategy - Testing approach and tools
- Markets Module API: Used for resolving token and market references
