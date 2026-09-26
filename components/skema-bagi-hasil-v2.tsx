"use client";

import { useState } from "react";

type Props = {
  onChange?: (persenOwner: number) => void;
  nameField?: string;
};

export function SkemaBagiHasilV2({
  onChange,
  nameField = "persen_owner",
}: Props) {
  const [skema, setSkema] = useState("50");
  const [ownerNum, setOwnerNum] = useState(50);
  const [inputKey, setInputKey] = useState(0);

  const penggarapNum = 100 - ownerNum;

  function handleSkemaChange(value: string) {
    setSkema(value);
    if (value !== "custom") {
      const num = parseInt(value, 10);
      setOwnerNum(num);
      if (onChange) onChange(num);
    } else {
      setOwnerNum(0);
      if (onChange) onChange(0);
      setInputKey((prev) => prev + 1);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    let num = raw === "" ? 0 : parseInt(raw, 10);
    if (isNaN(num)) num = 0;
    if (num > 100) num = 100;
    if (num < 0) num = 0;
    setOwnerNum(num);
    if (onChange) onChange(num);
  }

  function handleClear() {
    setOwnerNum(0);
    if (onChange) onChange(0);
    setInputKey((prev) => prev + 1);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        💰 Skema Bagi Hasil
      </label>

      <select
        value={skema}
        onChange={(e) => handleSkemaChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <option value="50">50 : 50 (Owner : Penggarap)</option>
        <option value="60">60 : 40 (Owner : Penggarap)</option>
        <option value="70">70 : 30 (Owner : Penggarap)</option>
        <option value="100">100 : 0 (Owner garap sendiri)</option>
        <option value="custom">⚙️ Custom (input manual)</option>
      </select>

      {skema === "custom" && (
        <div className="mt-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
          <p className="text-xs font-semibold text-yellow-800 mb-2">
            ⚙️ Atur Persentase Bagi Hasil Custom:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Owner (%)
              </label>
              <div className="flex gap-1.5">
                <input
                  key={inputKey}
                  type="number"
                  inputMode="numeric"
                  defaultValue={ownerNum === 0 ? "" : ownerNum}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="1"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-bold text-center text-lg"
                />
                <button
                  type="button"
                  onClick={handleClear}
                  className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-2.5 rounded-lg transition"
                  title="Kosongkan"
                >
                  ✕
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Penggarap (%)
              </label>
              <input
                type="number"
                value={penggarapNum}
                readOnly
                placeholder="0"
                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 font-bold text-center text-lg cursor-not-allowed"
              />
            </div>
          </div>
          <p className="text-[11px] text-yellow-700 mt-2 text-center">
            Tap ✕ kalau mau hapus, lalu ketik angka
          </p>
        </div>
      )}

      {skema !== "custom" && (
        <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800">
          Owner: <strong>{ownerNum}%</strong> &middot; Penggarap:{" "}
          <strong>{penggarapNum}%</strong>
        </div>
      )}

      <input type="hidden" name={nameField} value={ownerNum} />
    </div>
  );
}
