"use client";
import UserComponent from "../components/user/user";

export default function KarnatakaUniletUsersPage() {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-amber-900 flex items-center gap-2">
            <span>👤</span> Karnataka Unilet Users
          </h1>
          <p className="text-xs text-amber-700 mt-1">
            Displaying Karnataka Unilet registered customers and users.
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-600 text-white font-semibold text-xs rounded-full">
          KARNATAKA UNILET SCOPE
        </span>
      </div>
      <UserComponent />
    </div>
  );
}
