"use client";

import { useEffect } from "react";

export default function MobileAuthPage() {
  useEffect(() => {
    const callback = `io.pllayz.app://login-callback/${window.location.search}${window.location.hash}`;
    window.location.replace(callback);
  }, []);

  return (
    <main className="grid min-h-dvh place-items-center bg-[#f6f8f7] px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-[#e3e9e6] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#e7f7f0] text-2xl font-black text-[#00a86b]">
          P
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#17201d]">
          Opening Pllayz…
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#64706c]">
          Your secure sign-in is returning to the Pllayz app. If nothing happens,
          install the Android app first and open the newest email link again.
        </p>
        <button
          className="mt-6 min-h-12 w-full rounded-xl bg-[#00a86b] px-5 font-semibold text-white"
          onClick={() => {
            const callback = `io.pllayz.app://login-callback/${window.location.search}${window.location.hash}`;
            window.location.assign(callback);
          }}
          type="button"
        >
          Open Pllayz
        </button>
      </section>
    </main>
  );
}
