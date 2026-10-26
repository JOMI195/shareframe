from appEmail.text import html_to_text

MAIL = """<!DOCTYPE html><html><head><title>Titel</title>
<style>body { color: #333; }</style></head>
<body><h1>Hallo &amp; willkommen</h1>
<p>Erste Zeile<br>zweite   Zeile</p>
<a href="https://shareframe.local/reset/?a=1&amp;b=2" class="button">Passwort
    zurücksetzen</a>
<p>Fragen? <a href="https://shareframe.local/kontakt/">https://shareframe.local/kontakt/</a></p>
<img src="cid:logo_image" alt="Logo"></body></html>"""


def test_head_and_styles_are_dropped():
    text = html_to_text(MAIL)

    assert "Titel" not in text
    assert "color" not in text


def test_links_keep_their_label_and_url():
    assert (
        "Passwort zurücksetzen: https://shareframe.local/reset/?a=1&b=2"
        in html_to_text(MAIL)
    )


def test_a_link_showing_its_own_url_is_not_repeated():
    text = html_to_text(MAIL)

    assert "Fragen? https://shareframe.local/kontakt/\n" in text


def test_block_tags_become_lines_and_entities_are_decoded():
    lines = html_to_text(MAIL).splitlines()

    assert lines[0] == "Hallo & willkommen"
    assert "Erste Zeile" in lines
    assert "zweite Zeile" in lines


def test_no_markup_is_left():
    assert "<" not in html_to_text(MAIL)
