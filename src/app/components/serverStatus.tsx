import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import useIpsInDB from './useIpsInDB';

interface IPStatus {
  ip: string;
  alive: boolean;
  time?: number | "unknown";
  min?: string;
  max?: string;
  avg?: string;
  packetLoss?: string;
}

interface IPScanned {
  ip: string;
  macaddress?: string | undefined;
  alive: boolean;
  time?: number | "unknown";
  avg?: string | undefined;
  packetLoss?: string | undefined;
  device?: string | undefined;
  comment?: string | undefined;
}

const ServerStatus = ({ option }: { option: string }) => {
  const [mergedIpData, setMergedIpData] = useState<IPScanned[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const { data: dbData, error: dbError, loading: dbLoading, updateIp, deleteIp } = useIpsInDB();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingIp, setEditingIp] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<IPScanned | null>(null);
  const [editingData, setEditingData] = useState<IPScanned | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('ip');
  const [macOrder, setMacOrder] = useState<boolean>(true);
  const [ipOrder, setIpOrder] = useState<boolean>(false);
  const [recentlySavedIP, setRecentlySavedIP] = useState<IPScanned | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const dbIpAddresses = useMemo(() => new Set(dbData.map(entry => entry.ipaddress)), [dbData]);
  let dotCount = option.split('.').length
  let ipRange = dotCount === 4 ? option.substring(option.lastIndexOf('.')+1) === '0'? option.substring(0, option.lastIndexOf('.')) : `num${option}` : option;

  const fetchAndMergeData = useCallback(async () => {
    const controller = new AbortController();

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = controller;
    const { signal } = controller;

    if (dbLoading) return;
    setUpdating(true);
    setIsLoading(true);
    setMergedIpData([]);
    try {
      const response = await fetch(`/api/status?ipRange=${ipRange}`, { signal });
      const pingResults: IPStatus[] = await response.json();
  
      setMergedIpData(prevData => {
        const newData = pingResults.map(pingResult => {
          const existingItem = prevData.find(item => item.ip === pingResult.ip);
          const dbEntry = dbData.find(db => db.ipaddress === pingResult.ip);
          return {
            ...existingItem,
            ...pingResult,
            ...dbEntry,
            ip: pingResult.ip
          };
        });
  
        return newData;
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
        } else {
          console.error('Failed to fetch and merge data:', error.message);
        }
      } else {
        console.error('An unknown error occurred');
      }
    } finally {
      setUpdating(false);
      setLoading(false);
      setIsLoading(false);
    }
  }, [ipRange, dbData, dbLoading]);


  useEffect(() => {
    if (option && !dbLoading) {
      fetchAndMergeData();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [option, dbLoading, fetchAndMergeData]);

  useEffect(() => {
    if (recentlySavedIP) {
      const timer = setTimeout(() => {
        setRecentlySavedIP(null);
      }, 5000); 

      return () => clearTimeout(timer);
    }
  }, [recentlySavedIP]);

  const handleSave = async (ip: string) => {
    if (!originalData || !editingData) return;

    const changedFields: Partial<IPScanned> = {};
    let hasChanges = false;
    let macCheck = true;
    (Object.keys(editingData) as Array<keyof IPScanned>).forEach(key => {
      if (editingData[key] !== originalData[key]) {
        if (editingData[key] !== undefined) {
          if (key === 'macaddress'){
            if (editingData[key]) {  
              let macReg = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
              if (!macReg.test(editingData[key])){
                alert("MAC address is not valid")
                macCheck = false;
                return;
              }
            }
          }
          (changedFields as any)[key] = editingData[key];
          hasChanges = true;
        }
      }
    });
  
    if (!hasChanges || !macCheck) {
      setEditingIp(null);
      setEditingData(null);
      return;
    }
  
    setUpdating(true);
    try {
      const updatedEntry = await updateIp(ip, changedFields);
      
      const updatedIPScanned: IPScanned = {
        ...originalData,
        ...updatedEntry,
        ip,
        alive: originalData.alive
      };

      setMergedIpData(prevData => 
        prevData.map(item => 
          item.ip === ip ? updatedIPScanned : item
        )
      );

      setRecentlySavedIP(updatedIPScanned);

      setEditingIp(null);
      setEditingData(null);
    } catch (error) {
      console.error('Error updating IP data:', error);
      alert("Failed to update data. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (ip: string) => {
    try {
      await deleteIp(ip);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete IP:', error);
      alert('Failed to delete IP. Please try again.');
    }
  };


  const handleEdit = (ip: string) => {
    setEditingIp(ip);
    const currentData = mergedIpData.find(item => item.ip === ip) || null;
    setEditingData(currentData ? {...currentData} : null);
    setOriginalData(currentData);
  };

  const handleCancel = () => {
    setEditingIp(null);
    setEditingData(null);
  };

  const renderEditableField = (ip: string, field: keyof IPScanned, value: string | null | undefined) => {
    if (editingIp === ip) {
      return (
        <input
          type="text"
          value={editingData && editingData[field] !== null && editingData[field] !== undefined 
            ? (editingData[field] as string) 
            : value || ''}
          onChange={(e) => {
            let newValue = e.target.value;
            if (field === 'macaddress') {
              newValue = newValue.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
              newValue = newValue.replace(/(.{2})(?=.)/g, '$1:');
            }
            setEditingData(prev => prev ? { ...prev, [field]: newValue } : null);
          }}
          className="w-full px-2 py-1 text-gray-700 border rounded focus:outline-none focus:border-blue-500"
        />
      );
    }
    return <span className="cursor-text">{value || '-'}</span>;
  };

  const filteredData = useMemo(() => {
    return mergedIpData.filter(item => {
      if (filter !== 'all' && item.alive.toString() !== filter) return false;
      
      if (searchTerm) {
        switch(searchField) {
          case 'ip':
            const lastOctet = item.ip.split('.')[3];
            return lastOctet === searchTerm;
          case 'macaddress':
            return item.macaddress?.toLowerCase().includes(searchTerm.toLowerCase());
          case 'device':
            return item.device?.toLowerCase().includes(searchTerm.toLowerCase());
          case 'comment':
            return item.comment?.toLowerCase().includes(searchTerm.toLowerCase());
          default:
            return false;
        }
      }
      
      return true;
    });
  }, [mergedIpData, filter, searchTerm, searchField]);

  const ipSorting = () => {
    setMergedIpData(prevData => {
      const sortedData = [...prevData].sort((a, b) => {
        const getLastOctet = (ip: string): number => {
          const parts = ip.split('.');
          return parseInt(parts[parts.length - 1], 10);
        };
  
        const lastOctetA = getLastOctet(a.ip);
        const lastOctetB = getLastOctet(b.ip);
  
        if (ipOrder) {
          return lastOctetA - lastOctetB;
        } else {
          return lastOctetB - lastOctetA;
        }
      });
  
      setIpOrder(!ipOrder);
      return sortedData;
    });
  };

  const macSorting = () => {
    setMergedIpData(prevData => {
      const sortedData = [...prevData].sort((a, b) => {
        const macA = a.macaddress || '';
        const macB = b.macaddress || '';

        if (macA === '' && macB === '') return 0;
        if (macA === '') return 1;
        if (macB === '') return -1;
        
        return macOrder ? macA.localeCompare(macB) : macB.localeCompare(macA);
      });
      
      setMacOrder(!macOrder);
      return sortedData;
    });
  };

  if (loading) {
    return <div>Loading initial data...</div>;
  }

  if (dbError) {
    return <div>Error loading DB data: {dbError}</div>;
  }
  

  return (
    <div className="max-w-full mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Server Status</h2>
      {recentlySavedIP && (
        <div className="mb-6 p-4 bg-green-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Recently Saved IP Information</h3>
          <p><strong>IP:</strong> {recentlySavedIP.ip}</p>
          <p><strong>MAC Address:</strong> {recentlySavedIP.macaddress || '-'}</p>
          <p><strong>Device:</strong> {recentlySavedIP.device || '-'}</p>
          <p><strong>Comment:</strong> {recentlySavedIP.comment || '-'}</p>
          <p><strong>Status:</strong> {recentlySavedIP.alive ? 'Alive' : 'Dead'}</p>
        </div>
      )}
      
      <div className="mb-4 flex justify-between items-center">
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All</option>
          <option value="true">Alive</option>
          <option value="false">Dead</option>
        </select>
        <div className="flex items-center space-x-2">
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="ip">IP Address</option>
            <option value="macaddress">MAC Address</option>
            <option value="device">Device</option>
            <option value="comment">Comment</option>
          </select>
          <input
            type="text"
            placeholder={`Search ${searchField}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border rounded"
          />
        </div>
      </div>
  
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal sticky top-0">
            <tr>
              <th className="py-3 px-2 text-left w-1/6">
                <p className="w-fit cursor-pointer" onClick={() => ipSorting()}>IP Address </p> 
              </th>
              <th className="py-3 px-2 text-left w-1/6">
                <p className="w-fit cursor-pointer" onClick={() => macSorting()}>MAC Address</p>
              </th>
              <th className="py-3 px-2 text-left w-1/6">Device</th>
              <th className="py-3 px-2 text-left w-1/4">Comment</th>
              <th className="py-3 px-2 text-left w-1/12">Average</th>
              <th className="py-3 px-2 text-left w-1/12">Packet Loss</th>
              <th className="py-3 px-2 text-left w-1/12">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {filteredData.map((status, index) => (
              <tr key={index} className={`border-b border-gray-200 hover:bg-gray-100 ${
                status.alive ? 'bg-green-300' : status.packetLoss === '100' ? 'bg-red-300' : 'bg-orange-100' 
              }`}>
                <td className="py-2 px-2 text-left whitespace-nowrap">{status.ip}</td>
                <td className="py-2 px-2 text-left">{renderEditableField(status.ip, 'macaddress', status.macaddress || '')}</td>
                <td className="py-2 px-2 text-left">{renderEditableField(status.ip, 'device', status.device || '')}</td>
                <td className="py-2 px-2 text-left">{renderEditableField(status.ip, 'comment', status.comment || '')}</td>
                <td className="py-2 px-2 text-left">{status.avg === "NaN"? "-" : status.avg + "ms"}</td>
                <td className="py-2 px-2 text-left">{status.packetLoss || '-'}%</td>
                <td className="py-2 px-2 text-left">
                  {editingIp === status.ip ? (
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => handleSave(status.ip)}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded text-xs"
                      >
                        Save
                      </button>
                      <button 
                        onClick={handleCancel}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-2 rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => handleEdit(status.ip)}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-2 rounded text-xs"
                      >
                        Edit
                      </button>
                      {dbIpAddresses.has(status.ip) && (
                        <button 
                          onClick={() => setShowDeleteConfirm(status.ip)}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-xs"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-5 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold mb-2">Confirm Deletion</h3>
            <p>Are you sure you want to delete IP {showDeleteConfirm}?</p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .cursor-text {
          cursor: text;
        }
      `}</style>
    
    {isLoading && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-5 rounded-lg shadow-xl">
          <h3 className="text-lg font-bold mb-2">Loading</h3>
          <p>Please wait while we fetch and process the data...</p>
        </div>
      </div>
    )}
  </div>
  );
};

export default ServerStatus;