type EthereumRequestArguments = {
  method: string;
  params?: unknown[] | Record<string, unknown>;
};

type EthereumEventHandler = (...args: unknown[]) => void;
type EthereumAccountsChangedHandler = (accounts: string[]) => void;
type EthereumChainChangedHandler = (chainId: string) => void;

interface EthereumProvider {
  request<T = unknown>(args: EthereumRequestArguments): Promise<T>;
  on(eventName: 'accountsChanged', handler: EthereumAccountsChangedHandler): void;
  on(eventName: 'chainChanged', handler: EthereumChainChangedHandler): void;
  on(eventName: string, handler: EthereumEventHandler): void;
  removeListener(eventName: 'accountsChanged', handler: EthereumAccountsChangedHandler): void;
  removeListener(eventName: 'chainChanged', handler: EthereumChainChangedHandler): void;
  removeListener(eventName: string, handler: EthereumEventHandler): void;
}

interface Window {
  ethereum?: EthereumProvider;
}
