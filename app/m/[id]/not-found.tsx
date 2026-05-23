import Link from "next/link";

export default function MemeNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <p className="text-6xl">🪲</p>
      <h1 className="mt-6 font-display text-4xl font-bold text-on-surface">404</h1>
      <p className="mt-2 font-display text-xl font-semibold text-on-surface">
        Meme not found
      </p>
      <p className="mt-2 max-w-xs text-sm text-on-surface-variant">
        This meme may have been removed or the link is broken.
      </p>
      <Link
        href="/"
        className="mt-8 flex min-h-11 items-center rounded-btn bg-secondary px-6 font-semibold
                   text-on-secondary transition-all hover:-translate-y-0.5 active:scale-95"
      >
        Make your own →
      </Link>
    </div>
  );
}
