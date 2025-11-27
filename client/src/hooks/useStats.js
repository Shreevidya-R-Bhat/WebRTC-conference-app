import { useState, useEffect, useRef } from 'react';
import { parseStats } from '../utils/statsParser';

export function useStats(peerConnection, enabled = true) {
  const [stats, setStats] = useState(null);
  const [statsHistory, setStatsHistory] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled || !peerConnection) return;

    const collectStats = async () => {
      try {
        const rawStats = await peerConnection.getStats();
        const parsed = parseStats(rawStats);
        
        setStats(parsed);
        setStatsHistory(prev => [...prev, parsed].slice(-100)); // Keep last 100
      } catch (error) {
        console.error('Error collecting stats:', error);
      }
    };

    // Collect stats every 2 seconds
    intervalRef.current = setInterval(collectStats, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [peerConnection, enabled]);

  const exportStats = () => {
    return {
      json: JSON.stringify(statsHistory, null, 2),
      history: statsHistory
    };
  };

  return { stats, statsHistory, exportStats };
}
