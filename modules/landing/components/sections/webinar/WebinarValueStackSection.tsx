"use client";

import { cn } from "@lib/utils/style";

import { SectionWrapper, GoldLine } from "../../shared";

// SVG Icons
function TemplateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6zm2-6h8v2H8v-2zm0 4h5v2H8v-2z" />
    </svg>
  );
}

function ScoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8-1.41-1.42z" />
    </svg>
  );
}

function EquationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2V9h-2V7h4v10z" />
    </svg>
  );
}

function QAIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
    </svg>
  );
}

const VALUE_ITEMS = [
  {
    icon: TemplateIcon,
    title: "The 10-Minute Morning Practice Template",
    description:
      "The exact routine I've done for 497 consecutive days. Not theory — the actual template you'll use tomorrow.",
    badge: "INSTANT ACCESS",
  },
  {
    icon: ScoreIcon,
    title: "Your Five Pillar Score",
    description:
      "The 2-minute assessment that reveals which pillar is silently sabotaging the other four.",
    badge: "TAKE IT NOW",
  },
  {
    icon: EquationIcon,
    title: "The Emptiness Equation",
    description:
      "The mathematical reason high achievers feel hollow — and the simple formula that fixes it.",
    badge: "FRAMEWORK",
  },
  {
    icon: QAIcon,
    title: "Live Q&A Access",
    description: "Ask me anything. I keep it to 100 seats so I can actually answer your questions.",
    badge: "LIVE ONLY",
  },
];

export default function WebinarValueStackSection() {
  return (
    <SectionWrapper variant="card" className="py-16 md:py-24">
      <div className="mx-auto max-w-[900px]">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="bg-lp-gold text-lp-black font-oswald inline-block px-4 py-1 text-xs font-medium tracking-widest uppercase">
            What You&apos;ll Walk Away With
          </span>
          <h2 className="font-bebas text-lp-white mt-6 text-3xl md:text-4xl lg:text-5xl">
            Not Motivation. <span className="text-lp-gold-light">Actual Tools.</span>
          </h2>
          <p className="font-oswald text-lp-gray mx-auto mt-4 max-w-[500px] text-base font-extralight">
            Everything you need to implement the practice starting tomorrow morning.
          </p>
          <GoldLine variant="center" className="mt-6" />
        </div>

        {/* Value Stack */}
        <div className="space-y-4">
          {VALUE_ITEMS.map((item, index) => (
            <div
              key={item.title}
              className={cn(
                "relative",
                "bg-lp-dark border-lp-border border",
                "p-6 md:p-8",
                "flex flex-col gap-4 md:flex-row md:items-center md:gap-6",
                "group",
                "hover:border-lp-gold/50 transition-colors duration-300"
              )}
            >
              {/* Number */}
              <div className="font-bebas text-lp-gold/20 absolute top-4 right-4 text-4xl md:static md:text-5xl">
                {String(index + 1).padStart(2, "0")}
              </div>

              {/* Icon */}
              <div className="bg-lp-gold/10 border-lp-gold/30 flex h-14 w-14 shrink-0 items-center justify-center border">
                <item.icon className="text-lp-gold h-7 w-7" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h3 className="font-bebas text-lp-white text-xl md:text-2xl">{item.title}</h3>
                  <span className="bg-lp-gold/10 text-lp-gold-light border-lp-gold/30 border px-2 py-0.5 text-[10px] font-medium tracking-wider">
                    {item.badge}
                  </span>
                </div>
                <p className="font-oswald text-lp-gray text-sm leading-relaxed font-extralight">
                  {item.description}
                </p>
              </div>

              {/* Checkmark */}
              <div className="text-lp-gold/30 group-hover:text-lp-gold hidden shrink-0 transition-colors md:block">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Value Statement */}
        <div className="mt-10 text-center">
          <div className="bg-lp-card border-lp-gold/30 inline-block border px-8 py-4">
            <p className="font-oswald text-lp-muted text-sm font-extralight">
              Total Value: <span className="text-lp-white line-through">Priceless</span>
            </p>
            <p className="font-bebas text-lp-gold-light mt-1 text-3xl">Your Investment: FREE</p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
