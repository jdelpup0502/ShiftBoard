import { login } from "@/app/actions/auth";
import AuthForm from "../AuthForm";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg mb-4">
            <CalendarDaysIcon className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-black dark:text-white">ShiftBoard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
          <AuthForm action={login} submitLabel="Sign in" />
        </div>
      </div>
    </div>
  );
}
