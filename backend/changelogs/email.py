import os

import markdown
from markdown.extensions import Extension
from markdown.treeprocessors import Treeprocessor

FONT = "font-family: Inter, Roboto, Arial, sans-serif;"
TEXT = FONT + "font-size: 16px; line-height: 1.5;"
LIST = TEXT + "margin: 0 0 12px; padding-left: 24px;"

# Mail clients strip <style>, so every element carries its own.
STYLES = {
    "h1": FONT + "font-size: 22px; line-height: 1.4; margin: 24px 0 8px;",
    "h2": FONT + "font-size: 20px; line-height: 1.4; margin: 24px 0 8px;",
    "h3": FONT + "font-size: 17px; line-height: 1.4; margin: 20px 0 8px;",
    "p": TEXT + "margin: 0 0 12px;",
    "ul": LIST,
    "ol": LIST,
    "li": "margin: 0 0 4px;",
    "a": "color: #8b5cf6; text-decoration: none;",
    "img": "display: block; max-width: 100%; height: auto; margin: 16px 0; border-radius: 8px;",
    "hr": "border: none; border-top: 1px solid #eeeeee; margin: 24px 0;",
    "blockquote": "margin: 0 0 12px; padding: 4px 16px; border-left: 4px solid #8b5cf6; color: #666666;",
    "code": "font-family: monospace; background-color: #f4f4f4; padding: 2px 4px; border-radius: 4px;",
}


class _InlineStyles(Treeprocessor):
    def run(self, root):
        for element in root.iter():
            if element.tag in STYLES:
                element.set("style", STYLES[element.tag])


class InlineStyleExtension(Extension):
    def extendMarkdown(self, md):
        md.treeprocessors.register(_InlineStyles(md), "inline_styles", 0)


def render_email_html(changelog):
    """Return the styled HTML body and the inline images it references."""
    content = changelog.get_markdown_content()
    images = []

    for image in changelog.images.all():
        placeholder = f"::{image.tag}::"
        if placeholder not in content:
            continue

        cid = f"changelog_image_{image.pk}"
        content = content.replace(
            placeholder, f"![{image.description or image.tag}](cid:{cid})"
        )
        images.append(
            {
                "path": image.image.path,
                "cid": cid,
                "template_identifier": cid,
                "filename": os.path.basename(image.image.name),
            }
        )

    return markdown.markdown(content, extensions=[InlineStyleExtension()]), images
