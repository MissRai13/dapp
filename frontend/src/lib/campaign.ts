const CAMPAIGN_METADATA_PREFIX = '__CFDAPP_METADATA__:';

export interface CampaignMetadata {
  description: string;
  imageUrl: string;
}

export const calculateProgress = (raised: number, goal: number) => {
  if (!Number.isFinite(raised) || !Number.isFinite(goal) || goal <= 0) return 0;

  return Math.min((raised / goal) * 100, 100);
};

export const formatEth = (value: number, decimals = 4) => {
  if (!Number.isFinite(value)) return '0';

  return value.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  });
};

export const formatTimeLeft = (deadline: number, now = Date.now()) => {
  const remainingMs = deadline * 1000 - now;

  if (remainingMs <= 0) return 'Expired';

  const minutes = Math.ceil(remainingMs / (1000 * 60));
  if (minutes < 60) return `${minutes} min left`;

  const hours = Math.ceil(remainingMs / (1000 * 60 * 60));
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} left`;

  const days = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  return `${days} day${days === 1 ? '' : 's'} left`;
};

export const serializeCampaignDescription = (description: string, imageUrl: string) => {
  const trimmedDescription = description.trim();
  const trimmedImageUrl = imageUrl.trim();

  if (!trimmedImageUrl) return trimmedDescription;

  return `${CAMPAIGN_METADATA_PREFIX}${JSON.stringify({
    description: trimmedDescription,
    imageUrl: trimmedImageUrl,
  })}`;
};

export const parseCampaignDescription = (value: string): CampaignMetadata => {
  if (!value.startsWith(CAMPAIGN_METADATA_PREFIX)) {
    return {
      description: value,
      imageUrl: '',
    };
  }

  try {
    const metadata = JSON.parse(value.slice(CAMPAIGN_METADATA_PREFIX.length)) as Partial<CampaignMetadata>;

    return {
      description: metadata.description || '',
      imageUrl: metadata.imageUrl || '',
    };
  } catch {
    return {
      description: value,
      imageUrl: '',
    };
  }
};
