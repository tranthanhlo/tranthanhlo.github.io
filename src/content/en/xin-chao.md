---
title: Hello
description: A sample post to show what a post looks like. Replace it with your first real post.
date: 2026-11-14
tags: [notes]
---

> This is **sample content**, the English version of the Vietnamese sample post. Edit this file into a real translation, or delete it. See `README.md` for how translations work.

A post is just a Markdown file. The part between the two `---` lines at the top holds the title, description, date and tags. Everything below is the content.

## Basic formatting

**Bold**, *italic*, [a link](https://astro.build), and a list:

- One point
- A second point
- A third point

## Code

Put code between three backticks, with the language name for highlighting:

```csharp
[Transaction(TransactionMode.Manual)]
public class HelloRevit : IExternalCommand
{
    public Result Execute(ExternalCommandData data, ref string message, ElementSet elements)
    {
        TaskDialog.Show("Blog", "Hello from Da Nang!");
        return Result.Succeeded;
    }
}
```

## Images

Put the image next to the post file and insert it like this:

```md
![Image description](./image-name.jpg)
```

---

That's it. Happy writing.
