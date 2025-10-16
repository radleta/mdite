# Page A

This is the first page in the circular reference chain.

## Current Position

You are at **Page A** in the cycle:

```
README → [Page A] → Page B → Page C → Page A
          ^^^^^^
```

## Navigation

From here, you can:
- Go back to [README](./README.md)
- Continue to [Page B](./page-b.md)
- Jump ahead to [Page C](./page-c.md)

## About This Page

Page A is part of a circular reference:
- README links to this page
- This page links to Page B
- Page B links to Page C
- Page C links back to this page (completing the cycle)

## Content

This is example content for Page A. The cycle is intentional to test mdite's ability to handle circular references without infinite looping.

## Next

Continue to [Page B](./page-b.md) to follow the cycle.
