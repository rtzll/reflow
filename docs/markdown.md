# Markdown images

Markdown renders notes and streaming replies from a string. By default an image shows as a link to its source, so rendering Markdown never makes the browser load anything. That default stays: an image URL in generated text can carry data to whoever serves it, and loading it also tells that server who is reading. This note covers showing images inline when the app trusts where they come from.

## API

Pass `images` to choose which images load:

```tsx
<Markdown source={reply} images />
<Markdown source={reply} images={(src) => src.startsWith('https://cdn.example.com/')} />
```

- Omitted or `false`: every image is a link, as today.
- `true`: images on the same site, written as a path starting with `/`, load inline. Images on other hosts stay links.
- A function: it receives each image's decoded source, already checked to be an `http:`, `https:` or same-site path URL, and returns whether to load it. Return `true` for the hosts the app controls or proxies.

An image the rules refuse keeps today's link, labelled with its alt text or, without one, its URL. The rules for which URLs are links at all do not change, so `javascript:`, `data:` and protocol-relative sources never render either way.

## Rendering

An inline image is an `<img>` with the Markdown alt text, its title as a tooltip when it has one, `loading="lazy"` and `decoding="async"`. It never grows wider than the text column and stops at 480 pixels tall, keeping its aspect ratio, so a large image cannot push a reply off screen. Images inside a paragraph sit in the line; an image alone in its paragraph shows as a block with space around it. An image inside a link, `[![alt](src)](href)`, stays inside the link.

An image with an empty alt text is decorative and is hidden from assistive technology. A source that fails to load shows the browser's alt text in its place.

While a reply streams, an image appears once its closing parenthesis arrives, as links already do.

## Verification

Browser tests cover the default links, same-site images under `true`, a remote image refused under `true`, a function allowing one host, the alt and title, the lazy loading attributes, unsafe sources staying out, and an image inside a link. An end-to-end test checks the size limits with the stylesheet loaded.
