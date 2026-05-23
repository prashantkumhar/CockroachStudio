import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <p className="text-6xl">🪲</p>
      <h1 className="mt-6 font-display text-4xl font-bold text-on-surface">404</h1>
      <p className="mt-2 font-display text-xl font-semibold text-on-surface">
        This meme doesn&apos;t exist
      </p>
      <p className="mt-2 max-w-xs text-sm text-on-surface-variant">
        It may have been deleted, or the link is wrong. Make your own instead.
      </p>
      <Link
        href="/"
        className="mt-8 flex min-h-11 items-center rounded-btn bg-secondary px-6 font-semibold
                   text-on-secondary transition-all hover:-translate-y-0.5 active:scale-95"
      >
        Make a meme →
      </Link>
    </div>
  );
}
