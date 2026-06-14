'use client';

import React, { useState, FormEvent } from 'react';
import styled, { keyframes } from 'styled-components';
import { executeUnifiedSearch, SearchResult, VaultTelemetry } from '@/actions/vault';

interface VaultClientLayoutProps {
    telemetry: VaultTelemetry;
    initialAliases: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────
// Styled Components
// ─────────────────────────────────────────────────────────────────────────

// Main layout wrapper utilizing CSS Grid for Left Sidebar and Main Content
const LayoutGrid = styled.div`
    display: grid;
    grid-template-columns: 320px 1fr;
    height: 100%;
    width: 100%;
    min-height: 0;
    background-color: #09090b; /* Brutalist Deep Black */
    color: #ffffff; /* Pure white text */
    font-family: 'Space Mono', monospace; /* Monospace accents */
    box-sizing: border-box;
    overflow: hidden;
`;

// Left Sidebar (Query Engine & Vitals) - Fixed width, full height
const SidebarContainer = styled.aside`
    width: 320px;
    height: 100%;
    border-right: 1px solid #27272a; /* Stark borders */
    background-color: #09090b;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    min-height: 0;
    overflow-y: auto;
`;

const SidebarSection = styled.div`
    padding: 24px;
    border-bottom: 1px solid #27272a;
`;

const SidebarSectionGrow = styled(SidebarSection)`
    flex: 1;
    border-bottom: none;
    display: flex;
    flex-direction: column;
    min-height: 0;
`;

const Title = styled.h2`
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: #a1a1aa;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
`;

const Icon = styled.span`
    font-size: 16px;
    color: #a1a1aa;
`;

const FormGroup = styled.div`
    margin-bottom: 20px;
`;

const Label = styled.label<{ $color?: string }>`
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: ${props => props.$color || '#71717a'};
    text-transform: uppercase;
    letter-spacing: 0.12em;
    display: block;
    margin-bottom: 8px;
    font-weight: 700;
`;

const InputWrapper = styled.div`
    position: relative;
    width: 100%;
`;

const SearchIcon = styled.span`
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #71717a;
    font-size: 14px;
    pointer-events: none;
`;

const Input = styled.input`
    width: 100%;
    background-color: #000000;
    color: #ffffff;
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    padding: 10px 12px 10px 36px;
    border: 1px solid #27272a;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    
    &:focus {
        border-color: #00f3ff;
        box-shadow: 0 0 8px rgba(0, 243, 255, 0.2);
    }
    
    &::placeholder {
        color: #3f3f46;
    }
`;

const SelectWrapper = styled.div`
    position: relative;
    width: 100%;
`;

const Select = styled.select`
    width: 100%;
    background-color: #000000;
    color: #e4e4e7;
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    padding: 10px 32px 10px 12px;
    border: 1px solid #27272a;
    outline: none;
    appearance: none;
    cursor: pointer;
    box-sizing: border-box;
    
    &:focus {
        border-color: #00f3ff;
    }
`;

const SelectArrow = styled.span`
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #71717a;
    font-size: 14px;
    pointer-events: none;
`;

const ToggleContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background-color: #000000;
    border: 1px solid #27272a;
    margin-top: 8px;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
    width: 36px;
    height: 18px;
    border-radius: 9px;
    background-color: ${props => props.$active ? 'rgba(255, 179, 0, 0.2)' : '#27272a'};
    position: relative;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
    padding: 0;
    outline: none;
`;

const ToggleCircle = styled.div<{ $active: boolean }>`
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: ${props => props.$active ? '#ffb300' : '#71717a'};
    position: absolute;
    top: 3px;
    left: ${props => props.$active ? '21px' : '3px'};
    transition: left 0.2s, background-color 0.2s;
    box-shadow: ${props => props.$active ? '0 0 8px #ffb300' : 'none'};
`;

const SubmitButton = styled.button`
    width: 100%;
    background-color: rgba(0, 243, 255, 0.08);
    color: #00f3ff;
    border: 1px solid rgba(0, 243, 255, 0.4);
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    padding: 12px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    
    &:hover:not(:disabled) {
        background-color: rgba(0, 243, 255, 0.15);
        border-color: #00f3ff;
        box-shadow: 0 0 15px rgba(0, 243, 255, 0.25);
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

const Spinner = styled.span`
    animation: ${spin} 1s linear infinite;
    display: inline-block;
    font-size: 14px;
`;

const VitalsList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const VitalItem = styled.li`
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-bottom: 12px;
    border-bottom: 1px solid #18181b;
    
    &:last-child {
        border-bottom: none;
    }
`;

const VitalLabel = styled.span`
    font-size: 8px;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.12em;
`;

const VitalValue = styled.span<{ $color?: string }>`
    font-size: 12px;
    color: ${props => props.$color || '#ffffff'};
    font-weight: 500;
`;

// Main content container with strict flex columns for zero dead space
const MainContentArea = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    box-sizing: border-box;
`;

// Similarity Distribution Ribbon Component (max height: 120px)
const RibbonContainer = styled.div`
    height: 120px;
    max-height: 120px;
    background-color: #09090b;
    border-bottom: 1px solid #27272a;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 16px 24px;
    position: relative;
    width: 100%;
    box-sizing: border-box;
    flex-shrink: 0;
`;

const RibbonHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
`;

const RibbonTitle = styled.span`
    font-size: 10px;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    display: flex;
    align-items: center;
    gap: 6px;
`;

const RibbonQueryBadge = styled.span`
    font-size: 8px;
    color: #00f3ff;
    background-color: rgba(0, 243, 255, 0.08);
    border: 1px solid rgba(0, 243, 255, 0.2);
    padding: 2px 6px;
    font-family: 'Space Mono', monospace;
`;

const AxisWrapper = styled.div`
    position: relative;
    width: 100%;
    height: 36px;
    margin-top: 6px;
`;

const AxisLine = styled.div`
    height: 1px;
    background-color: #27272a;
    width: 100%;
    position: absolute;
    top: 18px;
    left: 0;
`;

const AxisTicks = styled.div`
    display: flex;
    justify-content: space-between;
    position: absolute;
    width: 100%;
    bottom: -4px;
    font-size: 8px;
    color: #52525b;
`;

const DotWrapper = styled.div<{ $x: number }>`
    position: absolute;
    left: ${props => props.$x * 100}%;
    top: 18px;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
`;

const PlotDot = styled.div<{ $color: string; $active: boolean }>`
    width: ${props => props.$active ? '12px' : '8px'};
    height: ${props => props.$active ? '12px' : '8px'};
    border-radius: 50%;
    background-color: ${props => props.$color};
    cursor: pointer;
    transition: all 0.1s ease-in-out;
    box-shadow: 0 0 6px ${props => props.$color};
    z-index: ${props => props.$active ? 20 : 10};
    
    &:hover {
        width: 14px;
        height: 14px;
        box-shadow: 0 0 12px ${props => props.$color}, 0 0 20px ${props => props.$color};
    }
`;

const Tooltip = styled.div`
    position: absolute;
    bottom: 18px;
    background-color: #000000;
    border: 1px solid #27272a;
    padding: 6px 10px;
    font-family: 'Space Mono', monospace;
    font-size: 8px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 30;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: #ffffff;
`;

const RibbonLegend = styled.div`
    display: flex;
    gap: 16px;
    font-size: 8px;
    color: #71717a;
    margin-top: 8px;
`;

const LegendItem = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
`;

const LegendDot = styled.div<{ $color: string }>`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: ${props => props.$color};
    box-shadow: 0 0 4px ${props => props.$color};
`;

// Unified Ledger Table Components
const TableContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    background-color: #000000;
`;

const TableHeader = styled.div`
    background-color: #09090b;
    border-bottom: 1px solid #27272a;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    flex-shrink: 0;
`;

const TableTitle = styled.span`
    font-size: 10px;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    display: flex;
    align-items: center;
    gap: 6px;
`;

const TableResultsCount = styled.span`
    font-size: 9px;
    color: #71717a;
    text-transform: uppercase;
`;

const GridHeaderRow = styled.div`
    display: grid;
    grid-template-columns: 80px 120px 100px 150px 1fr;
    padding: 10px 24px;
    background-color: #050507;
    border-bottom: 1px solid #18181b;
    flex-shrink: 0;
`;

const GridHeaderCell = styled.div`
    font-size: 9px;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
`;

const ScrollableTableBody = styled.div`
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    position: relative;
`;

const EmptyState = styled.div`
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #52525b;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
`;

const GridRow = styled.div<{ $hovered: boolean }>`
    display: grid;
    grid-template-columns: 80px 120px 100px 150px 1fr;
    padding: 14px 24px;
    border-bottom: 1px solid #18181b;
    align-items: center;
    cursor: pointer;
    transition: background-color 0.1s, border-left-color 0.1s;
    border-left: 2px solid transparent;
    
    background-color: ${props => props.$hovered ? '#09090b' : 'transparent'};
    border-left-color: ${props => props.$hovered ? '#00f3ff' : 'transparent'};
    
    &:hover {
        background-color: #09090b;
        border-left-color: #00f3ff;
    }
`;

const ScoreCell = styled.div`
    font-weight: 700;
    color: #ffffff;
    font-size: 12px;
`;

const TxIdCell = styled.div`
    color: #52525b;
    font-size: 11px;
`;

const SourceCell = styled.div`
    display: flex;
    justify-content: flex-start;
`;

const SourceBadge = styled.span<{ $source: 'HOT_WAL' | 'LANCEDB' }>`
    font-size: 8px;
    padding: 2px 6px;
    font-weight: 700;
    border: 1px solid ${props => props.$source === 'HOT_WAL' ? 'rgba(255, 179, 0, 0.3)' : 'rgba(6, 182, 212, 0.3)'};
    background-color: ${props => props.$source === 'HOT_WAL' ? 'rgba(255, 179, 0, 0.05)' : 'rgba(6, 182, 212, 0.05)'};
    color: ${props => props.$source === 'HOT_WAL' ? '#ffb300' : '#06b6d4'};
    box-shadow: 0 0 4px ${props => props.$source === 'HOT_WAL' ? 'rgba(255, 179, 0, 0.1)' : 'rgba(6, 182, 212, 0.1)'};
`;

const AgentCell = styled.div`
    color: #e4e4e7;
    font-size: 11px;
`;

const PayloadCell = styled.div`
    color: #a1a1aa;
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 12px;
`;

// Loading Scanning Animation Styled Components
const scanAnim = keyframes`
    0% { transform: translateY(-100%); }
    100% { transform: translateY(1000%); }
`;

const LoadingRowContainer = styled.div`
    position: relative;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: #000000;
`;

const Laser = styled.div`
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00f3ff, transparent);
    box-shadow: 0 0 8px #00f3ff, 0 0 15px #00f3ff;
    animation: ${scanAnim} 3s infinite linear;
    z-index: 5;
    pointer-events: none;
`;

const ScanOverlay = styled.div`
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(180deg, transparent 0%, rgba(0, 243, 255, 0.02) 50%, transparent 100%);
    pointer-events: none;
    z-index: 4;
`;

const ScanningTextContainer = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    z-index: 10;
    background-color: rgba(0, 0, 0, 0.9);
    border: 1px solid #27272a;
    padding: 20px 40px;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.95);
`;

const pulseText = keyframes`
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
`;

const InterrogatingText = styled.span`
    color: #00f3ff;
    font-size: 11px;
    font-weight: bold;
    letter-spacing: 0.25em;
    animation: ${pulseText} 1.5s infinite ease-in-out;
    text-align: center;
`;

const LoadingRowPlaceholder = styled.div`
    display: grid;
    grid-template-columns: 80px 120px 100px 150px 1fr;
    padding: 16px 24px;
    border-bottom: 1px solid #111115;
    align-items: center;
    opacity: 0.2;
`;

const PlaceholderBlock = styled.div<{ $width: string }>`
    height: 8px;
    width: ${props => props.$width};
    background-color: #27272a;
`;

// ─────────────────────────────────────────────────────────────────────────
// Client Layout Component
// ─────────────────────────────────────────────────────────────────────────

export function VaultClientLayout({ telemetry, initialAliases }: VaultClientLayoutProps) {
    const [query, setQuery] = useState('');
    const [namespace, setNamespace] = useState('ALL');
    const [includeHotWal, setIncludeHotWal] = useState(true);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [activeQuery, setActiveQuery] = useState('');
    const [hoveredTxId, setHoveredTxId] = useState<number | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            const data = await executeUnifiedSearch({
                query,
                namespace,
                include_wal: includeHotWal
            });
            setResults(data);
            setActiveQuery(query);
        } catch (error) {
            console.error("Unified search execution failed:", error);
        } finally {
            setIsSearching(false);
        }
    };

    // Helper to resolve alias or truncate agent_hex
    const getAgentDisplayName = (agentHex: string) => {
        const hexLower = agentHex.toLowerCase();
        const matchedKey = Object.keys(initialAliases || {}).find(
            k => k.toLowerCase() === hexLower
        );
        if (matchedKey && initialAliases[matchedKey]) {
            return initialAliases[matchedKey];
        }
        if (agentHex.length > 8) {
            return `${agentHex.substring(0, 8)}...`;
        }
        return agentHex;
    };

    // Formats transaction id strictly as monospace hex 0x{HEX} padded to 6 chars
    const formatTxId = (txId: number) => {
        return `0x${txId.toString(16).padStart(6, '0').toUpperCase()}`;
    };

    return (
        <LayoutGrid>
            {/* Left Sidebar: Query Engine & Vitals */}
            <Sidebar>
                <SidebarSection>
                    <Title>
                        <Icon className="material-symbols-outlined">manage_search</Icon>
                        Query Engine
                    </Title>
                    <form onSubmit={handleSearch}>
                        <FormGroup>
                            <Label $color="#00f3ff">Semantic Query</Label>
                            <InputWrapper>
                                <SearchIcon className="material-symbols-outlined">search</SearchIcon>
                                <Input 
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="e.g. Find negotiation anomalies..."
                                    disabled={isSearching}
                                />
                            </InputWrapper>
                        </FormGroup>

                        <FormGroup>
                            <Label>Namespace Filter</Label>
                            <SelectWrapper>
                                <Select
                                    value={namespace}
                                    onChange={(e) => setNamespace(e.target.value)}
                                    disabled={isSearching}
                                >
                                    <option value="ALL">ALL_NAMESPACES</option>
                                    <option value="rqm_finance">rqm_finance</option>
                                    <option value="rqm_logistics">rqm_logistics</option>
                                    <option value="rqm_auth">rqm_auth</option>
                                    <option value="rqm_telemetry">rqm_telemetry</option>
                                </Select>
                                <SelectArrow className="material-symbols-outlined">expand_more</SelectArrow>
                            </SelectWrapper>
                        </FormGroup>

                        <FormGroup>
                            <ToggleContainer>
                                <Label style={{ marginBottom: 0, color: '#ffb300' }}>Include Hot WAL Memory</Label>
                                <ToggleButton 
                                    type="button"
                                    $active={includeHotWal}
                                    onClick={() => setIncludeHotWal(!includeHotWal)}
                                    disabled={isSearching}
                                >
                                    <ToggleCircle $active={includeHotWal} />
                                </ToggleButton>
                            </ToggleContainer>
                        </FormGroup>

                        <SubmitButton type="submit" disabled={isSearching || !query.trim()}>
                            {isSearching ? (
                                <>
                                    <Spinner className="material-symbols-outlined">sync</Spinner>
                                    Executing
                                </>
                            ) : (
                                <>
                                    <Icon className="material-symbols-outlined" style={{ fontSize: '14px', color: 'inherit' }}>memory</Icon>
                                    Execute Query
                                </>
                            )}
                        </SubmitButton>
                    </form>
                </SidebarSection>

                <SidebarSectionGrow>
                    <Title>
                        <Icon className="material-symbols-outlined">monitor_heart</Icon>
                        Vault Vitals
                    </Title>
                    <VitalsList>
                        <VitalItem>
                            <VitalLabel>Total Vectors</VitalLabel>
                            <VitalValue>{telemetry.total_vectors.toLocaleString()}</VitalValue>
                        </VitalItem>
                        <VitalItem>
                            <VitalLabel>Index Size</VitalLabel>
                            <VitalValue>{telemetry.index_size_mb.toLocaleString()} MB</VitalValue>
                        </VitalItem>
                        <VitalItem>
                            <VitalLabel>Pending WAL Compaction</VitalLabel>
                            <VitalValue $color="#ffb300">{telemetry.wal_pending_count.toLocaleString()} thoughts</VitalValue>
                        </VitalItem>
                        <VitalItem>
                            <VitalLabel>Densest Namespace</VitalLabel>
                            <VitalValue $color="#00f3ff">{telemetry.densest_namespace}</VitalValue>
                        </VitalItem>
                    </VitalsList>
                </SidebarSectionGrow>
            </Sidebar>

            {/* Main Content Area: Distribution Ribbon & Unified Ledger Table */}
            <MainContentArea>
                {/* Similarity Distribution Ribbon (Max height: 120px) */}
                <RibbonContainer>
                    <RibbonHeader>
                        <RibbonTitle>
                            <Icon className="material-symbols-outlined" style={{ fontSize: '14px' }}>stacked_line_chart</Icon>
                            Similarity Distribution Ribbon
                        </RibbonTitle>
                        {activeQuery && (
                            <RibbonQueryBadge>
                                QUERY: {activeQuery}
                            </RibbonQueryBadge>
                        )}
                    </RibbonHeader>

                    <AxisWrapper>
                        <AxisLine />
                        {results.length > 0 && results.map((res) => {
                            const isHovered = hoveredTxId === res.tx_id;
                            const dotColor = res.source === 'HOT_WAL' ? '#ffb300' : '#06b6d4';
                            return (
                                <DotWrapper 
                                    key={res.tx_id} 
                                    $x={res.similarity_score}
                                    onMouseEnter={() => setHoveredTxId(res.tx_id)}
                                    onMouseLeave={() => setHoveredTxId(null)}
                                >
                                    <PlotDot $color={dotColor} $active={isHovered} />
                                    {isHovered && (
                                        <Tooltip>
                                            <div>TX: {formatTxId(res.tx_id)}</div>
                                            <div>SCORE: {res.similarity_score.toFixed(4)}</div>
                                            <div>SOURCE: {res.source}</div>
                                            <div>AGENT: {getAgentDisplayName(res.agent_hex)}</div>
                                        </Tooltip>
                                    )}
                                </DotWrapper>
                            );
                        })}
                        <AxisTicks>
                            <span>0.0 (Low Similarity)</span>
                            <span>0.5</span>
                            <span>1.0 (Exact Match)</span>
                        </AxisTicks>
                    </AxisWrapper>

                    <RibbonLegend>
                        <LegendItem>
                            <LegendDot $color="#ffb300" />
                            <span>HOT WAL Memory</span>
                        </LegendItem>
                        <LegendItem>
                            <LegendDot $color="#06b6d4" />
                            <span>LANCEDB Persistent</span>
                        </LegendItem>
                    </RibbonLegend>
                </RibbonContainer>

                {/* Unified Ledger Table */}
                <TableContainer>
                    <TableHeader>
                        <TableTitle>
                            <Icon className="material-symbols-outlined" style={{ fontSize: '14px' }}>table_chart</Icon>
                            Unified Ledger
                        </TableTitle>
                        <TableResultsCount>
                            {isSearching ? 'Resolving...' : `${results.length} Nodes Resolved`}
                        </TableResultsCount>
                    </TableHeader>

                    <GridHeaderRow>
                        <GridHeaderCell>Score</GridHeaderCell>
                        <GridHeaderCell>TX_ID</GridHeaderCell>
                        <GridHeaderCell>Source</GridHeaderCell>
                        <GridHeaderCell>Agent</GridHeaderCell>
                        <GridHeaderCell>Payload Preview</GridHeaderCell>
                    </GridHeaderRow>

                    <ScrollableTableBody>
                        {isSearching ? (
                            <LoadingStateView />
                        ) : results.length === 0 ? (
                            <EmptyState>
                                Awaiting Semantic Query...
                            </EmptyState>
                        ) : (
                            results.map((res) => {
                                const isHovered = hoveredTxId === res.tx_id;
                                return (
                                    <GridRow 
                                        key={res.tx_id}
                                        $hovered={isHovered}
                                        onMouseEnter={() => setHoveredTxId(res.tx_id)}
                                        onMouseLeave={() => setHoveredTxId(null)}
                                    >
                                        <ScoreCell>{res.similarity_score.toFixed(4)}</ScoreCell>
                                        <TxIdCell>{formatTxId(res.tx_id)}</TxIdCell>
                                        <SourceCell>
                                            <SourceBadge $source={res.source}>
                                                {res.source}
                                            </SourceBadge>
                                        </SourceCell>
                                        <AgentCell>{getAgentDisplayName(res.agent_hex)}</AgentCell>
                                        <PayloadCell title={res.payload}>{res.payload}</PayloadCell>
                                    </GridRow>
                                );
                            })
                        )}
                    </ScrollableTableBody>
                </TableContainer>
            </MainContentArea>
        </LayoutGrid>
    );
}

// Sub-component for Loading state
function LoadingStateView() {
    return (
        <LoadingRowContainer>
            <Laser />
            <ScanOverlay />
            <ScanningTextContainer>
                <Spinner className="material-symbols-outlined">sync</Spinner>
                <InterrogatingText>[ INTERROGATING VECTORS & WAL... ]</InterrogatingText>
            </ScanningTextContainer>
            {Array.from({ length: 12 }).map((_, i) => (
                <LoadingRowPlaceholder key={i}>
                    <PlaceholderBlock $width="40px" />
                    <PlaceholderBlock $width="70px" />
                    <PlaceholderBlock $width="60px" />
                    <PlaceholderBlock $width="100px" />
                    <PlaceholderBlock $width={`${50 + Math.random() * 30}%`} />
                </LoadingRowPlaceholder>
            ))}
        </LoadingRowContainer>
    );
}
