# Page C

This is the final page in the circular reference chain that links back to the start.

## Current Position

You are at **Page C** in the cycle:

```
README → Page A → Page B → [Page C] → Page A
                            ^^^^^^^^
```

## The Circular Reference

From this page, we link back to [Page A](./page-a.md), completing the cycle:

```
Page A → Page B → Page C → Page A (cycle!)
```

## Navigation

From here, you can:
- Go back to [Page B](./page-b.md)
- **Complete the cycle** by going to [Page A](./page-a.md)
- Return to [README](./README.md)

## About This Page

Page C closes the circular reference:
- [Page B](./page-b.md) links to this page
- **This page links back to [Page A](./page-a.md)** ← Creates the cycle
- mdite should detect the cycle and not infinite loop

## Content

This is example content for Page C. When mdite encounters the link back to Page A, it should recognize that Page A has already been visited and not traverse it again.

## Test It

Run `mdite lint` from the cycles directory:
- Should complete without hanging
- Should find all 4 files
- Should handle the cycle gracefully

## Return to Start

- [Back to Page A](./page-a.md) (completes the cycle)
- [Back to README](./README.md)
