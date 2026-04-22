import { ethers, Contract, Signer, BrowserProvider, JsonRpcProvider } from 'ethers';
import CROWDFUNDING_ABI from './abis/Crowdfunding.json';
import PROJECT_ABI from './abis/Project.json';

// Contract address from environment
const CROWDFUNDING_ADDRESS = process.env.NEXT_PUBLIC_CROWDFUNDING_ADDRESS;
const DEPLOYED_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_DEPLOYED_CHAIN_ID || '31337');
const READ_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

let browserProvider: BrowserProvider | null = null;
let readRpcProvider: JsonRpcProvider | null = null;
let crowdfundingDeploymentCheck:
  | {
      chainId: string;
      address: string;
      isDeployed: boolean;
    }
  | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getReadRpcConfigError = () => {
  if (!READ_RPC_URL) return null;

  try {
    if (READ_RPC_URL.startsWith('/')) {
      return null;
    }

    const url = new URL(READ_RPC_URL);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const loopbackHosts = new Set(['127.0.0.1', 'localhost', '0.0.0.0']);
    const browserHostname = typeof window === 'undefined' ? null : window.location.hostname;
    const isBrowserOnLoopback =
      browserHostname === null || loopbackHosts.has(browserHostname) || browserHostname.endsWith('.localhost');

    if (loopbackHosts.has(url.hostname) && !isBrowserOnLoopback) {
      return [
        'NEXT_PUBLIC_RPC_URL points to localhost, but this app is running in a remote browser environment.',
        'Use the forwarded Hardhat port URL instead of http://127.0.0.1:8545.',
      ].join(' ');
    }

    if (url.hostname.includes('alchemy.com')) {
      const v2Index = pathParts.indexOf('v2');
      const apiKey = v2Index >= 0 ? pathParts[v2Index + 1] : null;

      if (!apiKey || apiKey.length < 12) {
        return 'NEXT_PUBLIC_RPC_URL is an Alchemy URL without an API key. Use the full https://.../v2/YOUR_KEY endpoint.';
      }
    }
  } catch {
    return 'NEXT_PUBLIC_RPC_URL is not a valid URL.';
  }

  return null;
};

const READ_RPC_CONFIG_ERROR = getReadRpcConfigError();

if (!CROWDFUNDING_ADDRESS) {
  console.error('NEXT_PUBLIC_CROWDFUNDING_ADDRESS not set in .env.local');
}

export { CROWDFUNDING_ADDRESS, DEPLOYED_CHAIN_ID, CROWDFUNDING_ABI, PROJECT_ABI };

const getChainHexId = (chainId: number) => `0x${chainId.toString(16)}`;

const getConfiguredRpcUrl = () => {
  if (!READ_RPC_URL) {
    return DEPLOYED_CHAIN_ID === 31337 ? 'http://127.0.0.1:8545' : null;
  }

  if (typeof window !== 'undefined' && READ_RPC_URL.startsWith('/')) {
    return new URL(READ_RPC_URL, window.location.origin).toString();
  }

  return READ_RPC_URL;
};

const getNetworkDisplayName = () => {
  if (DEPLOYED_CHAIN_ID === 31337) return 'Hardhat Local';
  if (DEPLOYED_CHAIN_ID === 11155111) return 'Sepolia';
  if (DEPLOYED_CHAIN_ID === 1) return 'Ethereum Mainnet';

  return `Chain ${DEPLOYED_CHAIN_ID}`;
};

const getBlockExplorerUrls = () => {
  if (DEPLOYED_CHAIN_ID === 11155111) return ['https://sepolia.etherscan.io'];
  if (DEPLOYED_CHAIN_ID === 1) return ['https://etherscan.io'];

  return undefined;
};

const getEthereumErrorCode = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as { code?: number | string }).code;
  }

  return undefined;
};

const getConfiguredChainParameters = () => {
  if (READ_RPC_CONFIG_ERROR) {
    throw new Error(READ_RPC_CONFIG_ERROR);
  }

  const rpcUrl = getConfiguredRpcUrl();

  if (!rpcUrl) {
    throw new Error(`Add ${getNetworkDisplayName()} to your wallet, then reconnect.`);
  }

  const blockExplorerUrls = getBlockExplorerUrls();

  return {
    chainId: getChainHexId(DEPLOYED_CHAIN_ID),
    chainName: getNetworkDisplayName(),
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [rpcUrl],
    ...(blockExplorerUrls ? { blockExplorerUrls } : {}),
  };
};

export const resetWalletProvider = () => {
  browserProvider = null;
};

/**
 * Get the wallet-backed ethers provider.
 */
export const getProvider = (): BrowserProvider | null => {
  if (typeof window === 'undefined') return null;
  if (!window.ethereum) return null;

  browserProvider ??= new BrowserProvider(window.ethereum);
  return browserProvider;
};

/**
 * Get a stable read-only provider.
 *
 * NEXT_PUBLIC_RPC_URL is preferred for reads and tx polling so the app does not
 * overload the wallet's injected RPC endpoint. If it is not configured, the
 * wallet provider is used as a fallback.
 */
export const getReadOnlyProvider = () => {
  if (READ_RPC_URL && !READ_RPC_CONFIG_ERROR) {
    if (!readRpcProvider) {
      readRpcProvider = new JsonRpcProvider(READ_RPC_URL, DEPLOYED_CHAIN_ID, {
        staticNetwork: true,
      });
      readRpcProvider.pollingInterval = 6_000;
    }

    return readRpcProvider;
  }

  return getProvider();
};

export const getReadProviderConfigError = () => READ_RPC_CONFIG_ERROR;

export const switchToConfiguredNetwork = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Please install MetaMask or another Web3 wallet');
  }

  const chainId = getChainHexId(DEPLOYED_CHAIN_ID);
  const currentChainId = await window.ethereum.request<string>({ method: 'eth_chainId' });

  if (currentChainId?.toLowerCase() === chainId.toLowerCase()) {
    if (DEPLOYED_CHAIN_ID === 31337 && READ_RPC_URL?.startsWith('/')) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [getConfiguredChainParameters()],
      });
      resetWalletProvider();
    }

    return;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
    resetWalletProvider();
    return;
  } catch (switchError) {
    const errorCode = getEthereumErrorCode(switchError);

    if (errorCode !== 4902 && errorCode !== '4902') {
      throw switchError;
    }
  }

  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [getConfiguredChainParameters()],
  });

  resetWalletProvider();
};

export const getActiveReadChainId = async () => {
  const provider = getReadOnlyProvider();
  if (!provider) return null;

  const network = await provider.getNetwork();
  return Number(network.chainId);
};

export const hasCodeAtAddress = async (address: string) => {
  const provider = getReadOnlyProvider();
  if (!provider) return false;

  const code = await provider.getCode(address);
  return code !== '0x';
};

export const assertCrowdfundingContractDeployed = async () => {
  if (!CROWDFUNDING_ADDRESS) {
    throw new Error('Contract not available');
  }

  const chainId = await getActiveReadChainId();
  const cacheKey = {
    chainId: String(chainId ?? 'unknown'),
    address: CROWDFUNDING_ADDRESS.toLowerCase(),
  };

  if (
    crowdfundingDeploymentCheck &&
    crowdfundingDeploymentCheck.chainId === cacheKey.chainId &&
    crowdfundingDeploymentCheck.address === cacheKey.address
  ) {
    if (!crowdfundingDeploymentCheck.isDeployed) {
      throw new Error('Crowdfunding contract is not deployed on the configured network');
    }

    return;
  }

  const isDeployed = await hasCodeAtAddress(CROWDFUNDING_ADDRESS);
  crowdfundingDeploymentCheck = {
    ...cacheKey,
    isDeployed,
  };

  if (!isDeployed) {
    throw new Error('Crowdfunding contract is not deployed on the configured network');
  }
};

/**
 * Get the signer (user's wallet)
 */
export const getSigner = async (): Promise<Signer | null> => {
  const provider = getProvider();
  if (!provider) return null;
  try {
    return await provider.getSigner();
  } catch (error) {
    console.error('Error getting signer:', error);
    return null;
  }
};

/**
 * Get Crowdfunding contract instance
 */
export const getCrowdfundingContract = async (readOnly = false) => {
  if (!CROWDFUNDING_ADDRESS) return null;

  if (readOnly) {
    const provider = getReadOnlyProvider();
    if (!provider) return null;
    return new Contract(CROWDFUNDING_ADDRESS, CROWDFUNDING_ABI, provider);
  } else {
    const signer = await getSigner();
    if (!signer) return null;
    return new Contract(CROWDFUNDING_ADDRESS, CROWDFUNDING_ABI, signer);
  }
};

/**
 * Get Project contract instance
 */
export const getProjectContract = async (projectAddress: string, readOnly = false) => {
  if (readOnly) {
    const provider = getReadOnlyProvider();
    if (!provider) return null;
    return new Contract(projectAddress, PROJECT_ABI, provider);
  } else {
    const signer = await getSigner();
    if (!signer) return null;
    return new Contract(projectAddress, PROJECT_ABI, signer);
  }
};

/**
 * Wait for a transaction receipt without relying on eth_blockNumber polling.
 */
export const waitForTransactionReceipt = async (transactionHash: string) => {
  const primaryProvider = getReadOnlyProvider();
  const fallbackProvider = getProvider();
  const providers = primaryProvider ? [primaryProvider] : [];

  if (fallbackProvider && fallbackProvider !== primaryProvider) {
    providers.push(fallbackProvider);
  }

  if (providers.length === 0) throw new Error('Provider not available');

  const startedAt = Date.now();
  const timeoutMs = 3 * 60 * 1000;

  while (Date.now() - startedAt < timeoutMs) {
    for (const provider of providers) {
      try {
        const receipt = await provider.getTransactionReceipt(transactionHash);
        if (receipt) return receipt;
      } catch (error) {
        if (!isRecoverableRpcError(error)) {
          throw error;
        }
      }
    }

    await sleep(6_000);
  }

  throw new Error('Transaction was not confirmed in time. Please refresh the dashboard in a moment.');
};

/**
 * Turn low-level provider failures into messages a user can act on.
 */
export const isRateLimitError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  const normalized = message.toLowerCase();

  return (
    normalized.includes('rpc endpoint returned too many errors') ||
    normalized.includes('too many requests') ||
    normalized.includes('rate limit') ||
    normalized.includes('429')
  );
};

export const isRpcAuthError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  const normalized = message.toLowerCase();

  return (
    normalized.includes('must be authenticated') ||
    normalized.includes('unauthorized') ||
    normalized.includes('forbidden') ||
    normalized.includes('invalid api key') ||
    normalized.includes('missing api key') ||
    normalized.includes('401') ||
    normalized.includes('403')
  );
};

export const isRecoverableRpcError = (error: unknown) => {
  return isRateLimitError(error) || isRpcAuthError(error);
};

/**
 * Turn low-level provider failures into messages a user can act on.
 */
export const getReadableWeb3Error = (error: unknown, fallback: string) => {
  const message = error instanceof Error ? error.message : String(error || fallback);
  const normalized = message.toLowerCase();

  if (isRpcAuthError(error)) {
    return 'The configured NEXT_PUBLIC_RPC_URL is not authenticated. Use the full dedicated RPC URL, including its API key.';
  }

  if (isRateLimitError(error)) {
    return [
      'The RPC endpoint is temporarily rate-limited.',
      'Wait a minute and try again. If this keeps happening, use a dedicated NEXT_PUBLIC_RPC_URL for this network.',
    ].join(' ');
  }

  if (normalized.includes('contract not available')) {
    return 'Contract not available. Check NEXT_PUBLIC_CROWDFUNDING_ADDRESS and your selected wallet network.';
  }

  if (
    normalized.includes('not deployed on the configured network') ||
    normalized.includes('could not decode result data') ||
    normalized.includes('bad_data')
  ) {
    return [
      'No Crowdfunding contract was found at NEXT_PUBLIC_CROWDFUNDING_ADDRESS on the configured network.',
      'Use a contract address deployed to this chain, or switch NEXT_PUBLIC_DEPLOYED_CHAIN_ID/RPC back to the network where that address was deployed.',
    ].join(' ');
  }

  return message || fallback;
};

/**
 * Convert Wei to Ether
 */
export const weiToEth = (wei: string | ethers.BigNumberish) => {
  return parseFloat(ethers.formatEther(wei));
};

/**
 * Convert Ether to Wei
 */
export const ethToWei = (eth: string | number) => {
  return ethers.parseEther(eth.toString());
};

/**
 * Format address to short format (0x1234...5678)
 */
export const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Check if current network matches the deployed network
 */
export const isCorrectNetwork = async (): Promise<boolean> => {
  try {
    const provider = getProvider();
    if (!provider) return false;
    const network = await provider.getNetwork();
    return network.chainId === BigInt(DEPLOYED_CHAIN_ID);
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

/**
 * Get current account
 */
export const getCurrentAccount = async (): Promise<string | null> => {
  try {
    const signer = await getSigner();
    if (!signer) return null;
    return signer.getAddress();
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};
