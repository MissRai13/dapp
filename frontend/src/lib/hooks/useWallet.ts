import { useState, useEffect, useCallback } from 'react';
import { isCorrectNetwork, resetWalletProvider, switchToConfiguredNetwork } from '@/lib/web3';

const getWalletErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  const normalized = message.toLowerCase();

  if (normalized.includes('user rejected') || normalized.includes('user denied')) {
    return 'Wallet connection was cancelled.';
  }

  if (normalized.includes('already pending')) {
    return 'A wallet request is already open. Check your wallet extension.';
  }

  if (message) return message;

  return 'Failed to connect wallet';
};

export const useWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNet, setIsCorrectNet] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkWalletConnection = useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) return;

      const accounts = await window.ethereum.request<string[]>({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setIsConnected(true);
        setAccount(accounts[0]);
        setError(null);
      } else {
        setIsConnected(false);
        setAccount(null);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  }, []);

  const checkNetwork = useCallback(async () => {
    const isCorrect = await isCorrectNetwork();
    setIsCorrectNet(isCorrect);
  }, []);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length > 0) {
      setIsConnected(true);
      setAccount(accounts[0]);
      setError(null);
    } else {
      setIsConnected(false);
      setAccount(null);
    }
  }, []);

  // Check wallet connection on mount
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void checkWalletConnection();
      void checkNetwork();
    }, 0);

    // Listen for account changes
    const ethereum = typeof window !== 'undefined' ? window.ethereum : undefined;

    if (ethereum) {
      const handleChainChanged = () => {
        resetWalletProvider();
        void checkNetwork();
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.clearTimeout(timeoutId);
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }

    return () => window.clearTimeout(timeoutId);
  }, [checkNetwork, checkWalletConnection, handleAccountsChanged]);

  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        setError('Please install MetaMask or another Web3 wallet');
        return;
      }

      const accounts = await window.ethereum.request<string[]>({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        await switchToConfiguredNetwork();
        setIsConnected(true);
        setAccount(accounts[0]);
        await checkNetwork();
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setIsConnected(false);
      setAccount(null);
      setError(getWalletErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [checkNetwork]);

  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setAccount(null);
    setError(null);
  }, []);

  return {
    account,
    isConnected,
    isCorrectNet,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
  };
};
