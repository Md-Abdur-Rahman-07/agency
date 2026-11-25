# Editing the portfolio

Each category page has its own file in `portfolio/data/`; edit that file. No HTML changes are needed. Serve the site over HTTP (your existing Live Server works) so the browser can load the JSON.

Projects are sorted by `id` within each file. Put each project in one category only.

| Page | Data |
| --- | --- |
| `portfolio/saas-products.html` | `portfolio/data/saas-products.json` |
| `portfolio/ui-ux-design.html` | `portfolio/data/ui-ux-design.json` |
| `portfolio/website-development.html` | `portfolio/data/website-development.json` |
| Revamp section on that page | `portfolio/data/website-revamp.json` |
| `portfolio/mobile-app-development.html` | `portfolio/data/mobile-app-development.json` |
| `portfolio/cybersecurity.html` | `portfolio/data/cybersecurity.json` |
| `portfolio/website-maintenance.html` | `portfolio/data/website-maintenance.json` |
| `portfolio/cms-ecommerce.html` | `portfolio/data/cms-ecommerce.json` |

`portfolio.html` is the hub. Headings and taglines are written in each HTML page.

Each entry supports these fields:

```json
{
  "id": 1,
  "title": "Project title",
  "label": "Web application",
  "summary": "Short card description.",
  "description": "Full popup description.\n\nUse newlines for paragraphs.",
  "background": {
    "type": "image",
    "url": "portfolio/images/example.jpg",
    "poster": "",
    "alt": ""
  },
  "demoUrl": "",
  "liveUrl": "",
  "timeline": "6 weeks",
  "cost": "$4,800",
  "client": "Client name",
  "year": "2026",
  "role": "Design and development",
  "technologies": ["React", "Node.js"],
  "details": [
    { "label": "Challenge", "value": "Describe the problem here." },
    { "label": "Outcome", "value": "Describe the result here." }
  ]
}
```

- Use a positive integer `id` that is unique within its file and a nonempty `title`. Page anchors are `#project-1` and so on. Entries without a title are skipped.
- Image and video paths are relative to the site root, for example `portfolio/images/example.jpg`.
- For an image background, set `background.type` to `image` and `url` to a local path or an HTTPS image URL.
- For a video background, use `type: "video"` with a direct browser-playable MP4/WebM URL. `poster` can hold a preview image. Background videos are muted, loop when visible, and have a pause/play button. Reduced-motion users start with playback paused. YouTube/Vimeo pages cannot be used as CSS-style background videos.
- `demoUrl` supports direct video URLs, YouTube watch/share URLs, and Vimeo video URLs. Demo playback uses controls inside the popup.
- `liveUrl` adds a live link on the card and in the popup.
- Timeline, cost and client appear on cards and in the popup. Year, role, technologies and arbitrary `details` appear in the popup.
- `isDemo: true` marks sample case studies and labels the live link as a sample. Set it to `false` or omit it for real projects. The supplied demo live links point to `https://example.com`; replace them with project URLs.
- `demoCaption` adds an optional caption below the popup video. The supplied entries use `img/video.mp4` as placeholder footage; replace `demoUrl` and the caption with each project's walkthrough.
- Optional fields can be omitted, set to `""`, or use empty arrays. Empty values generate no labels, media boxes, links or metadata rows. With no media, cards use a plain dark background. Text is rendered as text, not HTML.
- Existing entries are illustrative concepts using local stock images. Replace them with your actual project content when ready.

## Website templates

The template section on the website development page reads `portfolio/data/website-templates.json`. Each entry has `id`, `title`, `type`, `description`, `layout` (`split`, `grid`, `masonry`, `center` or `list`), `image` and `previewUrl`. Without an `image`, a simple drawing of the layout is shown. `previewUrl` adds a Preview link.

For website screenshots, set `background.display` to `screenshot`. The card then shows the full image above the text, and the popup shows it too.
- `liveLabel` optionally replaces the live link text, for example `View in Figma ↗`.
