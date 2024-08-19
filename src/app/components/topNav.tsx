'use client'

import Link from 'next/link';
import styles from './topNav.module.css';
const TopNav = () => {
  return (
    <nav className={styles.topNav}>
      <ul>
        <li><Link href="/">Home</Link></li>
        <li><Link href="/ipcheck">IP Management</Link></li>
        <li><Link href="/test">Test</Link></li>
        <li><Link href="/settings">Settings</Link></li>
      </ul>
    </nav>
  );
};

export default TopNav;