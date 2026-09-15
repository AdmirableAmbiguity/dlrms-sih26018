import { useEffect, useState } from 'react';
import { pollDocumentStatus } from '../lib/api';

export const useDocumentPoll = (docId: string | null, intervalMs: number = 2000) => {
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docId) return;

    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const res = await pollDocumentStatus(docId);
        setStatus(res.data);
        
        if (!['approved', 'rejected', 'needs_review'].includes(res.data.status)) {
          timeoutId = setTimeout(poll, intervalMs);
        }
      } catch (err: any) {
        setError(err);
      }
    };

    poll();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [docId, intervalMs]);

  return { status, error };
};
