from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PAGES = [
    "index.html",
    "about.html",
    "education.html",
    "mentoring.html",
    "business.html",
    "solutions.html",
    "materials.html",
    "blog.html",
    "contact.html",
    "privacy.html",
    "404.html",
]

OG_URL = "https://jv6hgy9sby-ops.github.io/nastya-hr/assets/brand/og-anasteysha.jpg"
OG_TAGS = (
    f'<meta property="og:image" content="{OG_URL}">'
    '<meta property="og:image:width" content="1200">'
    '<meta property="og:image:height" content="630">'
    '<meta property="og:image:alt" content="Anasteysha — HR, Recruiting, Operations">'
)
TWITTER_IMAGE = f'<meta name="twitter:image" content="{OG_URL}">'
ICON_BLOCK = (
    '<link rel="icon" type="image/svg+xml" href="assets/brand/favicon.svg">'
    '<link rel="icon" type="image/png" sizes="32x32" href="assets/brand/favicon-32.png">'
    '<link rel="apple-touch-icon" sizes="180x180" href="assets/brand/apple-touch-icon.png">'
    '<link rel="manifest" href="manifest.webmanifest">'
)


def remove_tags(text: str, attribute_pattern: str) -> str:
    return re.sub(
        rf'\s*<(?:meta|link)\b[^>]*{attribute_pattern}[^>]*>',
        '',
        text,
        flags=re.IGNORECASE,
    )


def insert_before(text: str, pattern: str, insertion: str) -> str:
    match = re.search(pattern, text, flags=re.IGNORECASE)
    if not match:
        raise RuntimeError(f"Insertion marker not found: {pattern}")
    return text[: match.start()] + insertion + "\n  " + text[match.start() :]


def normalize(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    text = re.sub(
        r'<meta\s+name=["\']theme-color["\']\s+content=["\'][^"\']*["\']\s*>',
        '<meta name="theme-color" content="#FAF7F2">',
        text,
        count=1,
        flags=re.IGNORECASE,
    )

    text = remove_tags(text, r'rel=["\'](?:icon|apple-touch-icon|manifest)["\']')
    text = insert_before(
        text,
        r'<link\s+rel=["\'](?:preconnect|stylesheet)["\']',
        "  " + ICON_BLOCK,
    )

    if path.name != "404.html":
        text = remove_tags(text, r'property=["\']og:image(?::(?:width|height|alt))?["\']')
        text = remove_tags(text, r'name=["\']twitter:image["\']')

        og_url_match = re.search(
            r'<meta\s+property=["\']og:url["\']', text, flags=re.IGNORECASE
        )
        if og_url_match:
            text = text[: og_url_match.start()] + OG_TAGS + text[og_url_match.start() :]
        else:
            text = insert_before(
                text,
                r'<link\s+rel=["\']canonical["\']',
                "  " + OG_TAGS,
            )

        twitter_match = re.search(
            r'<meta\s+name=["\']twitter:card["\'][^>]*>',
            text,
            flags=re.IGNORECASE,
        )
        if twitter_match:
            text = (
                text[: twitter_match.end()]
                + TWITTER_IMAGE
                + text[twitter_match.end() :]
            )
        else:
            text = insert_before(
                text,
                r'<link\s+rel=["\']canonical["\']',
                "  " + '<meta name="twitter:card" content="summary_large_image">' + TWITTER_IMAGE,
            )

    path.write_text(text, encoding="utf-8")


for page in PAGES:
    target = ROOT / page
    if not target.exists():
        raise FileNotFoundError(target)
    normalize(target)
    print(f"Updated {target.relative_to(ROOT.parent)}")
