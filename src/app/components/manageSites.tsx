import { useState, useEffect } from 'react';

interface SiteEntry {
    sitename: string;
    sitefullname: string;
}

interface IPEntry {
    ipaddress: string;
    sitename?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://itmanagement:8070';

const manageSitesDB = () => {
    const [siteData, setSiteData] = useState<SiteEntry[]>([]);
    const [ipData, setIpData] = useState<IPEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setError(null);
        setLoading(true);
        try {
            const [siteResponse, ipResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/site`),
                fetch(`${API_BASE_URL}/api/assigned`)
            ]);

            if (!siteResponse.ok || !ipResponse.ok) {
                throw new Error(`HTTP error! status: ${siteResponse.status}, ${ipResponse.status}`);
            }

            const [siteResult, ipResult] = await Promise.all([
                siteResponse.json(),
                ipResponse.json()
            ]);

            setSiteData(siteResult);
            setIpData(ipResult);
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error));
        } finally {
            setLoading(false);
        }
    };

    const updateSite = async (sitename: string, sitefullname: string): Promise<SiteEntry> => {
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/site`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sitename, sitefullname }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Server response:', response.status, response.statusText, errorData);
                throw new Error(`Failed to update site data: ${response.statusText}. ${errorData ? JSON.stringify(errorData) : ''}`);
            }
    
            const responseData = await response.json();
            const updatedEntry: SiteEntry = { sitename, sitefullname };
            setSiteData(prevData => {
                const existingIndex = prevData.findIndex(item => item.sitename === sitename);
                if (existingIndex !== -1) {
                    return prevData.map((item, index) => 
                        index === existingIndex ? updatedEntry : item
                    );
                } else {
                    return [...prevData, updatedEntry];
                }
            });
            
            return updatedEntry;
        } catch (error) {
            console.error('Error in updateSite:', error);
            setError(error instanceof Error ? error.message : String(error));
            throw error;
        }
    };

    const updateIP = async (ipaddress: string, sitename: string): Promise<IPEntry> => {
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/assigned`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sitename, ipaddress: ipaddress }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Server response:', response.status, response.statusText, errorData);
                throw new Error(`Failed to update IP data: ${response.statusText}. ${errorData ? JSON.stringify(errorData) : ''}`);
            }
    
            const updatedEntry: IPEntry = { ipaddress, sitename: sitename };
            setIpData(prevData => {
                const existingIndex = prevData.findIndex(item => item.ipaddress === ipaddress);
                if (existingIndex !== -1) {
                    return prevData.map((item, index) => 
                        index === existingIndex ? updatedEntry : item
                    );
                } else {
                    return [...prevData, updatedEntry];
                }
            });
            
            return updatedEntry;
        } catch (error) {
            console.error('Error in updateIP:', error);
            setError(error instanceof Error ? error.message : String(error));
            throw error;
        }
    };

    const deleteSite = async (sitename: string): Promise<void> => {
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/site`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sitename }),
            });
    
            if (!response.ok) {
                throw new Error(`Failed to delete site: ${response.statusText}`);
            }
    
            setSiteData(prevData => prevData.filter(item => item.sitename !== sitename));
    
            await fetchData();
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error));
            throw error;
        }
    };

    const deleteIP = async (ipaddress: string): Promise<void> => {
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/assigned`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ipaddress: ipaddress }),  
            });
    
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(`Failed to delete IP: ${response.statusText}. ${errorData ? JSON.stringify(errorData) : ''}`);
            }
    
            setIpData(prevData => prevData.filter(item => item.ipaddress !== ipaddress));
        } catch (error) {
            console.error('Error in deleteIP:', error);
            setError(error instanceof Error ? error.message : String(error));
            throw error;
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    return { 
        siteData, 
        ipData, 
        error, 
        loading, 
        updateSite, 
        updateIP, 
        deleteSite, 
        deleteIP, 
        refreshData: fetchData 
    };
};

export default manageSitesDB;