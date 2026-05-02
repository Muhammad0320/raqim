'use client';
import { MainLayout } from '../../components/Layout/MainLayout';
import { useState } from 'react';
import { SemanticConstellation, SearchResult } from '../../components/Vault/SemanticConstellation';

interface VaultTelemetry {
    total_vectors: number;
    index_size_mb: number;
    wal_pending_count: number;
    densest_namespace: string;
}

const MOCK_TELEMETRY: VaultTelemetry = {
    total_vectors: 14892041,
    index_size_mb: 4251,
    wal_pending_count: 12041,
    densest_namespace: "rqm_finance (45%)"
};

const generateMockResults = (query: string, includeHotWal: boolean): SearchResult[] => {
  const count = Math.floor(Math.random() * 15) + 15; // 15 to 30 results
  const results: SearchResult[] = [];
  const namespaces = ['rqm_finance', 'rqm_logistics', 'rqm_auth', 'rqm_telemetry'];
  const agents = ['AX-901', 'KR-442', 'US-110', 'BR-771', 'X-RAY', 'DELTA-9'];
  
  for(let i = 0; i < count; i++) {
     const isWal = includeHotWal && Math.random() > 0.7;
     results.push({
        tx_id: Math.floor(Math.random() * 900000) + 100000,
        agent_hex: agents[Math.floor(Math.random() * agents.length)],
        namespace: namespaces[Math.floor(Math.random() * namespaces.length)],
        similarity_score: 0.1 + (Math.random() * 0.85), // 0.1 to 0.95
        source: isWal ? "HOT_WAL" : "LANCEDB",
        payload: `{"action": "observe", "context": "${query.substring(0, 12)}", "ref": "${Math.random().toString(36).substring(7)}" }`,
        timestamp: new Date(Date.now() - Math.random() * 100000000).toISOString()
     });
  }
  
  return results.sort((a,b) => b.similarity_score - a.similarity_score);
};

export default function VaultPage() {
  const [query, setQuery] = useState('');
  const [namespace, setNamespace] = useState('ALL');
  const [includeHotWal, setIncludeHotWal] = useState(true);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeQuery, setActiveQuery] = useState('');
  const [hoveredTxId, setHoveredTxId] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    // Simulate network delay
    setTimeout(() => {
      setResults(generateMockResults(query, includeHotWal));
      setActiveQuery(query);
      setIsSearching(false);
    }, 600);
  };

  return (
    <MainLayout title="Audit Vault">
      <div className="flex-1 p-6 overflow-hidden min-h-0 bg-zinc-950">
        <div className="grid grid-cols-12 gap-6 h-full" style={{ gridTemplateRows: 'minmax(0, 45%) minmax(0, 1fr)' }}>
          
          {/* ── Pane 1: Left Sidebar (3/12 width) ── */}
          <div className="col-span-3 row-span-2 bg-zinc-900 border border-zinc-800 flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="font-mono text-sm text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">manage_search</span>
                Query Engine
              </h2>
              
              <form onSubmit={handleSearch} className="flex flex-col gap-5">
                <div>
                  <label className="font-mono text-[10px] text-[#00f3ff] uppercase tracking-widest block mb-2 font-bold">Semantic Query</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-500 text-sm">search</span>
                    <input 
                      type="text" 
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full bg-zinc-950 text-white font-mono text-sm py-2 pl-9 pr-3 border border-zinc-700 focus:border-[#00f3ff] focus:ring-1 focus:ring-[#00f3ff] focus:outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] placeholder:text-zinc-600" 
                      placeholder="e.g. Find negotiation anomalies..."
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block mb-2">Namespace Filter</label>
                  <div className="relative">
                    <select 
                      value={namespace}
                      onChange={(e) => setNamespace(e.target.value)}
                      className="w-full bg-zinc-950 text-zinc-300 font-mono text-sm py-2 px-3 border border-zinc-700 focus:border-[#00f3ff] focus:outline-none appearance-none"
                    >
                      <option value="ALL">ALL_NAMESPACES</option>
                      <option value="rqm_finance">rqm_finance</option>
                      <option value="rqm_logistics">rqm_logistics</option>
                      <option value="rqm_auth">rqm_auth</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-zinc-500 text-sm pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 p-3 bg-zinc-950 border border-zinc-800 rounded-sm">
                  <span className="font-mono text-[10px] text-[#ffb300] uppercase tracking-widest font-bold">Include Hot WAL Memory</span>
                  <button 
                    type="button"
                    onClick={() => setIncludeHotWal(!includeHotWal)}
                    className={`w-8 h-4 rounded-full relative transition-colors ${includeHotWal ? 'bg-[#ffb300]/30' : 'bg-zinc-700'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform ${includeHotWal ? 'translate-x-4 bg-[#ffb300] shadow-[0_0_8px_rgba(255,179,0,0.8)]' : 'bg-zinc-500'}`}></div>
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={isSearching}
                  className="mt-4 w-full bg-[#00f3ff]/10 hover:bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/50 font-mono text-xs py-3 uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,243,255,0.15)] hover:shadow-[0_0_25px_rgba(0,243,255,0.3)] disabled:opacity-50 font-bold flex justify-center items-center gap-2"
                >
                  {isSearching ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">memory</span>}
                  Execute Query
                </button>
              </form>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <h2 className="font-mono text-sm text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">monitor_heart</span>
                Vault Vitals
              </h2>
              
              <ul className="flex flex-col gap-4 font-mono text-xs">
                <li className="flex flex-col gap-1 border-b border-zinc-800/50 pb-3">
                  <span className="text-zinc-500 uppercase tracking-widest text-[9px]">Total Vectors</span>
                  <span className="text-zinc-200">{MOCK_TELEMETRY.total_vectors.toLocaleString()}</span>
                </li>
                <li className="flex flex-col gap-1 border-b border-zinc-800/50 pb-3">
                  <span className="text-zinc-500 uppercase tracking-widest text-[9px]">Index Size</span>
                  <span className="text-zinc-200">{MOCK_TELEMETRY.index_size_mb.toLocaleString()} MB</span>
                </li>
                <li className="flex flex-col gap-1 border-b border-zinc-800/50 pb-3">
                  <span className="text-zinc-500 uppercase tracking-widest text-[9px]">Pending WAL Compaction</span>
                  <span className="text-[#ffb300] font-bold drop-shadow-[0_0_5px_rgba(255,179,0,0.5)]">{MOCK_TELEMETRY.wal_pending_count.toLocaleString()} thoughts</span>
                </li>
                <li className="flex flex-col gap-1">
                  <span className="text-zinc-500 uppercase tracking-widest text-[9px]">Densest Namespace</span>
                  <span className="text-[#00f3ff]">{MOCK_TELEMETRY.densest_namespace}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ── Pane 2: Semantic Constellation (Top Right) ── */}
          <div className="col-span-9 row-span-1 bg-zinc-900 border border-zinc-800 relative flex flex-col min-h-0 overflow-hidden">
            <div className="bg-zinc-950 border-b border-zinc-800 px-4 py-2 shrink-0 flex justify-between items-center z-10 relative">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">share</span>
                Semantic Constellation
              </span>
              {activeQuery && <span className="font-mono text-[9px] text-[#00f3ff] bg-[#00f3ff]/10 px-2 py-0.5 rounded border border-[#00f3ff]/30">QUERY: {activeQuery}</span>}
            </div>
            <div className="flex-1 relative overflow-hidden">
              <SemanticConstellation 
                results={results} 
                queryText={activeQuery}
                hoveredTxId={hoveredTxId}
                onHover={setHoveredTxId}
              />
            </div>
          </div>

          {/* ── Pane 3: Unified Ledger (Bottom Right) ── */}
          <div className="col-span-9 row-span-1 bg-zinc-900 border border-zinc-800 flex flex-col min-h-0 overflow-hidden">
            <div className="bg-zinc-950 border-b border-zinc-800 px-4 py-2 shrink-0 flex justify-between items-center">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">table_chart</span>
                Unified Ledger
              </span>
              <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">{results.length} Nodes Resolved</span>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-zinc-950">
              <div className="grid grid-cols-12 px-4 py-2 border-b border-zinc-800 bg-zinc-900 shrink-0">
                <div className="col-span-1 font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Score</div>
                <div className="col-span-2 font-mono text-[9px] text-zinc-500 uppercase tracking-widest">TX_ID</div>
                <div className="col-span-2 font-mono text-[9px] text-zinc-500 uppercase tracking-widest text-center">Source</div>
                <div className="col-span-2 font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Agent</div>
                <div className="col-span-5 font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Payload Preview</div>
              </div>

              <div className="flex-1 overflow-y-auto font-mono text-xs">
                {results.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                     <span className="text-zinc-600 uppercase tracking-widest text-[10px]">Awaiting Semantic Query...</span>
                  </div>
                ) : (
                  results.map(res => (
                    <div 
                      key={res.tx_id}
                      onMouseEnter={() => setHoveredTxId(res.tx_id)}
                      onMouseLeave={() => setHoveredTxId(null)}
                      className={`grid grid-cols-12 px-4 py-3 border-b border-zinc-800/50 cursor-pointer transition-colors items-center ${hoveredTxId === res.tx_id ? 'bg-zinc-900 border-l-2 border-l-[#00f3ff]' : 'hover:bg-zinc-900 border-l-2 border-l-transparent'}`}
                    >
                      <div className="col-span-1 text-white font-bold">{res.similarity_score.toFixed(2)}</div>
                      <div className="col-span-2 text-zinc-500">0x{res.tx_id.toString(16).padStart(6, '0').toUpperCase()}</div>
                      <div className="col-span-2 flex justify-center">
                        <span className={`text-[9px] px-2 py-0.5 border inline-block ${res.source === 'HOT_WAL' ? 'text-[#ffb300] bg-[#ffb300]/10 border-[#ffb300]/30' : 'text-[#00f3ff] bg-[#00f3ff]/10 border-[#00f3ff]/30'}`}>
                          {res.source}
                        </span>
                      </div>
                      <div className="col-span-2 text-zinc-300">{res.agent_hex}</div>
                      <div className="col-span-5 text-zinc-400 truncate pr-4">{res.payload}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </MainLayout>
  );
}
