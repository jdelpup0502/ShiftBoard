import { login } from "@/app/actions/auth";
import AuthForm from "../AuthForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-paper relative overflow-hidden">
      {/* Ember corner wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 w-[460px] h-[460px] rounded-full opacity-60 dark:opacity-40"
        style={{ background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)" }}
      />
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-baseline gap-2 mb-6">
            <span className="wordmark text-[42px] text-ink leading-none">shiftboard</span>
            <span className="w-2 h-2 rounded-full bg-accent translate-y-[-3px]" />
          </div>
          <p className="text-[13px] text-ink-muted uppercase tracking-[0.18em] font-semibold">Sign in to continue</p>
        </div>

        <div className="bg-surface rounded-xl border border-line p-6 md:p-7">
          <AuthForm action={login} submitLabel="Sign in" />
        </div>

        <p className="text-center text-[11px] text-ink-faint mt-6 uppercase tracking-[0.16em]">
          Restaurant scheduling, simplified.
        </p>
      </div>
    </div>
  );
}
