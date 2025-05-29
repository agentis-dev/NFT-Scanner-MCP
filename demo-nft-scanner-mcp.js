#!/usr/bin/env node

/**
 * NFT Scanner MCP Demo Script
 * Demonstrates real-time NFT blockchain data functionality
 */

import { spawn } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

class NFTScannerDemo {
  constructor() {
    this.server = null;
  }

  async startServer() {
    console.log('🚀 Starting NFT Scanner MCP Server...\n');
    
    this.server = spawn('node', ['nft-scanner-mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.server.stderr.on('data', (data) => {
      console.log('Server:', data.toString().trim());
    });

    // Wait for server to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        id: Math.floor(Math.random() * 1000),
        method,
        params
      };

      let response = '';
      
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 30000);

      this.server.stdout.once('data', (data) => {
        clearTimeout(timeout);
        try {
          response += data.toString();
          const result = JSON.parse(response);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.server.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async runDemo() {
    try {
      await this.startServer();
      
      console.log('🎯 NFT Scanner MCP Demo - Real-time Blockchain Data\n');
      console.log('=' * 60 + '\n');

      // Demo 1: Get available tools
      console.log('📋 Available NFT Tools:');
      const tools = await this.sendRequest('tools/list');
      if (tools.result) {
        tools.result.tools.forEach((tool, index) => {
          console.log(`${index + 1}. ${tool.name}: ${tool.description}`);
        });
      }
      console.log('\n');

      // Demo 2: Get BAYC Collection Details
      console.log('🐒 Getting Bored Ape Yacht Club Collection Details...');
      const baycDetails = await this.sendRequest('tools/call', {
        name: 'getNFTCollectionDetails',
        arguments: {
          contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
          chain: 'ethereum'
        }
      });
      
      if (baycDetails.result?.content?.[0]?.text) {
        const data = JSON.parse(baycDetails.result.content[0].text);
        console.log(`Collection: ${data.collectionDetails.name}`);
        console.log(`Total Supply: ${data.collectionDetails.totalSupply}`);
        console.log(`Floor Price: ${data.collectionDetails.marketStats.floorPrice} ETH`);
        console.log(`Total Volume: ${data.collectionDetails.marketStats.totalVolume} ETH`);
        console.log(`Owners: ${data.collectionDetails.marketStats.numOwners}`);
        console.log(`7-Day Volume: ${data.collectionDetails.marketStats.sevenDayVolume} ETH`);
      }
      console.log('\n');

      // Demo 3: Get CryptoPunks Floor Price
      console.log('👾 Getting CryptoPunks Floor Price...');
      const punksFloor = await this.sendRequest('tools/call', {
        name: 'getNFTFloorPrice',
        arguments: {
          contractAddress: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
          chain: 'ethereum'
        }
      });
      
      if (punksFloor.result?.content?.[0]?.text) {
        const data = JSON.parse(punksFloor.result.content[0].text);
        console.log(`CryptoPunks Floor Price:`);
        console.log(`- OpenSea: ${data.floorPrice.openSea?.floorPrice || 'N/A'} ${data.floorPrice.openSea?.priceCurrency || ''}`);
        console.log(`- LooksRare: ${data.floorPrice.looksRare?.floorPrice || 'N/A'} ${data.floorPrice.looksRare?.priceCurrency || ''}`);
      }
      console.log('\n');

      // Demo 4: Get NFT Metadata for specific token
      console.log('🖼️  Getting NFT Metadata for BAYC #1000...');
      const nftMetadata = await this.sendRequest('tools/call', {
        name: 'getNFTMetadata',
        arguments: {
          contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
          tokenId: '1000',
          chain: 'ethereum'
        }
      });
      
      if (nftMetadata.result?.content?.[0]?.text) {
        const data = JSON.parse(nftMetadata.result.content[0].text);
        console.log(`Token: ${data.metadata.name}`);
        console.log(`Description: ${data.metadata.description}`);
        console.log(`Owner: ${data.metadata.owner}`);
        console.log(`Attributes: ${data.metadata.attributes?.length || 0} traits`);
        if (data.metadata.attributes?.slice(0, 3)) {
          data.metadata.attributes.slice(0, 3).forEach(attr => {
            console.log(`  - ${attr.trait_type}: ${attr.value}`);
          });
        }
      }
      console.log('\n');

      // Demo 5: Search for NFT Collections
      console.log('🔍 Searching for "Azuki" NFT Collections...');
      const searchResults = await this.sendRequest('tools/call', {
        name: 'searchNFTCollections',
        arguments: {
          query: 'Azuki',
          limit: 3,
          chain: 'ethereum'
        }
      });
      
      if (searchResults.result?.content?.[0]?.text) {
        const data = JSON.parse(searchResults.result.content[0].text);
        console.log(`Found ${data.resultCount} collections:`);
        data.collections.slice(0, 3).forEach((collection, index) => {
          console.log(`${index + 1}. ${collection.name}`);
          console.log(`   Contract: ${collection.contractAddress}`);
          console.log(`   Floor: ${collection.floorPrice} ETH`);
          console.log(`   Total Supply: ${collection.totalSupply}`);
        });
      }
      console.log('\n');

      // Demo 6: Get Recent NFT Transfers
      console.log('🔄 Getting Recent BAYC Transfers...');
      const transfers = await this.sendRequest('tools/call', {
        name: 'getNFTTransfers',
        arguments: {
          contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
          limit: 5,
          chain: 'ethereum'
        }
      });
      
      if (transfers.result?.content?.[0]?.text) {
        const data = JSON.parse(transfers.result.content[0].text);
        console.log(`Recent ${data.transferCount} transfers:`);
        data.transfers.slice(0, 3).forEach((transfer, index) => {
          console.log(`${index + 1}. Token #${transfer.tokenId}`);
          console.log(`   From: ${transfer.from}`);
          console.log(`   To: ${transfer.to}`);
          console.log(`   Block: ${transfer.blockNumber}`);
        });
      }
      console.log('\n');

      // Demo 7: Get Wallet NFTs
      console.log('👛 Getting NFTs for a sample wallet...');
      const walletNFTs = await this.sendRequest('tools/call', {
        name: 'getWalletNFTs',
        arguments: {
          walletAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
          chain: 'ethereum',
          limit: 5
        }
      });
      
      if (walletNFTs.result?.content?.[0]?.text) {
        const data = JSON.parse(walletNFTs.result.content[0].text);
        console.log(`Wallet has ${data.totalNFTs} total NFTs (showing ${data.nftsReturned}):`);
        data.nfts.slice(0, 3).forEach((nft, index) => {
          console.log(`${index + 1}. ${nft.name || `Token #${nft.tokenId}`}`);
          console.log(`   Collection: ${nft.collection.name}`);
          console.log(`   Contract: ${nft.contractAddress}`);
        });
      }
      console.log('\n');

      console.log('✅ Demo completed successfully!');
      console.log('\n🌟 Key Features Demonstrated:');
      console.log('- Real-time NFT collection data and statistics');
      console.log('- Live floor prices from multiple marketplaces');
      console.log('- NFT metadata and ownership tracking');
      console.log('- Blockchain transfer history');
      console.log('- Cross-marketplace data aggregation');
      console.log('- Multi-chain support (Ethereum, Polygon, Arbitrum, Optimism)');
      console.log('- Wallet portfolio analysis');
      console.log('- NFT collection search functionality');
      
      console.log('\n📊 Data Sources Used:');
      console.log('- Alchemy NFT API (Primary blockchain data)');
      console.log('- OpenSea API (Marketplace data and statistics)');
      console.log('- Real-time on-chain transaction data');
      
    } catch (error) {
      console.error('❌ Demo error:', error.message);
    } finally {
      if (this.server) {
        this.server.kill();
      }
    }
  }
}

// Run the demo
const demo = new NFTScannerDemo();
demo.runDemo().catch(console.error); 