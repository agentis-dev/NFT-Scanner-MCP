# NFT Scanner MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io/)

A comprehensive **Model Context Protocol (MCP) server** that provides real-time blockchain data for NFTs across multiple networks. Built for AI assistants to access live NFT market data, ownership information, and transaction history.

## 🚀 Features

### Real-Time NFT Data
- **Collection Analytics**: Floor prices, volume, market cap, owner counts
- **Live Metadata**: Token details, attributes, ownership tracking
- **Transaction History**: Transfers, sales, marketplace activity
- **Multi-chain Support**: Ethereum, Polygon, Arbitrum, Optimism

### Market Intelligence
- **Floor Price Tracking**: Real-time prices across OpenSea, LooksRare, Blur
- **Sales History**: Detailed transaction data with pricing and timestamps
- **Collection Search**: Find NFT projects by name or description
- **Wallet Analysis**: Complete NFT portfolio for any address

### Data Sources
- **[Alchemy NFT API](https://docs.alchemy.com/reference/nft-api-quickstart)** - Primary blockchain data
- **[OpenSea API](https://docs.opensea.io/)** - Marketplace statistics and events
- **[NFTScan API](https://developer.nftscan.com/)** - Additional data validation

## 📊 Available Tools

| Tool | Description | Use Case |
|------|-------------|----------|
| `getNFTCollectionDetails` | Complete collection stats and metadata | Market research, portfolio analysis |
| `getNFTMetadata` | Specific token details and ownership | Token verification, trait analysis |
| `getNFTTransfers` | Transaction history and transfers | Ownership tracking, market activity |
| `getNFTSales` | Marketplace sales and pricing data | Price discovery, market trends |
| `getWalletNFTs` | All NFTs owned by a wallet | Portfolio management, holder analysis |
| `getNFTFloorPrice` | Current floor prices across markets | Price monitoring, arbitrage |
| `searchNFTCollections` | Find collections by name/description | Discovery, research |

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**
- API keys (see configuration below)

### Quick Start

1. **Clone and Install**
```bash
git clone <repository-url>
cd nft-scanner-mcp
npm install
```

2. **Configure API Keys**
```bash
cp env.example .env
# Edit .env with your API keys
```

3. **Run the Server**
```bash
npm start
```

4. **Test with Demo**
```bash
npm test
```

## 🔑 API Configuration

### Required: Alchemy API Key
```bash
# Get free API key at: https://dashboard.alchemy.com/
ALCHEMY_API_KEY=your_alchemy_api_key_here
```

### Optional: Enhanced Data Sources
```bash
# OpenSea API (recommended for market data)
OPENSEA_API_KEY=your_opensea_api_key_here

# NFTScan API (additional validation)
NFTSCAN_API_KEY=your_nftscan_api_key_here
```

### Getting API Keys

1. **[Alchemy](https://dashboard.alchemy.com/)** (Required)
   - Sign up for free account
   - Create new app
   - Copy API key from dashboard

2. **[OpenSea](https://docs.opensea.io/reference/request-an-api-key)** (Recommended)
   - Apply for API access
   - Enhanced marketplace data

3. **[NFTScan](https://developer.nftscan.com/)** (Optional)
   - Additional data source for validation

## 💡 Usage Examples

### Get Collection Details
```javascript
{
  "name": "getNFTCollectionDetails",
  "arguments": {
    "contractAddress": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    "chain": "ethereum"
  }
}
```

**Response:**
```json
{
  "collectionDetails": {
    "name": "Bored Ape Yacht Club",
    "totalSupply": "10000",
    "marketStats": {
      "floorPrice": 15.75,
      "totalVolume": 682544.23,
      "numOwners": 5420,
      "sevenDayVolume": 1205.67
    }
  }
}
```

### Get NFT Metadata
```javascript
{
  "name": "getNFTMetadata", 
  "arguments": {
    "contractAddress": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    "tokenId": "1000"
  }
}
```

### Check Wallet NFTs
```javascript
{
  "name": "getWalletNFTs",
  "arguments": {
    "walletAddress": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "limit": 50
  }
}
```

### Search Collections
```javascript
{
  "name": "searchNFTCollections",
  "arguments": {
    "query": "Azuki",
    "limit": 10
  }
}
```

## 🌐 Supported Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| Ethereum | `ethereum` | ✅ Full Support |
| Polygon | `polygon` | ✅ Full Support |
| Arbitrum | `arbitrum` | ✅ Full Support |
| Optimism | `optimism` | ✅ Full Support |

## 🔍 Data Structure

### Collection Details Response
```typescript
{
  timestamp: string;
  contractAddress: string;
  chain: string;
  collectionDetails: {
    name: string;
    description: string;
    totalSupply: number;
    symbol: string;
    contractType: string;
    verified: boolean;
    marketStats: {
      floorPrice: number;
      totalVolume: number;
      totalSales: number;
      averagePrice: number;
      numOwners: number;
      oneDayVolume: number;
      sevenDayVolume: number;
    };
    social: {
      website: string;
      discord: string;
      twitter: string;
    };
  };
}
```

### NFT Metadata Response
```typescript
{
  timestamp: string;
  contractAddress: string;
  tokenId: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string;
    }>;
    owner: string;
    tokenType: string;
  };
}
```

## ⚡ Performance & Rate Limits

- **Built-in Rate Limiting**: 1 request per second
- **Automatic Retries**: Up to 3 retries with exponential backoff
- **Request Caching**: Smart caching to reduce API calls
- **Error Handling**: Graceful degradation when APIs are unavailable

## 🎯 Real-World Applications

### For AI Assistants
- **Market Analysis**: "What's the current floor price of BAYC?"
- **Portfolio Tracking**: "Show me all NFTs in wallet 0x..."
- **Collection Research**: "Find information about Azuki collection"
- **Transaction Monitoring**: "Get recent sales for CryptoPunks"

### For Developers
- **NFT Portfolio Apps**: Real-time wallet tracking
- **Market Dashboards**: Live collection statistics
- **Trading Bots**: Floor price monitoring
- **Analytics Platforms**: Historical transaction data

## 🔧 Development

### Project Structure
```
nft-scanner-mcp/
├── nft-scanner-mcp-server.js    # Main MCP server
├── demo-nft-scanner-mcp.js      # Demo/testing script
├── package.json                 # Dependencies
├── env.example                  # Environment template
└── README.md                    # This file
```

### Running Tests
```bash
# Run demo with sample data
npm test

# Start server in development mode
npm run dev
```

### Adding New Features
The server is designed to be extensible. To add new NFT data sources:

1. Add new tool definition in `setupToolHandlers()`
2. Implement the corresponding method
3. Update rate limiting and error handling
4. Add example usage to demo script

## 🛡️ Error Handling

The server includes comprehensive error handling:

- **API Failures**: Automatic fallback to alternative data sources
- **Rate Limiting**: Exponential backoff with retry logic
- **Invalid Addresses**: Validation and clear error messages
- **Network Issues**: Graceful degradation and timeout handling

## 📈 Monitoring

All requests include:
- **Timestamps**: ISO 8601 format
- **Data Sources**: Clear attribution of data origin
- **Request IDs**: For debugging and tracking
- **Performance Metrics**: Response times and success rates

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- **[Real-time Crypto MCP](https://github.com/smhnkmr/realtime-crypto-mcp-server)** - Cryptocurrency data
- **[Model Context Protocol](https://modelcontextprotocol.io/)** - Official MCP documentation
- **[Alchemy NFT API](https://docs.alchemy.com/reference/nft-api-quickstart)** - Primary data source

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: [MCP Docs](https://modelcontextprotocol.io/)
- **Community**: [Discord](#) | [Twitter](#)

---

**Built with ❤️ for the Web3 community** 