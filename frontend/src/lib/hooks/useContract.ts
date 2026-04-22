import { useState, useCallback } from 'react';
import {
  assertCrowdfundingContractDeployed,
  getCrowdfundingContract,
  getProjectContract,
  getReadableWeb3Error,
  isRateLimitError,
  ethToWei,
  weiToEth,
  waitForTransactionReceipt,
} from '@/lib/web3';
import { parseCampaignDescription } from '@/lib/campaign';

export interface ProjectData {
  address: string;
  creator: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  minContribution: number;
  deadline: number;
  contributors: number;
  state: number; // 0: Fundraising, 1: Expired, 2: Successful
  imageUrl: string;
}

const toNumber = (value: bigint | string | number) => {
  return typeof value === 'bigint' ? Number(value) : Number(value);
};

export const useContract = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new crowdfunding project
   */
  const createProject = useCallback(
    async (
      title: string,
      description: string,
      minContribution: number,
      targetAmount: number,
      deadlineDays: number
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        await assertCrowdfundingContractDeployed();
        const contract = await getCrowdfundingContract(false);
        if (!contract) throw new Error('Contract not available');

        const deadline = Math.floor(Date.now() / 1000) + deadlineDays * 24 * 60 * 60;
        const minContributionWei = ethToWei(minContribution);
        const targetAmountWei = ethToWei(targetAmount);

        const tx = await contract.createProject(
          minContributionWei,
          deadline,
          targetAmountWei,
          title,
          description
        );

        const receipt = await waitForTransactionReceipt(tx.hash);
        setIsLoading(false);
        return receipt;
      } catch (err: unknown) {
        const errorMsg = getReadableWeb3Error(err, 'Failed to create fundraiser');
        setError(errorMsg);
        setIsLoading(false);
        throw new Error(errorMsg);
      }
    },
    []
  );

  /**
   * Fetch all projects
   */
  const fetchAllProjects = useCallback(async (): Promise<ProjectData[]> => {
    setIsLoading(true);
    setError(null);
    try {
      await assertCrowdfundingContractDeployed();
      const contract = await getCrowdfundingContract(true);
      if (!contract) throw new Error('Contract not available');

      const projectAddresses = await contract.returnAllProjects();
      const projects: ProjectData[] = [];

      for (const address of projectAddresses) {
        try {
          const projectContract = await getProjectContract(address, true);
          if (!projectContract) continue;

          const [
            creator,
            minContrib,
            deadline,
            goal,
            ,
            raised,
            title,
            description,
            state,
          ] = await projectContract.getProjectDetails();
          const contributors = await projectContract.noOfContributers();

          const metadata = parseCampaignDescription(description);

          projects.push({
            address,
            creator,
            title,
            description: metadata.description,
            goal: weiToEth(goal),
            raised: weiToEth(raised),
            minContribution: weiToEth(minContrib),
            deadline: toNumber(deadline),
            contributors: toNumber(contributors),
            state: toNumber(state),
            imageUrl: metadata.imageUrl,
          });
        } catch (projectError) {
          if (isRateLimitError(projectError)) {
            throw projectError;
          }

          console.error(`Error fetching project ${address}:`, projectError);
        }
      }

      setIsLoading(false);
      return projects;
    } catch (err: unknown) {
      const errorMsg = getReadableWeb3Error(err, 'Failed to fetch fundraisers');
      setError(errorMsg);
      setIsLoading(false);
      return [];
    }
  }, []);

  /**
   * Contribute to a project
   */
  const contributeToProject = useCallback(async (projectAddress: string, amountEth: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await assertCrowdfundingContractDeployed();
      const contract = await getCrowdfundingContract(false);
      if (!contract) throw new Error('Contract not available');

      const amountWei = ethToWei(amountEth);
      const tx = await contract.contribute(projectAddress, { value: amountWei });
      const receipt = await waitForTransactionReceipt(tx.hash);

      setIsLoading(false);
      return receipt;
    } catch (err: unknown) {
      const errorMsg = getReadableWeb3Error(err, 'Failed to send donation');
      setError(errorMsg);
      setIsLoading(false);
      throw new Error(errorMsg);
    }
  }, []);

  /**
   * Get user's contribution to a specific project
   */
  const getUserContribution = useCallback(async (projectAddress: string, userAddress: string) => {
    try {
      const projectContract = await getProjectContract(projectAddress, true);
      if (!projectContract) return 0;

      const contribution = await projectContract.contributiors(userAddress);
      return weiToEth(contribution);
    } catch (error) {
      console.error('Error fetching user contribution:', error);
      return 0;
    }
  }, []);

  /**
   * Calculate total stats
   */
  const calculateStats = useCallback(async (projects: ProjectData[], userAddress: string | null) => {
    let totalFunded = 0;
    let totalContributions = 0;
    let activeProjects = 0;

    for (const project of projects) {
      // Count active projects (state 0 = Fundraising)
      if (project.state === 0 && project.deadline > Math.floor(Date.now() / 1000)) {
        activeProjects++;
      }

      // Sum total funded
      totalFunded += project.raised;

      // Get user's total contributions
      if (userAddress) {
        const userContrib = await getUserContribution(project.address, userAddress);
        totalContributions += userContrib;
      }
    }

    return {
      activeProjects,
      totalFunded,
      totalContributions,
    };
  }, [getUserContribution]);

  return {
    isLoading,
    error,
    createProject,
    fetchAllProjects,
    contributeToProject,
    getUserContribution,
    calculateStats,
  };
};
