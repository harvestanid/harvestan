"use client";

import { useEffect } from "react";

export function PointerCaptureGuard() {
  useEffect(() => {
    const proto = Element.prototype as any;
    const original = proto.releasePointerCapture;
    if (typeof original !== "function") return;

    proto.releasePointerCapture = function (this: Element, pointerId: number) {
      try {
        if (
          typeof this.hasPointerCapture === "function" &&
          !this.hasPointerCapture(pointerId)
        ) {
          return;
        }
      } catch {
        return;
      }

      try {
        return original.call(this, pointerId);
      } catch (err) {
        if (err instanceof DOMException && err.name === "NotFoundError") {
          return;
        }
        throw err;
      }
    };

    return () => {
      proto.releasePointerCapture = original;
    };
  }, []);

  return null;
}
