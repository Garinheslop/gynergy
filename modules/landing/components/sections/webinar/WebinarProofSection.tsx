"use client";

import { cn } from "@lib/utils/style";

import { WEBINAR_PROOF_CONTENT, WEBINAR_TESTIMONIALS } from "../../../data/webinar-content";
import { SectionWrapper, SectionLabel, GoldLine } from "../../shared";

export default function WebinarProofSection() {
  return (
    <SectionWrapper variant="dark" className="py-16 md:py-24">
      <div className="mx-auto max-w-[1100px]">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <SectionLabel centered>Real Results From Real Men</SectionLabel>
          <h2 className="font-bebas text-lp-white mb-4 text-3xl md:text-4xl lg:text-5xl">
            They Felt The Same Way.{" "}
            <span className="text-lp-gold-light">Then They Did Something.</span>
          </h2>
          <GoldLine variant="center" />
        </div>

        {/* Featured Quote */}
        <div className="relative mb-12 text-center">
          {/* Opening quote mark */}
          <span className="font-bebas text-lp-gold/20 absolute -top-8 left-0 text-7xl md:-left-4 md:text-8xl">
            &ldquo;
          </span>

          <blockquote className="font-oswald text-lp-white relative z-10 text-xl leading-relaxed font-light italic md:text-2xl lg:text-3xl">
            {WEBINAR_PROOF_CONTENT.quote}
          </blockquote>

          {/* Closing quote mark */}
          <span className="font-bebas text-lp-gold/20 absolute right-0 -bottom-12 text-7xl md:-right-4 md:text-8xl">
            &rdquo;
          </span>
        </div>

        {/* Author */}
        <div className="mb-12 text-center">
          <p className="font-bebas text-lp-gold-light text-xl">{WEBINAR_PROOF_CONTENT.author}</p>
          <p className="font-oswald text-lp-muted text-sm font-extralight">
            {WEBINAR_PROOF_CONTENT.role}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-16 flex flex-wrap items-center justify-center gap-6 md:gap-12">
          {WEBINAR_PROOF_CONTENT.stats.map((stat, index) => (
            <div key={stat.label} className="flex items-center gap-6">
              <div className="text-center">
                <p className="font-bebas text-lp-gold-light text-3xl md:text-4xl">{stat.value}</p>
                <p className="font-oswald text-lp-muted text-xs font-extralight tracking-wider uppercase">
                  {stat.label}
                </p>
              </div>
              {index < WEBINAR_PROOF_CONTENT.stats.length - 1 && (
                <div className="bg-lp-gold/20 h-8 w-px" />
              )}
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {WEBINAR_TESTIMONIALS.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className={cn(
                "bg-lp-card border-lp-border border",
                "p-6",
                "relative",
                "group",
                // First testimonial spans 2 columns on larger screens
                index === 0 && "md:col-span-2 lg:col-span-1"
              )}
            >
              {/* Result Badge */}
              <div className="bg-lp-gold/10 border-lp-gold/30 mb-4 inline-block border px-3 py-1">
                <span className="font-oswald text-lp-gold-light text-xs font-medium tracking-wider uppercase">
                  {testimonial.result}
                </span>
              </div>

              {/* Quote */}
              <p className="font-oswald text-lp-white mb-4 text-sm leading-relaxed font-light">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                {/* Avatar placeholder - gold circle with initial */}
                <div className="bg-lp-gold/20 border-lp-gold/40 flex h-10 w-10 items-center justify-center rounded-full border">
                  <span className="font-bebas text-lp-gold-light text-lg">
                    {testimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-oswald text-lp-white text-sm font-medium">
                    {testimonial.author}
                  </p>
                  <p className="font-oswald text-lp-muted text-xs font-extralight">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              {/* Hover accent */}
              <div
                className={cn(
                  "absolute right-0 bottom-0 left-0 h-[2px]",
                  "via-lp-gold/50 bg-gradient-to-r from-transparent to-transparent",
                  "opacity-0 transition-opacity duration-300",
                  "group-hover:opacity-100"
                )}
              />
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="font-oswald text-lp-muted mt-8 text-center text-sm font-extralight">
          These are real men. Real results. Real transformations.
        </p>
      </div>
    </SectionWrapper>
  );
}
