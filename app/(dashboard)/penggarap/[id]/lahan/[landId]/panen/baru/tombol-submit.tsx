"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";

type Props = {
  hrefBatal: string;
};

export function TombolSubmitPanen({ hrefBatal }: Props) {
  const { pending } = useFormStatus();

  return (
    <div className="flex gap-3 pt-2">
      <button
        type="submit"
        disabled={pending}
        className={`font-medium px-6 py-3 rounded-lg transition flex-1 text-white ${
          pending
            ? "bg-green-400 cursor-not-allowed"
            : "bg-green-700 hover:bg-green-800"
        }`}
      >
        {pending ? "⏳ Menyimpan..." : "💾 Simpan Panen"}
      </button>
      <Link
        href={hrefBatal}
        className={`bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-6 py-3 rounded-lg transition ${
          pending ? "pointer-events-none opacity-50" : ""
        }`}
      >
        Batal
      </Link>
    </div>
  );
}
