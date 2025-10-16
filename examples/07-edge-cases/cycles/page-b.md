# Page B

This is the second page in the circular reference chain.

## Current Position

You are at **Page B** in the cycle:

```
README → Page A → [Page B] → Page C → Page A
                   ^^^^^^^^
```

## Navigation

From here, you can:
- Go back to [Page A](./page-a.md)
- Continue to [Page C](./page-c.md)
- Return to [README](./README.md)

## About This Page

Page B is in the middle of the circular reference:
- [Page A](./page-a.md) links to this page
- This page links to [Page C](./page-c.md)
- Page C links back to [Page A](./page-a.md) (completing the cycle)

## Content

This is example content for Page B. The cycle tests mdite's graph traversal algorithm.

## Next

Continue to [Page C](./page-c.md) to complete the cycle.
