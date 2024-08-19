import { useState, useEffect } from 'react';

interface DBEntry {
  ipaddress: string;
  macaddress?: string;
  device?: string;
  comment?: string;
  sitename?: string;  // TB_AssignedIP에서 필요한 필드
}

const API_BASE_URL = 'http://itmanagement:8070/api/ipcheck';

const useIpsInDB = () => {
  const [data, setData] = useState<DBEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const updateIp = async (ip: string, updatedData: Partial<DBEntry>): Promise<DBEntry> => {
    setError(null);
    try {
      const dataToSend = { ip, ...updatedData };
      console.log('Sending data to server:', dataToSend);
  
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
  
      const responseData = await response.json();
  
      if (!response.ok) {
        console.error('Server error response:', responseData);
        if (responseData.error === 'Invalid sitename') {
          throw new Error('The provided site name does not exist. Please check and try again.');
        } else {
          throw new Error(`Failed to update IP data: ${responseData.error || 'Unknown error'}. Details: ${responseData.details || 'No details provided'}`);
        }
      }
  
      console.log('Server response:', responseData);
  
      setData(prevData => {
        const existingEntryIndex = prevData.findIndex(item => item.ipaddress === ip);
        if (existingEntryIndex !== -1) {
          const newData = [...prevData];
          newData[existingEntryIndex] = { ...newData[existingEntryIndex], ...updatedData };
          return newData;
        } else {
          return [...prevData, { ipaddress: ip, ...updatedData }];
        }
      });
  
      return { ipaddress: ip, ...updatedData };
    } catch (error) {
      console.error('Error in updateIp:', error);
      setError(error instanceof Error ? error.message : String(error));
      throw error;
    }
  };

  const deleteIp = async (ip: string): Promise<void> => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}?ip=${ip}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete IP: ${errorData.error || 'Unknown error'}`);
      }

      setData(prevData => prevData.filter(item => item.ipaddress !== ip));
    } catch (error) {
      console.error('Error in deleteIp:', error);
      setError(error instanceof Error ? error.message : String(error));
      throw error;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, error, loading, updateIp, deleteIp, refreshData: fetchData };
};

export default useIpsInDB;