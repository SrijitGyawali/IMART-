/* Three-device mockup hero — center phone forward, sides angled back,
   on a dark glowing showcase panel. Screens run a mini iMart storefront. */

function MiniStore() {
  return (
    <div className="pointer-events-none flex h-full select-none flex-col bg-white text-left">
      {/* Dynamic island */}
      <div className="flex justify-center pt-2">
        <div className="h-4 w-16 rounded-full bg-black" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2">
        <div>
          <p className="text-[7px] text-neutral-400">Good Morning,</p>
          <p className="text-[10px] font-semibold text-neutral-900">
            Welcome to iMart 👋
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100">
            <span className="text-[8px]">🔔</span>
            <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-red-500" />
          </div>
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0071E3] text-[7px] font-semibold text-white">
            iM
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mx-3 mt-2 flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1.5">
        <span className="text-[8px] text-neutral-400">🔍</span>
        <span className="text-[7px] text-neutral-400">
          Search phones, accessories…
        </span>
      </div>

      {/* Category chips */}
      <div className="mt-2 flex gap-1 px-3">
        <span className="rounded-full bg-[#0071E3] px-2 py-0.5 text-[7px] font-semibold text-white">
          All
        </span>
        {["iPhone", "Cases", "Audio", "Watch"].map((chip) => (
          <span
            key={chip}
            className="rounded-full bg-neutral-100 px-2 py-0.5 text-[7px] text-neutral-500"
          >
            {chip}
          </span>
        ))}
      </div>

      {/* Trending */}
      <div className="mt-2.5 flex items-center justify-between px-3">
        <p className="text-[9px] font-semibold text-neutral-900">
          Trending Phones
        </p>
        <p className="text-[7px] font-semibold text-[#0071E3]">See All</p>
      </div>
      <div className="mt-1.5 flex gap-2 overflow-hidden pl-3">
        <div className="w-[72%] shrink-0">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-gradient-to-br from-[#007AFF] via-[#5856D6] to-[#AF52DE]">
            <span className="absolute right-1.5 top-1.5 rounded-md bg-black/40 px-1.5 py-0.5 text-[7px] font-semibold text-white backdrop-blur">
              Rs. 185K
            </span>
            <span className="absolute bottom-1.5 left-1.5 rounded-sm bg-[#0071E3] px-1 py-0.5 text-[6px] font-bold uppercase tracking-wide text-white">
              iPhone
            </span>
            <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold tracking-tight text-white">
              15 Pro Max
            </span>
          </div>
          <p className="mt-1 text-[8px] font-semibold text-neutral-900">
            iPhone 15 Pro Max
          </p>
          <p className="text-[6.5px] text-neutral-400">
            📦 Sealed · 📍 Amarpath, Butwal
          </p>
        </div>
        <div className="w-[30%] shrink-0">
          <div className="relative aspect-[10/16] overflow-hidden rounded-lg bg-gradient-to-b from-[#FF9F0A] to-[#FF375F]">
            <span className="absolute bottom-1 left-1 rounded-sm bg-[#AF52DE] px-1 py-0.5 text-[6px] font-bold uppercase text-white">
              Watch
            </span>
          </div>
        </div>
      </div>

      {/* Recommended */}
      <p className="mt-2.5 px-3 text-[9px] font-semibold text-neutral-900">
        Recommended for You
      </p>
      <div className="mx-3 mt-1.5 flex items-center gap-2 rounded-lg bg-neutral-50 p-1.5">
        <div className="h-7 w-7 shrink-0 rounded-md bg-gradient-to-br from-neutral-200 to-neutral-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[8px] font-semibold text-neutral-900">
            AirPods Pro 2
          </p>
          <p className="text-[6.5px] text-neutral-400">USB-C · In stock</p>
        </div>
        <p className="text-[8px] font-semibold text-[#0071E3]">Rs. 32K</p>
      </div>
      <div className="mx-3 mt-1 flex items-center gap-2 rounded-lg bg-neutral-50 p-1.5">
        <div className="h-7 w-7 shrink-0 rounded-md bg-gradient-to-br from-[#BBD7FF] to-[#5AC8FA]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[8px] font-semibold text-neutral-900">
            20W Fast Charger
          </p>
          <p className="text-[6.5px] text-neutral-400">Original · Warranty</p>
        </div>
        <p className="text-[8px] font-semibold text-[#0071E3]">Rs. 3.5K</p>
      </div>

      {/* Bottom nav */}
      <div className="mt-auto flex items-center justify-around border-t border-neutral-100 px-3 py-2">
        <span className="text-[9px] text-[#0071E3]">⌂</span>
        <span className="text-[9px] text-neutral-300">🔍</span>
        <span className="flex h-6 w-6 -translate-y-2 items-center justify-center rounded-full bg-[#0071E3] text-[11px] font-semibold text-white shadow-lg shadow-blue-500/40">
          +
        </span>
        <span className="text-[9px] text-neutral-300">♡</span>
        <span className="text-[9px] text-neutral-300">◎</span>
      </div>
    </div>
  );
}

function PhoneFrame({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-[9/19] overflow-hidden rounded-[2.6rem] border-[3px] border-[#C8C8CD] bg-[#E8E8EC] p-[5px] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.6)] ${className}`}
    >
      {/* Side buttons */}
      <div className="absolute -left-[5px] top-[22%] h-8 w-[3px] rounded-full bg-[#B0B0B6]" />
      <div className="absolute -left-[5px] top-[34%] h-12 w-[3px] rounded-full bg-[#B0B0B6]" />
      <div className="absolute -right-[5px] top-[26%] h-14 w-[3px] rounded-full bg-[#B0B0B6]" />
      <div className="h-full w-full overflow-hidden rounded-[2.2rem] bg-white">
        <MiniStore />
      </div>
    </div>
  );
}

export function PhoneTrio() {
  return (
    <div className="noise relative overflow-hidden rounded-3xl bg-[#0B0B0F] px-6 pb-0 pt-14 sm:px-10">
      {/* Glow corners — echoes the brand gradient on the dark panel */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full opacity-40 blur-[100px]"
        style={{ background: "#AF52DE" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full opacity-30 blur-[100px]"
        style={{ background: "#FF9F0A" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-32 h-80 w-80 rounded-full opacity-25 blur-[100px]"
        style={{ background: "#007AFF" }}
      />

      {/* Ambient particles */}
      {[
        { left: "12%", top: "22%", size: 3, delay: "0s", opacity: 0.5 },
        { left: "24%", top: "58%", size: 2, delay: "2.2s", opacity: 0.35 },
        { left: "42%", top: "14%", size: 2, delay: "4s", opacity: 0.4 },
        { left: "68%", top: "20%", size: 3, delay: "1.1s", opacity: 0.5 },
        { left: "82%", top: "52%", size: 2, delay: "3.4s", opacity: 0.35 },
        { left: "90%", top: "30%", size: 2, delay: "5.2s", opacity: 0.3 },
      ].map((p) => (
        <span
          key={p.left + p.top}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDelay: p.delay,
          }}
        />
      ))}

      <div className="relative mx-auto flex max-w-3xl items-end justify-center">
        {/* Light pooling under the center phone */}
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 h-24 w-96 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "rgba(0, 122, 255, 0.35)" }}
        />

        {/* Left phone — pushed back with depth-of-field */}
        <div
          className="fade-up relative top-10 z-10 hidden w-52 -rotate-6 opacity-75 sm:block sm:-mr-16 lg:w-60"
          style={{ "--delay": "0.35s" } as React.CSSProperties}
        >
          <div
            className="float"
            style={{ animationDelay: "1.2s", filter: "blur(1.5px)" }}
          >
            <PhoneFrame />
          </div>
        </div>

        {/* Center phone — in focus */}
        <div
          className="fade-up relative z-20 w-60 lg:w-72"
          style={{ "--delay": "0.2s" } as React.CSSProperties}
        >
          <div className="float">
            <PhoneFrame />
          </div>
        </div>

        {/* Right phone — pushed back with depth-of-field */}
        <div
          className="fade-up relative top-10 z-10 hidden w-52 rotate-6 opacity-75 sm:block sm:-ml-16 lg:w-60"
          style={{ "--delay": "0.5s" } as React.CSSProperties}
        >
          <div
            className="float"
            style={{ animationDelay: "2.4s", filter: "blur(1.5px)" }}
          >
            <PhoneFrame />
          </div>
        </div>
      </div>

      {/* Fade the phones into the panel edge */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0B0B0F] to-transparent" />
    </div>
  );
}
