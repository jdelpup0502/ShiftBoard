import { requireUser } from "@/lib/auth";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div className="max-w-lg space-y-8 md:space-y-10">
      <div>
        <h1 className="display text-[34px] md:text-[44px] text-ink leading-none">Account</h1>
        <p className="text-[13px] text-ink-muted mt-3">Manage your profile and password.</p>
      </div>

      {/* Identity card */}
      <div className="flex items-center gap-4 bg-surface border border-line rounded-xl p-5">
        <div className="w-14 h-14 rounded-full bg-accent text-accent-fg flex items-center justify-center text-[22px] font-semibold uppercase shrink-0">
          {user.name[0]}
        </div>
        <div className="min-w-0">
          <div className="text-[17px] font-semibold text-ink truncate">{user.name}</div>
          <div className="text-[13px] text-ink-muted truncate">{user.email}</div>
          {(user.role === "MANAGER" || user.isAdmin) && (
            <span className="mt-1.5 inline-block text-[10px] font-semibold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-sm bg-accent-soft text-accent">
              {user.isAdmin ? "Admin" : "Manager"}
            </span>
          )}
        </div>
      </div>

      {/* Profile section */}
      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-3">Profile</h2>
        <div className="bg-surface rounded-xl border border-line p-5 md:p-6">
          <ProfileForm name={user.name} email={user.email} />
        </div>
      </section>

      {/* Password section */}
      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted mb-3">Change password</h2>
        <div className="bg-surface rounded-xl border border-line p-5 md:p-6">
          <PasswordForm />
        </div>
      </section>
    </div>
  );
}
