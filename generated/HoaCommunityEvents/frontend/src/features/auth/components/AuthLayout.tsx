import type { ReactNode } from "react";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-[calc(100svh-9rem)] w-full font-body text-stone-900">
      <div className="grid min-h-[calc(100svh-9rem)] grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden rounded-2xl bg-emerald-700 p-12 text-white lg:flex lg:flex-col lg:justify-center lg:items-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#6ee7b7_0%,transparent_65%)] opacity-20" />
          <div className="relative z-10 max-w-md text-center">
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-xl bg-white font-heading text-2xl font-bold text-emerald-700 shadow-xl">
              HOA
            </div>
            <h1 className="font-heading text-4xl font-bold text-emerald-50">
              Community Events
            </h1>
            <p className="mt-4 text-lg text-emerald-100">
              Connect, engage, and stay in sync with neighborhood activities.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 sm:p-8 lg:p-12">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm lg:border-none lg:bg-transparent lg:shadow-none">
            <div className="text-center lg:text-left">
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 font-heading text-xl font-bold text-white shadow-md lg:hidden">
                HOA
              </div>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-stone-900">
                {title}
              </h2>
              {subtitle && <p className="mt-2 text-stone-500">{subtitle}</p>}
            </div>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
