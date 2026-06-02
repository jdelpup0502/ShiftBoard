import { requireUser } from "@/lib/auth";
import { UserCircleIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Account</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your profile and password.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-2xl font-bold text-white uppercase shrink-0">
          {user.name[0]}
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user.name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
          {user.role === "MANAGER" && (
            <span className="mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              Manager
            </span>
          )}
        </div>
      </div>

      {/* Profile section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <UserCircleIcon className="w-5 h-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
        </div>
        <ProfileForm name={user.name} email={user.email} />
      </div>

      {/* Password section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <LockClosedIcon className="w-5 h-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Change Password</h2>
        </div>
        <PasswordForm />
      </div>
    </div>
  );
}
