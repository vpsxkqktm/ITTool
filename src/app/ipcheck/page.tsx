"use client";

import React, { useState, useEffect, useMemo } from 'react';
import ServerStatus from '../components/serverStatus';
import Dropdown from '../components/dropdown';
import manageSitesDB from '../components/manageSites';

interface SiteEntry {
  sitename: string;
  sitefullname: string;
}

interface IPEntry {
  ipaddress: string;
  sitename?: string;
}

interface Option {
  value: string;
  label: string;
}

interface GroupedOption {
  prefix: string;
  sites: {
    sitename: string;
    ips: Option[];
  }[];
}

const IpChecker = () => {
  const [selectedPrefix, setSelectedPrefix] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [text, setText] = useState<string>('');
  const [prefixOptions, setPrefixOptions] = useState<Option[]>([]);
  const [siteOptions, setSiteOptions] = useState<Option[]>([]);
  const [ipOptions, setIpOptions] = useState<Option[]>([]);
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [showIpDropdown, setShowIpDropdown] = useState(false);
  const [hideInput, setHideInput] = useState(false);
  const { siteData, ipData, error, loading } = manageSitesDB();

  const groupedOptions = useMemo(() => {
    if (!siteData || !ipData) return [];

    const grouped: GroupedOption[] = [];

    siteData.forEach(site => {
      const [prefix, suffix] = site.sitename.split('.', 2);
      let group = grouped.find(g => g.prefix === prefix);
      if (!group) {
        group = { prefix, sites: [] };
        grouped.push(group);
      }
      group.sites.push({ sitename: site.sitename, ips: [] });
    });

    ipData.forEach(ip => {
      if (ip.sitename){
        const [prefix] = ip.sitename.split('.', 2);
        const group = grouped.find(g => g.prefix === prefix);
        if (group) {
          const site = group.sites.find(s => s.sitename === ip.sitename);
          if (site) {
            site.ips.push({
              value: ip.ipaddress,
              label: ip.ipaddress
            });
          }
        }
      }
      
      
    });

    return grouped;
  }, [siteData, ipData]);

  useEffect(() => {
    setIsInitialLoad(false);
    const prefixes = [
      { value: "search", label: "Search" },
      ...groupedOptions.map(group => ({
        value: group.prefix,
        label: group.prefix
      }))
    ];
    setPrefixOptions(prefixes);
  }, [groupedOptions]);

  const buttonClick = () => {
    setSelectedIp(text);
    localStorage.setItem('selectedIp', text);
  }

  const handlePrefixSelect = (value: string) => {
    setSelectedPrefix(value);
    if (value === "search") {
      setShowSiteDropdown(false);
      setShowIpDropdown(false);
      setHideInput(false);
      setSelectedSite('');
      setSelectedIp('');
      setText('');
      return;
    }
    const group = groupedOptions.find(g => g.prefix === value);
    if (group) {
      const sites = group.sites.map(site => ({
        value: site.sitename,
        label: site.sitename.split('.')[1] || site.sitename
      }));
      setSiteOptions(sites);
      setShowSiteDropdown(true);
      setShowIpDropdown(false);
      setHideInput(true);
      setSelectedSite('');
      setSelectedIp('');
      setText('');
    }
  };

  const handleSiteSelect = (value: string) => {
    setSelectedSite(value);
    const group = groupedOptions.find(g => g.prefix === selectedPrefix);
    const site = group?.sites.find(s => s.sitename === value);
    if (site) {
      if (site.ips.length > 1) {
        setIpOptions(site.ips);
        setShowIpDropdown(true);
        setSelectedIp('');
        setText('');
      } else if (site.ips.length === 1) {
        setSelectedIp(site.ips[0].value);
        setText(site.ips[0].value);
        setShowIpDropdown(false);
      } else {
        setSelectedIp('');
        setText('');
        setShowIpDropdown(false);
      }
    }
  };

  const handleIpSelect = (value: string) => {
    setSelectedIp(value);
    setText(value);
    localStorage.setItem('selectedIp', value);
  };

  const enterPressed = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        buttonClick();
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <main>
      <div className="flex items-center space-x-2">
        <Dropdown 
          options={prefixOptions} 
          onSelect={handlePrefixSelect} 
          value={selectedPrefix}
        />
        
        {showSiteDropdown && (
          <Dropdown 
            options={siteOptions} 
            onSelect={handleSiteSelect}
            value={selectedSite}
          />
        )}

        {showIpDropdown && (
          <Dropdown 
            options={ipOptions} 
            onSelect={handleIpSelect}
            value={selectedIp}
          />
        )}
      
        {!hideInput && (
          <input
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={enterPressed}
            placeholder='Type IP address'
            className="w-64 px-4 py-1 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
          />
        )}
        {!hideInput && (
          <button
            onClick={buttonClick}
            className="px-6 py-1 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
          >
            Press
          </button>
        )}
      </div>
      {!isInitialLoad && selectedIp && <ServerStatus option={selectedIp} />}
    </main>
  );
};

export default IpChecker;