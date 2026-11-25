# Editing the blog

`blog/posts.json` is the single content source for all 18 articles. Both `blog.html` and `blog-post.html` fetch it at runtime using `blog/blog.js`. Article links use `blog-post.html?slug=<slug>`; there are no separate HTML files for individual articles.

## Content updates

1. Edit or add a post in `blog/posts.json`.
2. Put its image in `blog/images/` and use that relative path in `image`.
3. Refresh the page through your local HTTP server, such as Live Server. Content edits do not require a build. Fetching JSON requires HTTP; opening the HTML as a `file://` URL is unsupported.
4. When adding/removing articles or changing slugs/dates, run `npm run build:blog` to refresh the sitemap. This command updates only the two shared page shells and sitemap, never individual article pages.

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
- `service`: related service `name` and local `href`, such as `services.html#development`.
- `cta`: a specific next step related to the topic.

The runtime creates reading times, section navigation, source links, related articles, canonical URLs, article metadata and structured data. The listing shows 12 articles per page. Search and category filters operate on the whole JSON collection and reset pagination to the first page; pagination is hidden when results fit on one page. Missing articles and failed requests show useful recovery links; failed requests also offer retry.

## Publishing

Deploy both shared HTML files, `blog/blog.js`, `style.css`, `blog/posts.json`, `blog/images/` and the sitemap with other site assets. Keep the site's production origin consistent in `blog/blog.js`, the builder and `robots.txt`.

Article content and article-specific metadata require JavaScript rendering. Link-preview services that do not execute JavaScript will receive the generic page metadata. The sitemap uses the new query-based article URLs. If previous individual article URLs were deployed, configure matching redirects at the host to their `blog-post.html?slug=...` equivalents.

The articles cite official documentation and contain original planning guidance, without fabricated client results or ranking guarantees. After deployment, monitor indexing and relevant enquiries in the site's analytics and Search Console.
