'use client';

import { useEffect, useState } from 'react';
import { formatTimeLeft } from '@/lib/campaign';

interface CountdownTimerProps {
  deadline: number;
}

export default function CountdownTimer({ deadline }: CountdownTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 30 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const label = formatTimeLeft(deadline, now);
  const isExpired = label === 'Expired';

  return (
    <span className={isExpired ? 'text-rose-200' : 'text-emerald-200'}>
      {label}
    </span>
  );
}
