import type { ReactNode } from "react";
import { useTheme } from "../../../app/theme/theme-context";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={`min-h-[calc(100svh-9rem)] w-full font-body ${
        isDark
          ? "bg-[linear-gradient(160deg,#0d1f2b_0%,#10271d_48%,#12161e_100%)] text-stone-100"
          : "bg-[linear-gradient(160deg,#f6f2e8_0%,#f7efe3_42%,#e8efe5_100%)] text-stone-900"
      }`}
    >
      <div className="mx-auto grid min-h-[calc(100svh-9rem)] max-w-6xl grid-cols-1 gap-5 p-4 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:p-10">
        <div
          className={`auth-motion-board relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_25px_60px_-30px_rgba(18,35,27,0.7)] sm:p-8 lg:p-10 ${
            isDark
              ? "border-[#3f7d69]/45 bg-[#0f3b37] text-[#e7f6ef]"
              : "border-[#c77f34]/35 bg-[#214836] text-[#f8f0de]"
          }`}
        >
          <div className="absolute inset-0 opacity-30 [background:linear-gradient(120deg,transparent_0%,transparent_35%,rgba(255,209,140,0.4)_36%,transparent_38%,transparent_100%)]" />
          <div
            className={`absolute -right-20 -top-16 h-64 w-64 rounded-full border ${
              isDark ? "border-[#86d4b8]/25" : "border-[#efd3a5]/30"
            }`}
          />
          <div
            className={`absolute -left-24 bottom-8 h-56 w-56 rounded-full border ${
              isDark ? "border-[#86d4b8]/20" : "border-[#efd3a5]/20"
            }`}
          />

          <div className="relative z-10">
            <p
              className={`font-auth-ui auth-motion-item w-fit rounded-full border px-3 py-1 text-xs tracking-[0.22em] uppercase ${
                isDark
                  ? "border-[#86d4b8]/45 bg-[#86d4b8]/12 text-[#ccf3e4]"
                  : "border-[#efd3a5]/45 bg-[#f8e8cb]/10 text-[#f8dfb3]"
              }`}
            >
              Neighborhood Noticeboard
            </p>
            <h1
              className={`font-auth-display auth-motion-item auth-motion-delay-1 mt-5 max-w-lg text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl ${
                isDark ? "text-[#e9fff4]" : "text-[#fff6e4]"
              }`}
            >
              Built for front porches, block parties, and real neighbors.
            </h1>
            <p
              className={`auth-motion-item auth-motion-delay-2 mt-4 max-w-xl text-base leading-relaxed sm:text-lg ${
                isDark ? "text-[#cdecdc]" : "text-[#f4e4c6]"
              }`}
            >
              Manage dues meetings, weekend socials, and volunteer days in one
              shared space every resident can trust.
            </p>

            <div className="auth-motion-item auth-motion-delay-3 mt-7 grid grid-cols-2 gap-3 sm:max-w-md">
              <div
                className={`rounded-xl border p-3 transition-transform duration-300 hover:-translate-y-0.5 ${
                  isDark
                    ? "border-[#86d4b8]/35 bg-[#8df2c8]/10"
                    : "border-[#efd3a5]/35 bg-[#f4e6c7]/12"
                }`}
              >
                <p
                  className={`font-auth-ui text-xs tracking-[0.14em] uppercase ${
                    isDark ? "text-[#cbf8e5]" : "text-[#f8dfb3]"
                  }`}
                >
                  Monthly
                </p>
                <p className={`mt-1 font-heading text-2xl ${isDark ? "text-[#effff8]" : "text-[#fff6e4]"}`}>12+</p>
                <p className={`text-xs ${isDark ? "text-[#cdecdc]" : "text-[#f4e4c6]"}`}>Events coordinated</p>
              </div>
              <div
                className={`rounded-xl border p-3 transition-transform duration-300 hover:-translate-y-0.5 ${
                  isDark
                    ? "border-[#86d4b8]/35 bg-[#8df2c8]/10"
                    : "border-[#efd3a5]/35 bg-[#f4e6c7]/12"
                }`}
              >
                <p
                  className={`font-auth-ui text-xs tracking-[0.14em] uppercase ${
                    isDark ? "text-[#cbf8e5]" : "text-[#f8dfb3]"
                  }`}
                >
                  Resident reach
                </p>
                <p className={`mt-1 font-heading text-2xl ${isDark ? "text-[#effff8]" : "text-[#fff6e4]"}`}>98%</p>
                <p className={`text-xs ${isDark ? "text-[#cdecdc]" : "text-[#f4e4c6]"}`}>Notified on time</p>
              </div>
            </div>

            <div
              className={`auth-motion-item auth-motion-delay-4 mt-8 rounded-2xl border p-4 shadow-[0_18px_35px_-24px_rgba(0,0,0,0.45)] sm:p-5 ${
                isDark
                  ? "border-[#2f8a70]/55 bg-[#15362f] text-[#dbf8eb]"
                  : "border-[#d28f49]/45 bg-[#f8e9cc] text-[#5b3418]"
              }`}
            >
              <p className="font-auth-ui text-xs tracking-[0.16em] uppercase">This week on your street</p>
              <div className="mt-3 space-y-2 text-sm">
                <p className={`flex items-center justify-between border-b pb-2 ${isDark ? "border-[#2f8a70]/55" : "border-[#d7b087]/60"}`}>
                  <span>Garden Club Walkthrough</span>
                  <span className="font-semibold">Tue 6:30 PM</span>
                </p>
                <p className={`flex items-center justify-between border-b pb-2 ${isDark ? "border-[#2f8a70]/55" : "border-[#d7b087]/60"}`}>
                  <span>Pool Committee Check-in</span>
                  <span className="font-semibold">Thu 7:00 PM</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Summer Block Social</span>
                  <span className="font-semibold">Sat 4:00 PM</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div
            className={`auth-motion-card w-full max-w-xl rounded-[1.8rem] border p-6 shadow-[0_26px_40px_-30px_rgba(76,43,22,0.45)] sm:p-8 lg:p-10 ${
              isDark
                ? "border-[#3a475a]/80 bg-[#111a27]"
                : "border-[#d8b085]/65 bg-[#fffdf8]"
            }`}
          >
            <div className="text-center lg:text-left">
              <div
                aria-hidden="true"
                className={`mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl border font-heading text-lg font-bold shadow-md lg:mx-0 ${
                  isDark
                    ? "border-[#2b8a66] bg-[#1c9b71] text-[#e9fff6]"
                    : "border-[#bd7b39] bg-[#c77f34] text-[#fff5df]"
                }`}
              >
                HOA
              </div>
              <p className={`font-auth-ui text-xs tracking-[0.2em] uppercase ${isDark ? "text-[#8fcfb6]" : "text-[#885425]"}`}>
                Resident Portal Access
              </p>
              <h2 className={`font-auth-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl ${isDark ? "text-[#effff8]" : "text-[#2e1f15]"}`}>
                {title}
              </h2>
              {subtitle && (
                <p className={`mt-2 max-w-lg text-sm leading-relaxed sm:text-base ${isDark ? "text-[#b3c6d9]" : "text-[#745743]"}`}>
                  {subtitle}
                </p>
              )}
            </div>
            <div className={`mt-7 border-t pt-6 ${isDark ? "border-[#2a3646]" : "border-[#ead4bb]"}`}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
