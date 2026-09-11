import { createRequire as topLevelCreateRequire } from 'module';const require = topLevelCreateRequire(import.meta.url);import bannerUrl from 'url';const __dirname = bannerUrl.fileURLToPath(new URL('.', import.meta.url));

// open-next.config.ts
var config = {
  // Prevent recursion: package.json "build" itself calls opennext build, and
  // opennext's default buildCommand is `npm run build` → infinite loop.
  // Pin the internal build to plain next build (+ sitemap index mirror).
  buildCommand: "NEXT_PRIVATE_TURBOPACK=0 npx next build && node scripts/gen-sitemap-index.mjs",
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy"
    }
  },
  edgeExternals: ["node:crypto"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy"
    }
  }
};
var open_next_config_default = config;
export {
  open_next_config_default as default
};
