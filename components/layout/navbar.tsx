"use client";

import { Search, ShoppingCart, User } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-center gap-4 p-4">

        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
          RemsDigi
        </h1>

        <div className="flex-1 relative">

          <Search
            className="absolute left-4 top-3 text-gray-400"
            size={20}
          />

          <input
            className="w-full rounded-full border border-gray-300 py-3 pl-12 pr-4 outline-none focus:border-blue-500"
            placeholder="Cari aplikasi premium, topup game, pulsa..."
          />

        </div>

        <ShoppingCart className="cursor-pointer" />

        <User className="cursor-pointer" />

      </div>
    </header>
  );
}
