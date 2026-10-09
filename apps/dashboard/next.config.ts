import type { NextConfig } from "next";

// God's Eye cloud deployment (Vercel). All /gods-eye/* and God's Eye /api/*
// requests are proxied here so the app lives at forgeos.shoppersspotllc.com/gods-eye
// with no Tailscale, no PC, and no separate domain required.
const GODSEYE_UPSTREAM = "https://forgeos-godseye-7otrjiihs-destiny-usa.vercel.app";

// God's Eye API routes (must not overlap dashboard /api/* routes)
const GODSEYE_API_ROUTES = [
  "adsbdb",
  "cctv",
  "celestrak",
  "cyclones",
  "fire-perimeters",
  "firms",
  "flights",
  "gbfs",
  "geocode",
  "google",
  "launches",
  "mapillary",
  "military-installations",
  "military",
  "overpass",
  "radio",
  "regional-brief",
  "route",
  "terrain",
  "tomtom",
  "transit",
  "vessels",
  "weather-effects",
  "weather",
  "wind",
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      // God's Eye app
      { source: "/gods-eye", destination: `${GODSEYE_UPSTREAM}/gods-eye-view/` },
      { source: "/gods-eye/:path*", destination: `${GODSEYE_UPSTREAM}/gods-eye-view/:path*` },
      // God's Eye absolute asset URLs (/gods-eye-view/...)
      { source: "/gods-eye-view/:path*", destination: `${GODSEYE_UPSTREAM}/gods-eye-view/:path*` },
      // God's Eye API routes (bare path + subpaths; :path* alone misses the bare path)
      ...GODSEYE_API_ROUTES.flatMap((r) => [
        {
          source: `/api/${r}`,
          destination: `${GODSEYE_UPSTREAM}/api/${r}`,
        },
        {
          source: `/api/${r}/:path*`,
          destination: `${GODSEYE_UPSTREAM}/api/${r}/:path*`,
        },
      ]),
    ];
  },
};

export default nextConfig;
