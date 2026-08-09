import React from 'react';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-950">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800">
        <h1 className="text-3xl font-bold text-center text-white">Lekòl Pam</h1>
        <p className="text-sm text-center text-slate-400 mt-2">Pòtay Tout Lekòl Yo — MVP v0.1</p>
        <div className="mt-6 space-y-4">
          <input
            type="text"
            placeholder="Telefòn oswa Identifyan"
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
          />
          <button className="w-full py-3 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition-colors">
            Konekte
          </button>
        </div>
      </div>
    </div>
  );
}
