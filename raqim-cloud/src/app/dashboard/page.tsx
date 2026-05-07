export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border border-zinc-800 rounded-xl bg-zinc-950 shadow-sm">
          <p className="text-sm font-medium text-zinc-400 mb-1">Active Swarms</p>
          <p className="text-3xl font-semibold text-white">12</p>
        </div>
        <div className="p-6 border border-zinc-800 rounded-xl bg-zinc-950 shadow-sm">
          <p className="text-sm font-medium text-zinc-400 mb-1">Total Memories Managed</p>
          <p className="text-3xl font-semibold text-white">4.2M</p>
        </div>
        <div className="p-6 border border-zinc-800 rounded-xl bg-zinc-950 shadow-sm">
          <p className="text-sm font-medium text-zinc-400 mb-1">Network Throughput</p>
          <p className="text-3xl font-semibold text-white">1.4 GB/s</p>
        </div>
      </div>
      <div className="mt-8 p-12 border border-zinc-800/50 border-dashed rounded-xl flex flex-col items-center justify-center text-center">
        <h3 className="text-lg font-medium text-zinc-300 mb-2">No Active Forks</h3>
        <p className="text-zinc-500 text-sm mb-4">Create a reality fork to simulate alternative agent timelines.</p>
        <button className="px-4 py-2 bg-white text-black font-medium text-sm rounded-md hover:bg-zinc-200 transition-colors">
          Initialize Fork
        </button>
      </div>
    </div>
  );
}
