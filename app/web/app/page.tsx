const appName = process.env.NEXT_PUBLIC_APP_NAME || "Archimedes";

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Welcome to {appName}</h1>
      <p className="text-sm text-slate-300">
        This is the Archimedes application shell. The interface includes a
        header, sidebar navigation, and this content area ready for your
        features.
      </p>
    </div>
  );
}
