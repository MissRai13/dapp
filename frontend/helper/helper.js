
import moment from "moment";
import web3 from "web3";
import _ from 'lodash';

export const weiToEther = (num) =>{
    return web3.utils.fromWei(num, 'ether')
}

export const etherToWei = (num) => {
  const weiBigNumber = web3.utils.toWei(num, 'ether');
  const wei = weiBigNumber.toString();
  return wei
}

export const unixToDate = (unixDate) =>{
  return moment.unix(Number(unixDate)).format("DD/MM/YYYY");
}

export const state = ["Fundraising","Expired","Successful"];

export const projectDataFormatter = (data,contractAddress) =>{
  const goalAmountInEther = Number(weiToEther(data.goalAmount));
  const currentAmountInEther = Number(weiToEther(data.currentAmount));
  const formattedData = {
    address:contractAddress,
    creator:data?.projectStarter,
    contractBalance: data.balance?weiToEther(data.balance):0,
    title:data.title,
    description:data.desc,
    minContribution:weiToEther(data.minContribution),
    goalAmount:weiToEther(data.goalAmount),
    currentAmount:weiToEther(data.currentAmount),
    state:state[Number(data.currentState)],
    deadline:unixToDate(Number(data.projectDeadline)),
    progress: goalAmountInEther > 0 ? Math.min(100,Math.round((currentAmountInEther/goalAmountInEther)*100)) : 0
  }
  return formattedData;
}


const formatProjectContributions = (contributions) =>{
  const formattedData = contributions.map(data=>{
    return {
      projectAddress:data.returnValues.projectAddress,
      contributor:data.returnValues.contributor,
      amount:Number(weiToEther(data.returnValues.contributedAmount))
    }
  })
  return formattedData;
}

export const groupContributionByProject = (contributions) => {
  const contributionList = formatProjectContributions(contributions);
  //const contributionGroupByProject = _.map(_.groupBy(contributionList, 'projectAddress'), (o,projectAddress,address) => { return {projectAddress:projectAddress, contributor: address,amount: _.sumBy(o,'amount') }})
  return contributionList;
}

const formatContribution = (contributions) =>{
  const formattedData = contributions.map(data=>{
    return {
      contributor:data.returnValues.contributor,
      amount:Number(weiToEther(data.returnValues.amount))
    }
  })
  return formattedData;
}

export const groupContributors = (contributions) => {
  const contributorList = formatContribution(contributions);
  const contributorGroup = _.map(_.groupBy(contributorList, 'contributor'), (o,address) => { return { contributor: address,amount: _.sumBy(o,'amount') }})
  return contributorGroup;
}

export const withdrawRequestDataFormatter = (data) =>{
  return{
     requestId:data.requestId,
     totalVote:data.noOfVotes,
     amount:weiToEther(data.amount),
     status:data.isCompleted?"Completed":"Pending",
     desc:data.description,
     reciptant:data.reciptent
    }
}

export const getEthereumProvider = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const { ethereum } = window;
  if (!ethereum) {
    return null;
  }

  if (ethereum.providers?.length) {
    return ethereum.providers.find((provider) => provider.isMetaMask) || ethereum.providers[0];
  }

  return ethereum;
};

const getConfiguredChainId = () => {
  const chainId = Number(process.env.NEXT_PUBLIC_DEPLOYED_CHAIN_ID || 31337);
  return Number.isFinite(chainId) ? chainId : null;
};

const toHexChainId = (chainId) => `0x${Number(chainId).toString(16)}`;

const getSepoliaRpcUrls = () => {
  const rawUrls = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URLS || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "";
  const configuredUrls = rawUrls
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  if (configuredUrls.length > 0) {
    return configuredUrls;
  }

  return ["https://rpc.sepolia.org", "https://ethereum-sepolia-rpc.publicnode.com"];
};

const getChainConfig = (chainId) => {
  if (chainId === 31337) {
    return {
      chainId: toHexChainId(chainId),
      chainName: "Hardhat Localhost",
      nativeCurrency: {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: ["http://127.0.0.1:8545"],
    };
  }

  if (chainId === 11155111) {
    return {
      chainId: toHexChainId(chainId),
      chainName: "Sepolia",
      nativeCurrency: {
        name: "Sepolia Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: getSepoliaRpcUrls(),
      blockExplorerUrls: ["https://sepolia.etherscan.io"],
    };
  }

  return null;
};

const ensureConfiguredNetwork = async (provider) => {
  const configuredChainId = getConfiguredChainId();
  if (!configuredChainId) {
    return;
  }

  const targetChainId = toHexChainId(configuredChainId);
  const currentChainId = await provider.request({ method: "eth_chainId" });
  if (currentChainId?.toLowerCase() === targetChainId.toLowerCase()) {
    return;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetChainId }],
    });
  } catch (error) {
    const chainConfig = getChainConfig(configuredChainId);
    if (Number(error?.code) === 4902 && chainConfig) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [chainConfig],
      });
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetChainId }],
      });
      return;
    }

    throw error;
  }
};

export const connectWithWallet = async (onSuccess) => {
  const provider = getEthereumProvider();
  if (!provider) {
    if (typeof window !== "undefined") {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
    return [];
  }

  try {
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    await ensureConfiguredNetwork(provider);
    await onSuccess?.(accounts);
    return accounts;
  } catch (error) {
    const errorCode = Number(error?.code);
    const message =
      errorCode === 4001
        ? "MetaMask connection was rejected."
        : errorCode === -32002
          ? "MetaMask already has a pending request. Open MetaMask to continue."
          : error?.message || "Unable to connect MetaMask.";

    window.alert(message);
    return [];
  }
};

export const chainOrAccountChangedHandler = () => {
  // reload the page to avoid any errors with chain or account change.
  window.location.reload();
}
