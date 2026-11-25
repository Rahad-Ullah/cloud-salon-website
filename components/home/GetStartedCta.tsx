"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function GetStartedCta() {
  return (
    <section className="w-full bg-[#F4EBE0] dark:bg-[#151413] py-10 sm:py-24 lg:py-28 transition-colors duration-200 select-none">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-3 sm:space-y-4"
        >
          {/* Main Headline */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.12] text-[#1C1C1E] dark:text-white tracking-tight">
            Ready to Experience <br />
            <span className="text-[#B98C44] dark:text-[#D99722]">
              The Cloud Salon?
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#66635D] dark:text-zinc-400 font-normal leading-relaxed max-w-xl mx-auto pt-1 pb-4 sm:pb-6">
            Create your account in less than a minute. Whether you&apos;re here to book verified beauty professionals, lease a salon chair, or grow your business, we&apos;re glad to have you with us.
          </p>

          {/* Action CTA */}
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 sm:gap-4 pt-1">
              <Link
                href="/register"
                className="px-7 sm:px-9 py-3.5 rounded-lg bg-gray-100 dark:bg-[#242322] hover:bg-[#D5D0C7] dark:hover:bg-[#2F2E2C] text-[#222222] dark:text-zinc-200 text-xs sm:text-sm font-medium transition-colors shadow-2xs border border-black/5 dark:border-white/10 text-center shrink-0 cursor-pointer"
              >
                GET STARTED
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
