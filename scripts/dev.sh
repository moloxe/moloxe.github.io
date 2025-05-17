bunx concurrently \
  "bun --watch local/blog-data-server/index.ts --dev" \
  "bun --watch tina/index.ts" \
  "astro dev"
