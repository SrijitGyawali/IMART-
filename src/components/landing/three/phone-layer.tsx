"use client";

import { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { Finish } from "../data";

const PhoneCanvas = dynamic(() => import("./phone-canvas"), { ssr: false });

class CanvasBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function PhoneLayer({
  tier,
  initialFinish,
  onReady,
  onError,
}: {
  tier: "high" | "mid";
  initialFinish: Finish | null;
  onReady: () => void;
  onError: () => void;
}) {
  return (
    <div className="phone-layer" aria-hidden="true">
      <CanvasBoundary onError={onError}>
        <PhoneCanvas tier={tier} initialFinish={initialFinish} onReady={onReady} />
      </CanvasBoundary>
    </div>
  );
}
