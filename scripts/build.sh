concurrently --kill-others --success=first \
  "bun --watch local/blog-data-server/index.ts" \
  "bun --watch tina/index.ts" \
  "astro check && astro build"
