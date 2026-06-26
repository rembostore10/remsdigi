"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto mt-6">

      <motion.div

        initial={{ opacity: 0, y: 50 }}

        animate={{ opacity: 1, y: 0 }}

        transition={{ duration: .8 }}

        className="rounded-3xl p-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white"

      >

        <h1 className="text-5xl font-bold">

          Marketplace Digital Indonesia

        </h1>

        <p className="mt-5 text-xl">

          Aplikasi Premium • SMM • Pulsa • Kuota • Topup Game • E-Wallet

        </p>

      </motion.div>

    </section>
  );
}
