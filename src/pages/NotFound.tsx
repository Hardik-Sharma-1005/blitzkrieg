import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return <main className="space-theme grid min-h-screen place-items-center bg-slate-50 px-5"><div className="max-w-md text-center"><p className="brand-accent-text font-heading text-6xl font-bold">404</p><h1 className="mt-4 font-heading text-2xl font-semibold text-slate-900">This page could not be found</h1><p className="mt-2 text-sm text-slate-500">Check the address or return to the company directory.</p><Button asChild className="mt-6"><Link to="/">Go to company directory</Link></Button></div></main>;
}
