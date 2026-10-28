import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <main className="space-theme grid min-h-screen place-items-center bg-transparent px-5">
      <div className="relative z-10 max-w-md rounded-2xl border border-[#e9e1d5] bg-white/95 p-8 text-center shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <p className="brand-accent-text font-heading text-6xl font-bold">404</p>
        <h1 className="mt-4 font-heading text-2xl font-semibold text-slate-900 dark:text-white">This page could not be found</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Check the address or return to the company directory.</p>
        <Button asChild className="mt-6"><Link to="/companies">Go to company directory</Link></Button>
      </div>
    </main>
  );
}
