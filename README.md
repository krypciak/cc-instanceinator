<!-- markdownlint-disable MD013 MD024 MD001 MD045 -->

# cc-instanceinator

Allows running multiple crosscode instances on the same process at the same time by:  
- isolating global namespaces (`ig`, `sc`, etc.)
- managing DOM elements (adding canvases, input divs)
- tiling canvases

## Building

```bash
git clone https://github.com/krypciak/cc-instanceinator
cd cc-instanceinator
pnpm install
pnpm run start
# this should return no errors (hopefully)
npx tsc
```
