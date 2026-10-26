import re
from html import unescape

from django.utils.html import strip_tags

_HEAD = re.compile(r"<head\b.*?</head>", re.IGNORECASE | re.DOTALL)
_STYLE = re.compile(r"<style\b.*?</style>", re.IGNORECASE | re.DOTALL)
_LINK = re.compile(
    r"<a\b[^>]*\bhref=\"([^\"]*)\"[^>]*>(.*?)</a>", re.IGNORECASE | re.DOTALL
)
_WHITESPACE = re.compile(r"\s+")
_PARAGRAPH = re.compile(r"</?(?:p|h[1-6]|div|table)\b[^>]*>", re.IGNORECASE)
_LINE = re.compile(r"<br\s*/?>|</(?:tr|li)>", re.IGNORECASE)
_BLANK_LINES = re.compile(r"\n{3,}")


def _link_as_text(match):
    href, label = match.group(1), " ".join(strip_tags(match.group(2)).split())
    if not label or label == href:
        return href
    return f"{label}: {href}"


def html_to_text(html):
    """Plain-text version of a rendered mail, links kept with their URL."""
    text = _WHITESPACE.sub(" ", _STYLE.sub("", _HEAD.sub("", html)))
    text = _LINK.sub(_link_as_text, text)
    text = _LINE.sub("\n", _PARAGRAPH.sub("\n\n", text))
    lines = (line.strip() for line in unescape(strip_tags(text)).splitlines())
    return _BLANK_LINES.sub("\n\n", "\n".join(lines)).strip() + "\n"
