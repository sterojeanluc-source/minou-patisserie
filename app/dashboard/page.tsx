import React from 'react';

export default function DashboardPage() {
  return (
    <div className="p-6 bg-slate-950 min-h-screen text-white">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Lekòl Pam Dashboard</h1>
          <p className="text-sm text-slate-400">Byenveni nan biwo prensipal la</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-sm text-slate-400">Total Elèv</p>
          <p className="text-3xl font-bold mt-2">150</p>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-sm text-slate-400">Pwofesè Yo</p>
          <p className="text-3xl font-bold mt-2">12</p>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-sm text-slate-400">Prezans Jodi a</p>
          <p className="text-3xl font-bold mt-2 text-emerald-500">94%</p>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-sm text-slate-400">Peman Mwa Sa a</p>
          <p className="text-3xl font-bold mt-2 text-amber-500">245,000 HTG</p>
        </div>
      </div>
    </div>
  );
}
