# Orphan Files Example

This example demonstrates orphan file detection in mdite.

## What is an Orphan File?

An orphan file is a markdown file that is not reachable from the entrypoint (this file) by following links. Orphaned files often indicate:
- Forgotten documentation
- Files that should be linked but aren't
- Outdated content that should be removed

## Connected Files

This file links to:
- [Connected Document](./connected.md) - This file is reachable ✅

## The Orphan

In this directory, there's a file called `orphaned.md` that is **not** linked from anywhere in the documentation graph. When you run `mdite lint`, it should detect this orphan.

## Expected Output

When you run mdite on this directory:

```bash
mdite lint
```

You should see an error like:

```
✗ Found 1 orphaned file(s)

orphaned.md
  - error Orphaned file: not reachable from entrypoint [orphan-files]

✗ 1 error(s), 0 warning(s)
```

## Try It Yourself

1. Run `mdite lint` to see the orphan detection
2. Try linking to `orphaned.md` from this file to fix the issue
3. Run `mdite lint` again to verify it's fixed

## How It Works

mdite builds a dependency graph starting from the entrypoint (this README.md) and follows all relative markdown links. Any `.md` files in the directory that aren't in the graph are reported as orphans.

See [Connected Document](./connected.md) for more information.
