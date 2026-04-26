'use client';
import { Sidebar } from './Sidebar';
import styles from './Layout.module.css';

export function MainLayout({ children, title }: { children: React.ReactNode, title: string }) {
  return (
    <div className={styles.hqLayout}>
      <Sidebar />
      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <div className={styles.pageTitle}>
            <span>{title}</span>
            <span className={styles.statusIndicator}>● SYSTEM HEALTHY</span>
          </div>
        </header>
        <div className={styles.contentArea}>
          {children}
        </div>
      </main>
    </div>
  );
}
