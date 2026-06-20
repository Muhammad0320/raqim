export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-[#00E5FF] font-mono">
      <div className="flex items-center space-x-2 text-lg tracking-widest">
        <span>[ SYSTEM BOOTING... ]</span>
        <span className="w-2.5 h-5 bg-[#00E5FF] animate-pulse"></span>
      </div>
    </div>
  );
}
