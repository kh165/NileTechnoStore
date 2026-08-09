import React from "react";

export default function ProductSkeleton({ count = 10, lang = "ar" }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 w-full animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-2.5 shadow-xs"
        >
          {/* Skeleton Image Container */}
          <div className="relative aspect-square overflow-hidden bg-slate-100 rounded-2xl flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-200/80" />
            <div className="absolute top-2.5 right-2.5 w-12 h-4 rounded-full bg-slate-200/60" />
          </div>

          {/* Skeleton Content Area */}
          <div className="flex flex-1 flex-col px-1.5 pb-2 pt-3 gap-2.5">
            {/* Category Skeleton */}
            <div className="h-2.5 w-1/3 bg-slate-200/70 rounded-full" />

            {/* Title Skeleton */}
            <div className="space-y-1.5">
              <div className="h-3.5 w-full bg-slate-200/80 rounded-md" />
              <div className="h-3.5 w-2/3 bg-slate-200/60 rounded-md" />
            </div>

            {/* Rating Stars Skeleton */}
            <div className="flex items-center gap-1 mt-1">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="w-3 h-3 rounded-full bg-slate-200/70" />
                ))}
              </div>
              <div className="h-2.5 w-8 bg-slate-200/50 rounded-full mr-1" />
            </div>

            {/* Price & Add button Skeleton */}
            <div className="mt-2 pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-2.5 w-10 bg-slate-200/50 rounded-full" />
                <div className="h-4 w-16 bg-slate-200/80 rounded-lg" />
              </div>
              <div className="h-9 w-9 bg-slate-200/80 rounded-2xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
