import { useState, useEffect } from 'react';

export function useFetch(url, options) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(url, options);
                if (!response.ok) throw new Error(`Error: ${response.status}`);
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (url) fetchData();
    }, [url, options]);

    return { data, isLoading, error };
}
