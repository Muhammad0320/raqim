"use client";

import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { ChevronDown, Check, Building } from "lucide-react";
import { useTenantStore } from "@/store/useTenantStore";

// The outer container
const Container = styled.div`
  position: relative;
  display: inline-block;
  text-align: left;
  font-family: var(--font-sans);
`;

// Trigger Button with Tailwind hover effects and transition
const TriggerButton = styled.button<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-1-5) var(--spacing-3);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-zinc-300);
  background-color: ${props => props.$isOpen ? 'var(--color-zinc-900)' : 'transparent'};
  border-radius: var(--radius-md);
  border: 1px solid ${props => props.$isOpen ? 'var(--color-zinc-800)' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    color: var(--color-zinc-100);
    background-color: var(--color-zinc-900);
    border-color: var(--color-zinc-800);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-zinc-800);
  }
`;

// Avatar representation for an organization
const OrgAvatar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--spacing-5);
  height: var(--spacing-5);
  font-size: 10px;
  font-weight: 700;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--color-zinc-700) 0%, var(--color-zinc-900) 100%);
  color: var(--color-zinc-100);
  border: 1px solid var(--color-zinc-800);
`;

// Chevron wrapper that rotates when open
const ChevronIconWrapper = styled.div<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  color: var(--color-zinc-500);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

// Dropdown Menu with premium glassmorphism and transitions
const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  left: 0;
  margin-top: var(--spacing-2);
  width: var(--spacing-64);
  background-color: rgba(9, 9, 11, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-zinc-800);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2xl);
  padding: var(--spacing-1-5);
  z-index: 50;
  
  /* Dropdown Mechanics & Smooth Transitions */
  transform-origin: top left;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  opacity: ${props => props.$isOpen ? 1 : 0};
  transform: ${props => props.$isOpen ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-8px)'};
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
`;

const DropdownHeader = styled.div`
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-zinc-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-zinc-900);
  margin-bottom: var(--spacing-1);
`;

// Dropdown items listing organizations
const DropdownItem = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--text-sm);
  color: ${props => props.$isActive ? 'var(--color-zinc-100)' : 'var(--color-zinc-400)'};
  background-color: ${props => props.$isActive ? 'rgba(63, 63, 70, 0.25)' : 'transparent'};
  border: none;
  border-radius: var(--radius-md);
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: var(--color-zinc-100);
    background-color: rgba(63, 63, 70, 0.15);
  }

  &:focus {
    outline: none;
    background-color: rgba(63, 63, 70, 0.2);
  }
`;

const ItemContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2-5);
`;

export function OrgSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    organizations, 
    activeOrganizationId, 
    setActiveOrganization, 
    fetchTenantData,
    isLoading
  } = useTenantStore();

  // Fetch initial organization data on mount
  useEffect(() => {
    fetchTenantData();
  }, [fetchTenantData]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const activeOrg = organizations.find(org => org.id === activeOrganizationId);

  const handleSelectOrg = (id: string) => {
    setActiveOrganization(id);
    setIsOpen(false);
    // Refresh page / layout router context to update all server actions & components
    window.location.reload();
  };

  return (
    <Container ref={containerRef} id="org-switcher-root">
      <TriggerButton 
        onClick={() => setIsOpen(!isOpen)} 
        $isOpen={isOpen}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select active workspace"
      >
        <OrgAvatar>
          {activeOrg ? activeOrg.display_name.charAt(0).toUpperCase() : <Building className="w-3 h-3" />}
        </OrgAvatar>
        <span className="max-w-[150px] truncate text-white">
          {isLoading && !activeOrg ? "Loading workspace..." : (activeOrg?.display_name || "Select Workspace")}
        </span>
        <ChevronIconWrapper $isOpen={isOpen}>
          <ChevronDown className="w-4 h-4" />
        </ChevronIconWrapper>
      </TriggerButton>

      <DropdownMenu $isOpen={isOpen} role="listbox">
        <DropdownHeader>Workspaces</DropdownHeader>
        {organizations.length === 0 ? (
          <div className="px-3 py-2 text-xs text-zinc-500 italic">No workspaces found</div>
        ) : (
          organizations.map((org) => {
            const isActive = org.id === activeOrganizationId;
            return (
              <DropdownItem
                key={org.id}
                role="option"
                aria-selected={isActive}
                $isActive={isActive}
                onClick={() => handleSelectOrg(org.id)}
              >
                <ItemContent>
                  <OrgAvatar>
                    {org.display_name.charAt(0).toUpperCase()}
                  </OrgAvatar>
                  <div className="flex flex-col">
                    <span className="font-medium truncate max-w-[140px]">{org.display_name}</span>
                    <span className="text-[10px] text-zinc-500 truncate max-w-[140px]">@{org.alias}</span>
                  </div>
                </ItemContent>
                {isActive && <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />}
              </DropdownItem>
            );
          })
        )}
      </DropdownMenu>
    </Container>
  );
}
