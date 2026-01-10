import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export const useTrialLimit = () => {
    const [usageCount, setUsageCount] = useState(0);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showTrialWarning, setShowTrialWarning] = useState(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const checkStatus = useCallback(async () => {
        const token = localStorage.getItem('auth_token');
        setIsAuthenticated(!!token);

        try {
            const data = await api.checkUsage(token);
            setUsageCount(data.usage_count);
            // If backend says we are over limit and not unlimited, enforce it
            if (!data.is_unlimited && data.remaining === 0) {
                setUsageCount(2); // Local marker for limit reached
            }
        } catch (err) {
            console.error("Failed to sync usage:", err);
        }
    }, []);

    useEffect(() => {
        checkStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkStatus]);

    const incrementLocalUsage = () => {
        if (!isAuthenticated) {
            setUsageCount(prev => prev + 1);
        }
    };

    return {
        usageCount,
        isAuthenticated,
        showTrialWarning,
        setShowTrialWarning,
        checkStatus,
        incrementLocalUsage,
        setUsageCount // Exposed for forcing limit reached state
    };
};
