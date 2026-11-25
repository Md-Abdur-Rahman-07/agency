# Editing the blog

`blog/posts.json` is the single content source for all articles. `npm run build:blog` builds `blog.html`, one page per article (`blog/<slug>.html`) and the sitemap. Do not edit the generated pages. `blog-post.html` only forwards old `?slug=` links.

## Content updates

1. Edit or add a post in `blog/posts.json`.
2. Put its image in `blog/images/` and use that relative path in `image`.
3. Refresh the page through your local HTTP server, such as Live Server. Content edits do not require a build. Fetching JSON requires HTTP; opening the HTML as a `file://` URL is unsupported.
4. Run `npm run build:blog` after any change to the articles, then publish the generated pages.

Run `node blog/check-blog.cjs` to check data, image paths, links and sitemap. Shared navigation/footer markup lives in `blog/blog-shell.html`; shell generation is in `blog/build-blog.cjs`, runtime rendering in `blog/blog.js`, and layout in `style.css`.

## Fields

- `slug`: unique lowercase hyphenated identifier used by the article URL.
- `title`, `excerpt`, `category`, `date`, `updated`, `author`: editorial information. Dates should reflect actual publication and updates.
- `image`, `imageAlt`: local path inside `blog/images/` and descriptive alt text.
- `imageCredit`: optional source records for internal reference, not displayed on the website. Photo provenance is also recorded in `blog/images/README.md`.
- `tags`: search keywords relevant to the article.
- `takeaway`: optional short answer at the start of the article.
- `content`: `p`, `h2`, `h3`, `ul` or `ol` blocks. Text is escaped; HTML is not accepted. `[1]` refers to the first source, `[2]` to the second, and so on.
- `sources`: official HTTPS references with `title` and `url`.
- `service`: related service `name` and local `href`, such as `/services/website-development`.
- `cta`: a specific next step related to the topic.

The builder creates reading times, section navigation, source links, related articles, canonical URLs, article metadata and structured data. The listing shows 12 articles per page. Search and category filters operate on the whole JSON collection and reset pagination to the first page; pagination is hidden when results fit on one page. Missing articles and failed requests show useful recovery links; failed requests also offer retry.

## Publishing

Deploy both shared HTML files, `blog/blog.js`, `style.css`, `blog/posts.json`, `blog/images/` and the sitemap with other site assets. Keep the site's production origin consistent in `blog/blog.js`, the builder and `robots.txt`.

Article pages are plain HTML, so search engines and link previews read them without JavaScript.

The articles cite official documentation and contain original planning guidance, without fabricated client results or ranking guarantees. After deployment, monitor indexing and relevant enquiries in the site's analytics and Search Console.
