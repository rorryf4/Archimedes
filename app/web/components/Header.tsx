const appName = process.env.NEXT_PUBLIC_APP_NAME || "Archimedes";

export default function Header() {
  return (
    <header
      role="banner"
      aria-label="Application header"
      className="h-14 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800"
    >
      <div className="text-base font-semibold">{appName}</div>
      <div className="text-sm text-slate-300">User</div>
    </header>
  );
}
