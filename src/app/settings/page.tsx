'use client'

import React, { useState, useMemo } from 'react';
import manageSitesDB from '../components/manageSites';

interface SiteEntry {
  sitename: string;
  sitefullname: string;
}

interface IPEntry {
  ipaddress: string;
  sitename?: string;
}

const SettingPage = () => {
    const { siteData, ipData, error: dbError, loading: dbLoading, updateSite, updateIP, deleteSite, deleteIP } = manageSitesDB();
    const [siteText, setSiteText] = useState<string>('');
    const [siteFullnameText, setSiteFullnameText] = useState<string>('');
    const [selectedSitename, setSelectedSitename] = useState<string>('');
    const [ipText, setIpText] = useState<string>('');
    const [checkText, setCheckText] = useState<string>('');
    const [checkType, setCheckType] = useState<'ip' | 'site'>('site');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [checkResult, setCheckResult] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ type: 'add' | 'update' | 'delete', data: SiteEntry | IPEntry } | null>(null);

    const sortedSiteData = useMemo(() => {
        return [...siteData].sort((a, b) => a.sitename.localeCompare(b.sitename));
    }, [siteData]);

    const sortedIPData = useMemo(() => {
        return [...ipData].sort((a, b) => a.ipaddress.localeCompare(b.ipaddress));
    }, [ipData]);

    const handleSaveSite = async (sitename: string, sitefullname: string) => {
        if (!sitename || !sitefullname) {
            setError('Site name and full name are required');
            return;
        }
        setConfirmAction({ type: 'add', data: { sitename: sitename.toUpperCase(), sitefullname } });
    };

    const handleSaveIP = async (sitename: string, ipaddress: string) => {
        if (!sitename || !ipaddress) {
            setError('Site name and IP address are required');
            return;
        }
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ipaddress)) {
            setError('Invalid IP address format');
            return;
        }
        setConfirmAction({ type: 'add', data: { ipaddress, sitename: sitename } });
    };

    const confirmSave = async () => {
        if (!confirmAction || confirmAction.type !== 'add') return;
        try {
            if ('sitefullname' in confirmAction.data) {
                await updateSite(confirmAction.data.sitename, confirmAction.data.sitefullname);
            } else {
                await updateIP(confirmAction.data.ipaddress, confirmAction.data.sitename || '');
            }
            setSuccess(true);
            setError(null);
            setSiteText('');
            setSiteFullnameText('');
            setIpText('');
            setSelectedSitename('');
        } catch (error) {
            console.error('Error updating data:', error);
            setError(`Failed to update data: ${error instanceof Error ? error.message : String(error)}`);
            setSuccess(false);
        } finally {
            setConfirmAction(null);
        }
    };

    const handleDelete = async (entry: SiteEntry | IPEntry) => {
        setConfirmAction({ type: 'delete', data: entry });
    };

    const confirmDelete = async () => {
        if (!confirmAction || confirmAction.type !== 'delete') return;
        try {
            if ('sitefullname' in confirmAction.data) {
                await deleteSite(confirmAction.data.sitename);
            } else {
                await deleteIP(confirmAction.data.ipaddress);
            }
            setSuccess(true);
            setError(null);
        } catch (error) {
            console.error('Error deleting data:', error);
            setError(`Failed to delete data: ${error instanceof Error ? error.message : String(error)}`);
            setSuccess(false);
        } finally {
            setConfirmAction(null);
        }
    };

    const handleCheck = () => {
        if (!checkText) {
            setError('Please enter a value to check');
            return;
        }

        let result;
        if (checkType === 'ip') {
            result = ipData.find(entry => entry.ipaddress === checkText);
            setCheckResult(result 
                ? `IP ${checkText} is allocated to device: ${result.sitename || 'N/A'}` 
                : `IP ${checkText} is not allocated`);
        } else {
            result = siteData.find(entry => entry.sitename.toLowerCase() === checkText.toLowerCase());
            setCheckResult(result 
                ? `Site ${checkText} exists with full name: ${result.sitefullname}` 
                : `Site ${checkText} does not exist`);
        }
        setError(null);
    };

    return (
        <main className="p-4 max-w-full mx-auto">
            {dbLoading && <p className="text-gray-500 text-lg">Loading...</p>}
            {error && <p className="text-red-500 text-lg">{error}</p>}
            {success && <p className="text-green-500 text-lg">Operation completed successfully!</p>}
            <div className="mb-4 flex items-center space-x-2">
                <div className="flex-1">
                    <select
                        value={checkType}
                        onChange={(e) => setCheckType(e.target.value as 'ip' | 'site')}
                        className="p-1 border border-gray-300 rounded text-lg focus:ring focus:ring-blue-300"
                    >
                        <option value="site">Check Site</option>
                        <option value="ip">Check IP</option>
                    </select>
                    {checkType === 'site' ? (
                        <>
                            <input
                                type="text"
                                value={siteText}
                                onChange={(event) => setSiteText(event.target.value)}
                                placeholder="Site name"
                                className="mt-1 p-1 border border-gray-300 rounded text-lg focus:ring focus:ring-blue-300"
                            />
                            <input
                                type="text"
                                value={siteFullnameText}
                                onChange={(event) => setSiteFullnameText(event.target.value)}
                                placeholder="Site full name"
                                className="mt-1 p-1 border border-gray-300 rounded text-lg focus:ring focus:ring-blue-300"
                            />
                            <button
                                onClick={() => handleSaveSite(siteText, siteFullnameText)}
                                disabled={dbLoading}
                                className={`p-1 bg-blue-500 text-white rounded text-lg ${
                                    dbLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                                }`}
                            >
                                {dbLoading ? 'Saving...' : 'Add/Update'}
                            </button>
                            <div className="mt-4">
                                <h2 className="text-xl font-bold mb-2">Site List</h2>
                                {sortedSiteData.map((datum, index) => (
                                    <div
                                        key={index}
                                        className={`flex justify-between items-center p-2 ${
                                            index % 2 === 0 ? 'bg-gray-100' : 'bg-white'
                                        } border-b border-gray-200 text-lg`}
                                    >
                                        <span>
                                            <strong className="text-gray-700">{datum.sitename}</strong>: {datum.sitefullname}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(datum)}
                                            className="text-red-500 hover:text-red-700 text-lg"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <select
                                value={selectedSitename}
                                onChange={(event) => setSelectedSitename(event.target.value)}
                                className="mt-1 p-1 border border-gray-300 rounded text-lg focus:ring focus:ring-blue-300"
                            >
                                <option value="">Select a site</option>
                                {siteData.map((site) => (
                                    <option key={site.sitename} value={site.sitename}>
                                        {site.sitename}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={ipText}
                                onChange={(event) => setIpText(event.target.value)}
                                placeholder="IP address"
                                className="mt-1 p-1 border border-gray-300 rounded text-lg focus:ring focus:ring-blue-300"
                            />
                            <button
                                onClick={() => handleSaveIP(selectedSitename, ipText)}
                                disabled={dbLoading}
                                className={`p-1 bg-blue-500 text-white rounded text-lg ${
                                    dbLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                                }`}
                            >
                                {dbLoading ? 'Saving...' : 'Add/Update'}
                            </button>
                            <div className="mt-4">
                                <h2 className="text-xl font-bold mb-2">IP List</h2>
                                {sortedIPData.map((datum, index) => (
                                    <div
                                        key={index}
                                        className={`flex justify-between items-center p-2 ${
                                            index % 2 === 0 ? 'bg-gray-100' : 'bg-white'
                                        } border-b border-gray-200 text-lg`}
                                    >
                                        {selectedSitename === datum.sitename? 
                                        <>
                                            <span>
                                                <strong className="text-gray-700">{datum.sitename}</strong>
                                                {`: ${datum.ipaddress}`}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(datum)}
                                                className="text-red-500 hover:text-red-700 text-lg"
                                                >
                                                    Delete
                                            </button>
                                        </>
                                        :''}
                                        
                                        
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    
                </div>
            </div>
            {/* <div className="mb-4 flex items-center space-x-2">
                <input
                    type="text"
                    value={checkText}
                    onChange={(event) => setCheckText(event.target.value)}
                    placeholder={checkType === 'ip' ? "Enter IP to check" : "Enter site name to check"}
                    className="mt-1 p-1 border border-gray-300 rounded text-lg focus:ring focus:ring-blue-300"
                />
                <button
                    onClick={handleCheck}
                    className="p-1 bg-green-500 text-white rounded text-lg hover:bg-green-600"
                >
                    Check
                </button>
            </div> */}
            {checkResult && (
                <div className="mb-4 p-2 bg-blue-100 border border-blue-300 rounded">
                    <p className="text-blue-800">{checkResult}</p>
                </div>
            )}
            
            
            {confirmAction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-lg">
                        <p>
                            {confirmAction.type === 'add' 
                                ? `Are you sure you want to add/update ${('sitefullname' in confirmAction.data) ? 'site' : 'IP'} ${('sitefullname' in confirmAction.data) ? confirmAction.data.sitename : confirmAction.data.ipaddress}?`
                                : `Are you sure you want to delete ${('sitefullname' in confirmAction.data) ? 'site' : 'IP'} ${('sitefullname' in confirmAction.data) ? confirmAction.data.sitename : confirmAction.data.ipaddress}?`
                            }
                        </p>
                        <div className="mt-4 flex justify-end space-x-2">
                            <button
                                onClick={() => confirmAction.type === 'add' ? confirmSave() : confirmDelete()}
                                className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="p-1 bg-gray-300 text-black rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default SettingPage;