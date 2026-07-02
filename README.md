# snip-cli

Zero-dependency Node.js CLI for the [Snip](https://github.com/kaijinma-dotcom/snip-demo) URL shortener.

## Requirements

Node.js 18+ (uses the built-in global `fetch`)

## Installation

```sh
# Global install (creates the snip binary via npm)
npm install -g .

# Or just add this directory to PATH — the wrapper scripts handle the rest:
#   snip / snip.cmd / snip.ps1
```

## Configuration

| Variable   | Default                 | Description      |
|------------|-------------------------|------------------|
| `SNIP_API` | `http://localhost:3000` | Backend base URL |

## Commands

| Command              | Description                                  |
|----------------------|----------------------------------------------|
| `snip add <url>`     | Shorten a URL and print the short link       |
| `snip ls`            | List all links (code · hits · original URL)  |
| `snip open <code>`   | Open a short link in the OS browser          |
| `snip help`          | Print usage                                  |

## Examples

```sh
$ snip add https://example.com/a/very/long/path
http://localhost:3000/abc123

$ snip ls
CODE    HITS  URL
------  ----  -------------------------------------------
abc123     3  https://example.com/a/very/long/path

$ snip open abc123
Opening: https://example.com/a/very/long/path
```

## Error handling

Bad input, unknown codes, and unreachable backends all print to **stderr** and exit `1`.
