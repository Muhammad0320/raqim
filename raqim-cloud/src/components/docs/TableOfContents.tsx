'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface TocItem {
  id: string;
  text: string;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const pathname = usePathname();

  useEffect(() => {
    // Scan the DOM for h2 tags inside article or main content
    const article = document.querySelector('article') || document.querySelector('main');
    if (!article) {
      setHeadings([]);
      return;
    }

    const elements = Array.from(article.querySelectorAll('h2'));
    
    // Ensure all h2 tags have an ID. If not, generate one from text content.
    const items = elements.map((elem) => {
      if (!elem.id) {
        elem.id = elem.textContent
          ?.toLowerCase()
          .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
          .replace(/\s+/g, '-')       // collapse whitespace and replace by -
          .replace(/-+/g, '-') || ''; // collapse dashes
      }
      return {
        id: elem.id,
        text: elem.textContent || '',
      };
    });

    setHeadings(items);

    // Track active section using IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible entries
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Set active ID to the first intersecting heading
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px', // triggers when headings are near top
        threshold: 0.1,
      }
    );

    elements.forEach((elem) => {
      if (elem.id) {
        observer.observe(elem);
      }
    });

    return () => {
      elements.forEach((elem) => {
        if (elem.id) {
          observer.unobserve(elem);
        }
      });
    };
  }, [pathname]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className="hidden xl:block w-64 flex-shrink-0 sticky top-0 h-screen py-20 px-8 border-l border-zinc-800/50">
      <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">On this page</h4>
      <nav className="space-y-2.5 text-sm">
        {headings.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
              // Push history state so browser backward button is preserved
              window.history.pushState(null, '', `#${item.id}`);
            }}
            className={`block transition-colors duration-150 ${
              activeId === item.id
                ? 'text-[#00E5FF] font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {item.text}
          </a>
        ))}
      </nav>
    </aside>
  );
}
