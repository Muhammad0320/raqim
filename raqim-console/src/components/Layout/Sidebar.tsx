import Link from 'next/link';
import { Network, Shield, Database, Route, Terminal, Settings } from 'lucide-react';
import styles from './Layout.module.css';

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.profileBox}>
        <div className={styles.profileBadge}>
          <Shield size={18} className="text-cyan glow-cyan" />
        </div>
        <div className={styles.profileInfo}>
          <div className={`${styles.role} text-mono`}>ROOT_USER</div>
          <div className={styles.node}>SOVEREIGN NODE</div>
        </div>
      </div>

      <nav className={styles.navLinks}>
        <Link href="/" className={styles.navLink}>
          <Network size={16} /> <span>TOPOLOGY</span>
        </Link>
        <Link href="/firewall" className={styles.navLink}>
          <Shield size={16} /> <span>FIREWALL</span>
        </Link>
        <Link href="/vault" className={styles.navLink}>
          <Database size={16} /> <span>VAULT</span>
        </Link>
        <Link href="/router" className={`${styles.navLink} ${styles.activeLink}`}>
          <Route size={16} /> <span>ROUTER</span>
        </Link>
        <Link href="/kernel" className={styles.navLink}>
          <Terminal size={16} /> <span>KERNEL</span>
        </Link>
      </nav>

      <div className={styles.sidebarFooter}>
        <button className={styles.actionBtn}>+ NEW INSTANCE</button>
      </div>
    </aside>
  );
}
