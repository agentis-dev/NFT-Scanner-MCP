#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import * as dotenv from "dotenv";

dotenv.config();

// API Configuration
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;
const NFTSCAN_API_KEY = process.env.NFTSCAN_API_KEY;

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
const MAX_RETRIES = 3;

class NFTScannerServer {
  constructor() {
    this.server = new Server(
      {
        name: "nft-scanner-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "getNFTCollectionDetails",
          description: "Get detailed information about an NFT collection including floor price, volume, and stats",
          inputSchema: {
            type: "object",
            properties: {
              contractAddress: {
                type: "string",
                description: "The contract address of the NFT collection (e.g., 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D for BAYC)",
              },
              chain: {
                type: "string",
                description: "Blockchain network (ethereum, polygon, arbitrum, optimism)",
                default: "ethereum",
              },
            },
            required: ["contractAddress"],
          },
        },
        {
          name: "getNFTMetadata",
          description: "Get metadata and ownership details for a specific NFT token",
          inputSchema: {
            type: "object",
            properties: {
              contractAddress: {
                type: "string",
                description: "The contract address of the NFT collection",
              },
              tokenId: {
                type: "string",
                description: "The token ID of the specific NFT",
              },
              chain: {
                type: "string",
                description: "Blockchain network (ethereum, polygon, arbitrum, optimism)",
                default: "ethereum",
              },
            },
            required: ["contractAddress", "tokenId"],
          },
        },
        {
          name: "getNFTTransfers",
          description: "Get transfer history and transaction data for an NFT collection or specific token",
          inputSchema: {
            type: "object",
            properties: {
              contractAddress: {
                type: "string",
                description: "The contract address of the NFT collection",
              },
              tokenId: {
                type: "string",
                description: "Optional: Specific token ID to get transfers for",
              },
              limit: {
                type: "number",
                description: "Number of transfers to return (default: 50, max: 100)",
                default: 50,
              },
              chain: {
                type: "string",
                description: "Blockchain network (ethereum, polygon, arbitrum, optimism)",
                default: "ethereum",
              },
            },
            required: ["contractAddress"],
          },
        },
        {
          name: "getNFTSales",
          description: "Get recent sales data and marketplace activity for NFT collections",
          inputSchema: {
            type: "object",
            properties: {
              contractAddress: {
                type: "string",
                description: "The contract address of the NFT collection",
              },
              tokenId: {
                type: "string",
                description: "Optional: Specific token ID to get sales for",
              },
              marketplace: {
                type: "string",
                description: "Filter by marketplace (opensea, looksrare, blur, x2y2)",
              },
              limit: {
                type: "number",
                description: "Number of sales to return (default: 50, max: 100)",
                default: 50,
              },
              chain: {
                type: "string",
                description: "Blockchain network (ethereum, polygon, arbitrum, optimism)",
                default: "ethereum",
              },
            },
            required: ["contractAddress"],
          },
        },
        {
          name: "getWalletNFTs",
          description: "Get all NFTs owned by a specific wallet address",
          inputSchema: {
            type: "object",
            properties: {
              walletAddress: {
                type: "string",
                description: "The wallet address to check for NFT ownership",
              },
              chain: {
                type: "string",
                description: "Blockchain network (ethereum, polygon, arbitrum, optimism)",
                default: "ethereum",
              },
              limit: {
                type: "number",
                description: "Number of NFTs to return (default: 100, max: 500)",
                default: 100,
              },
            },
            required: ["walletAddress"],
          },
        },
        {
          name: "getNFTFloorPrice",
          description: "Get current floor price and market statistics for an NFT collection",
          inputSchema: {
            type: "object",
            properties: {
              contractAddress: {
                type: "string",
                description: "The contract address of the NFT collection",
              },
              marketplace: {
                type: "string",
                description: "Specific marketplace to check (opensea, looksrare, blur)",
                default: "opensea",
              },
              chain: {
                type: "string",
                description: "Blockchain network (ethereum, polygon, arbitrum, optimism)",
                default: "ethereum",
              },
            },
            required: ["contractAddress"],
          },
        },
        {
          name: "searchNFTCollections",
          description: "Search for NFT collections by name or description",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search term for collection name or description",
              },
              limit: {
                type: "number",
                description: "Number of results to return (default: 20, max: 50)",
                default: 20,
              },
              chain: {
                type: "string",
                description: "Blockchain network (ethereum, polygon, arbitrum, optimism)",
                default: "ethereum",
              },
            },
            required: ["query"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;
        
        switch (name) {
          case "getNFTCollectionDetails":
            result = await this.getNFTCollectionDetails(args);
            break;
          case "getNFTMetadata":
            result = await this.getNFTMetadata(args);
            break;
          case "getNFTTransfers":
            result = await this.getNFTTransfers(args);
            break;
          case "getNFTSales":
            result = await this.getNFTSales(args);
            break;
          case "getWalletNFTs":
            result = await this.getWalletNFTs(args);
            break;
          case "getNFTFloorPrice":
            result = await this.getNFTFloorPrice(args);
            break;
          case "searchNFTCollections":
            result = await this.searchNFTCollections(args);
            break;
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof McpError) throw error;
        
        throw new McpError(
          ErrorCode.InternalError,
          `NFT Scanner error: ${error.message}`
        );
      }
    });
  }

  async makeRequest(url, options = {}, retries = 0) {
    try {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (response.status === 429 && retries < MAX_RETRIES) {
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(url, options, retries + 1);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (retries < MAX_RETRIES) {
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(url, options, retries + 1);
      }
      throw error;
    }
  }

  getChainId(chain) {
    const chainMap = {
      'ethereum': 'eth-mainnet',
      'polygon': 'polygon-mainnet',
      'arbitrum': 'arb-mainnet',
      'optimism': 'opt-mainnet',
    };
    return chainMap[chain] || 'eth-mainnet';
  }

  async getNFTCollectionDetails({ contractAddress, chain = 'ethereum' }) {
    try {
      const alchemyData = await this.getAlchemyCollectionDetails(contractAddress, chain);
      const openSeaData = await this.getOpenSeaCollectionStats(contractAddress);
      
      return {
        timestamp: new Date().toISOString(),
        contractAddress,
        chain,
        collectionDetails: {
          name: alchemyData.name || openSeaData.collection?.name || 'Unknown Collection',
          description: alchemyData.description || openSeaData.collection?.description,
          totalSupply: alchemyData.totalSupply,
          symbol: alchemyData.symbol,
          contractType: alchemyData.tokenType,
          verified: openSeaData.collection?.verified || false,
          marketStats: {
            floorPrice: openSeaData.stats?.floor_price,
            floorPriceETH: openSeaData.stats?.floor_price,
            totalVolume: openSeaData.stats?.total_volume,
            totalSales: openSeaData.stats?.total_sales,
            averagePrice: openSeaData.stats?.average_price,
            marketCap: openSeaData.stats?.market_cap,
            numOwners: openSeaData.stats?.num_owners,
            oneDayVolume: openSeaData.stats?.one_day_volume,
            oneDayChange: openSeaData.stats?.one_day_change,
            sevenDayVolume: openSeaData.stats?.seven_day_volume,
            sevenDayChange: openSeaData.stats?.seven_day_change,
          },
          social: {
            website: openSeaData.collection?.external_url,
            discord: openSeaData.collection?.discord_url,
            twitter: openSeaData.collection?.twitter_username,
            instagram: openSeaData.collection?.instagram_username,
          },
          royalties: {
            sellerFeeBasisPoints: openSeaData.collection?.dev_seller_fee_basis_points,
            royaltyRecipient: openSeaData.collection?.payout_address,
          }
        },
        dataSource: 'Alchemy + OpenSea API',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get collection details: ${error.message}`);
    }
  }

  async getAlchemyCollectionDetails(contractAddress, chain) {
    if (!ALCHEMY_API_KEY) {
      throw new Error('Alchemy API key not configured');
    }

    const chainId = this.getChainId(chain);
    const url = `https://${chainId}.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getContractMetadata`;
    
    const params = new URLSearchParams({
      contractAddress: contractAddress,
    });

    const response = await this.makeRequest(`${url}?${params}`);
    return response.contractMetadata;
  }

  async getOpenSeaCollectionStats(contractAddress) {
    const url = `https://api.opensea.io/api/v1/collection/${contractAddress}/stats`;
    
    const headers = {};
    if (OPENSEA_API_KEY) {
      headers['X-API-KEY'] = OPENSEA_API_KEY;
    }

    try {
      return await this.makeRequest(url, { headers });
    } catch (error) {
      // If OpenSea fails, try getting collection info directly
      const collectionUrl = `https://api.opensea.io/api/v1/asset_contract/${contractAddress}`;
      return await this.makeRequest(collectionUrl, { headers });
    }
  }

  async getNFTMetadata({ contractAddress, tokenId, chain = 'ethereum' }) {
    try {
      if (!ALCHEMY_API_KEY) {
        throw new Error('Alchemy API key not configured');
      }

      const chainId = this.getChainId(chain);
      const url = `https://${chainId}.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getNFTMetadata`;
      
      const params = new URLSearchParams({
        contractAddress: contractAddress,
        tokenId: tokenId,
      });

      const response = await this.makeRequest(`${url}?${params}`);
      
      return {
        timestamp: new Date().toISOString(),
        contractAddress,
        tokenId,
        chain,
        metadata: {
          name: response.title || response.metadata?.name,
          description: response.description || response.metadata?.description,
          image: response.metadata?.image || response.media?.[0]?.gateway,
          attributes: response.metadata?.attributes || [],
          tokenType: response.tokenType,
          tokenUri: response.tokenUri,
          owner: response.ownerships?.[0]?.ownerAddress,
          mintedAt: response.timeLastUpdated,
          contractMetadata: {
            name: response.contract?.name,
            symbol: response.contract?.symbol,
            totalSupply: response.contract?.totalSupply,
          }
        },
        rawMetadata: response.metadata,
        dataSource: 'Alchemy NFT API',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get NFT metadata: ${error.message}`);
    }
  }

  async getNFTTransfers({ contractAddress, tokenId, limit = 50, chain = 'ethereum' }) {
    try {
      if (!ALCHEMY_API_KEY) {
        throw new Error('Alchemy API key not configured');
      }

      const chainId = this.getChainId(chain);
      const url = `https://${chainId}.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getAssetTransfers`;
      
      const requestBody = {
        fromBlock: "0x0",
        toBlock: "latest",
        contractAddresses: [contractAddress],
        category: ["erc721", "erc1155"],
        maxCount: Math.min(limit, 100),
        excludeZeroValue: true,
      };

      if (tokenId) {
        requestBody.tokenId = tokenId;
      }

      const response = await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const transfers = response.transfers.map(transfer => ({
        blockNumber: parseInt(transfer.blockNum, 16),
        transactionHash: transfer.hash,
        from: transfer.from,
        to: transfer.to,
        tokenId: transfer.tokenId,
        value: transfer.value,
        asset: transfer.asset,
        category: transfer.category,
        rawContract: transfer.rawContract,
        metadata: transfer.metadata,
        timestamp: new Date().toISOString() // Note: Alchemy doesn't provide timestamp, would need additional call
      }));

      return {
        timestamp: new Date().toISOString(),
        contractAddress,
        tokenId: tokenId || 'all',
        chain,
        transferCount: transfers.length,
        transfers,
        dataSource: 'Alchemy Transfers API',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get NFT transfers: ${error.message}`);
    }
  }

  async getNFTSales({ contractAddress, tokenId, marketplace, limit = 50, chain = 'ethereum' }) {
    try {
      // Using multiple approaches to get sales data
      const openSeaSales = await this.getOpenSeaSales(contractAddress, tokenId, limit);
      
      return {
        timestamp: new Date().toISOString(),
        contractAddress,
        tokenId: tokenId || 'all',
        chain,
        marketplace: marketplace || 'all',
        salesCount: openSeaSales.length,
        sales: openSeaSales,
        dataSource: 'OpenSea Events API',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get NFT sales: ${error.message}`);
    }
  }

  async getOpenSeaSales(contractAddress, tokenId, limit) {
    const url = 'https://api.opensea.io/api/v1/events';
    
    const params = new URLSearchParams({
      asset_contract_address: contractAddress,
      event_type: 'successful',
      only_opensea: 'false',
      limit: Math.min(limit, 100).toString(),
    });

    if (tokenId) {
      params.append('token_id', tokenId);
    }

    const headers = {};
    if (OPENSEA_API_KEY) {
      headers['X-API-KEY'] = OPENSEA_API_KEY;
    }

    try {
      const response = await this.makeRequest(`${url}?${params}`, { headers });
      
      return response.asset_events.map(event => ({
        eventType: event.event_type,
        auctionType: event.auction_type,
        totalPrice: event.total_price,
        paymentToken: {
          symbol: event.payment_token?.symbol,
          address: event.payment_token?.address,
          decimals: event.payment_token?.decimals,
        },
        seller: event.seller?.address,
        buyer: event.winner_account?.address || event.to_account?.address,
        quantity: event.quantity,
        transactionHash: event.transaction?.transaction_hash,
        blockHash: event.transaction?.block_hash,
        blockNumber: event.transaction?.block_number,
        timestamp: event.transaction?.timestamp,
        asset: {
          tokenId: event.asset?.token_id,
          name: event.asset?.name,
          imageUrl: event.asset?.image_url,
        },
        marketplace: 'OpenSea',
      }));
    } catch (error) {
      console.warn('OpenSea sales API error:', error.message);
      return [];
    }
  }

  async getWalletNFTs({ walletAddress, chain = 'ethereum', limit = 100 }) {
    try {
      if (!ALCHEMY_API_KEY) {
        throw new Error('Alchemy API key not configured');
      }

      const chainId = this.getChainId(chain);
      const url = `https://${chainId}.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getNFTs`;
      
      const params = new URLSearchParams({
        owner: walletAddress,
        pageSize: Math.min(limit, 100).toString(),
        withMetadata: 'true',
      });

      const response = await this.makeRequest(`${url}?${params}`);
      
      const nfts = response.ownedNfts.map(nft => ({
        contractAddress: nft.contract.address,
        tokenId: nft.id.tokenId,
        tokenType: nft.id.tokenMetadata?.tokenType,
        name: nft.title || nft.metadata?.name,
        description: nft.description || nft.metadata?.description,
        image: nft.metadata?.image || nft.media?.[0]?.gateway,
        attributes: nft.metadata?.attributes || [],
        collection: {
          name: nft.contract.name,
          symbol: nft.contract.symbol,
        },
        balance: nft.balance,
        rawMetadata: nft.metadata,
      }));

      return {
        timestamp: new Date().toISOString(),
        walletAddress,
        chain,
        totalNFTs: response.totalCount,
        nftsReturned: nfts.length,
        nfts,
        pageKey: response.pageKey,
        dataSource: 'Alchemy NFT API',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get wallet NFTs: ${error.message}`);
    }
  }

  async getNFTFloorPrice({ contractAddress, marketplace = 'opensea', chain = 'ethereum' }) {
    try {
      if (!ALCHEMY_API_KEY) {
        throw new Error('Alchemy API key not configured');
      }

      const chainId = this.getChainId(chain);
      const url = `https://${chainId}.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getFloorPrice`;
      
      const params = new URLSearchParams({
        contractAddress: contractAddress,
      });

      const response = await this.makeRequest(`${url}?${params}`);
      
      return {
        timestamp: new Date().toISOString(),
        contractAddress,
        chain,
        marketplace,
        floorPrice: {
          openSea: response.openSea,
          looksRare: response.looksRare,
          blur: response.blur,
        },
        dataSource: 'Alchemy Floor Price API',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get floor price: ${error.message}`);
    }
  }

  async searchNFTCollections({ query, limit = 20, chain = 'ethereum' }) {
    try {
      // Using OpenSea search endpoint
      const url = 'https://api.opensea.io/api/v1/collections';
      
      const params = new URLSearchParams({
        limit: Math.min(limit, 50).toString(),
        search: query,
      });

      const headers = {};
      if (OPENSEA_API_KEY) {
        headers['X-API-KEY'] = OPENSEA_API_KEY;
      }

      const response = await this.makeRequest(`${url}?${params}`, { headers });
      
      const collections = response.collections?.map(collection => ({
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        imageUrl: collection.image_url,
        contractAddress: collection.primary_asset_contracts?.[0]?.address,
        totalSupply: collection.stats?.total_supply,
        floorPrice: collection.stats?.floor_price,
        totalVolume: collection.stats?.total_volume,
        numOwners: collection.stats?.num_owners,
        verified: collection.verified,
        externalUrl: collection.external_url,
        discordUrl: collection.discord_url,
        twitterUsername: collection.twitter_username,
        createdDate: collection.created_date,
      })) || [];

      return {
        timestamp: new Date().toISOString(),
        query,
        chain,
        resultCount: collections.length,
        collections,
        dataSource: 'OpenSea Collections API',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to search collections: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("NFT Scanner MCP Server running on stdio");
  }
}

const server = new NFTScannerServer();
server.run().catch(console.error); 