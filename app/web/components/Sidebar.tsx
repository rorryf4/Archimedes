import Link from 'next/link';

export default function Sidebar() {
  const navItems = ["Dashboard", "Signals", "Settings"];

  return (
    <nav
      aria-label="Primary navigation"
      className="w-60 bg-slate-950 py-4 px-2"
    >
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 py-2 mb-2">
        Navigation
      </div>
      <ul className="space-y-1">
        <li>
          <Link
            href="/markets"
            className="block w-full text-left text-sm px-3 py-2 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Markets
          </Link>
        </li>
        <li>
          <Link
            href="/tokens"
            className="block w-full text-left text-sm px-3 py-2 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Tokens
          </Link>
        </li>
        {navItems.map((item) => (
          <li key={item}>
            <button
              className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              {item}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
