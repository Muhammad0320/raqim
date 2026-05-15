'use client';

import styled from 'styled-components';

export const ArticleWrapper = styled.article`
  background-color: #09090b;
  color: #a1a1aa; /* zinc-400 equivalent */
  font-family: var(--font-geist-sans), sans-serif;
  line-height: 1.75;
  max-width: 100%;
`;

export const CategoryTag = styled.div`
  color: #06b6d4; /* cyan-500 */
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.75rem;
`;

export const MainTitle = styled.h1`
  color: #ffffff;
  font-size: 2.25rem;
  font-weight: 600;
  letter-spacing: -0.025em;
  margin-top: 0;
  margin-bottom: 1.5rem;
  
  @media (min-width: 768px) {
    font-size: 3rem;
  }
`;

export const LeadParagraph = styled.p`
  color: #a1a1aa;
  font-size: 1.25rem;
  line-height: 1.625;
  margin-bottom: 4rem;
`;

export const ContentSection = styled.section`
  margin-bottom: 4rem;
  scroll-margin-top: 6rem;
`;

export const SectionTitle = styled.h2`
  color: #f4f4f5; /* zinc-100 */
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: -0.025em;
  border-bottom: 1px solid rgba(39, 39, 42, 0.8); /* zinc-800/80 */
  padding-bottom: 0.75rem;
  margin-bottom: 1.5rem;
`;

export const SectionSubtitle = styled.h3`
  color: #ffffff;
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
`;

export const Paragraph = styled.p`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

export const InlineCode = styled.code`
  background-color: rgba(39, 39, 42, 0.5); /* zinc-800/50 */
  color: #e4e4e7; /* zinc-200 */
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875em;
  border: 1px solid rgba(63, 63, 70, 0.5); /* zinc-700/50 */
`;

export const HighlightCode = styled.code`
  background-color: rgba(131, 24, 67, 0.3); /* pink-950/30 */
  color: #f472b6; /* pink-400 */
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875em;
  border: 1px solid rgba(131, 24, 67, 0.5);
`;

export const EmphasizedText = styled.strong`
  color: #e4e4e7; /* zinc-200 */
  font-weight: 600;
`;

export const UnorderedList = styled.ul`
  list-style-type: disc;
  padding-left: 1.625rem;
  margin-bottom: 1.5rem;
`;

export const ListItem = styled.li`
  margin-bottom: 0.5rem;
  padding-left: 0.375rem;
  
  &::marker {
    color: #52525b; /* zinc-600 */
  }
`;

export const EnterpriseBox = styled.div`
  background-color: rgba(24, 24, 27, 0.5); /* zinc-900/50 */
  border: 1px solid #27272a; /* zinc-800 */
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 1.5rem;
`;
