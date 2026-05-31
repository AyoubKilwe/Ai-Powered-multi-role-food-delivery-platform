import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
          404
        </p>
        <h1 className="mt-3 text-3xl font-black text-stone-900">Page not found</h1>
        <p className="mt-3 text-stone-600">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
