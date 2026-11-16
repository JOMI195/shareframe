import pytest

pytestmark = pytest.mark.django_db

CONTACT = "/api/contactMe/"
MESSAGE = {
    "name": "Max",
    "email": "max@example.com",
    "subject": "Frage",
    "message": "Wie verbinde ich meinen Rahmen?",
}


def test_a_message_is_mailed_to_the_contact_address(client, mailoutbox, settings):
    response = client.post(CONTACT, MESSAGE, format="json")

    assert response.status_code == 200
    assert len(mailoutbox) == 1
    mail = mailoutbox[0]
    assert mail.to == [settings.CONTACT_EMAIL]
    assert mail.reply_to == ["max@example.com"]
    assert "Frage" in mail.subject
    assert "Wie verbinde ich meinen Rahmen?" in mail.body


def test_a_signed_in_user_can_send_one_too(alice, mailoutbox, settings):
    mailoutbox.clear()

    assert alice.post(CONTACT, MESSAGE, format="json").status_code == 200
    assert [mail.to for mail in mailoutbox] == [[settings.CONTACT_EMAIL]]


@pytest.mark.parametrize("field", ["name", "email", "subject", "message"])
def test_every_field_is_required(client, field, mailoutbox):
    payload = {key: value for key, value in MESSAGE.items() if key != field}

    response = client.post(CONTACT, payload, format="json")

    assert response.status_code == 400
    assert field in response.json()
    assert mailoutbox == []


def test_an_overlong_message_is_rejected(client):
    response = client.post(CONTACT, {**MESSAGE, "message": "x" * 2001}, format="json")

    assert response.status_code == 400


def test_a_line_break_cannot_add_mail_headers(client, mailoutbox):
    response = client.post(
        CONTACT,
        {**MESSAGE, "email": "max@example.com\nBcc: other@example.com"},
        format="json",
    )

    assert response.status_code == 400
    assert mailoutbox == []


def test_only_post_is_allowed(client):
    assert client.get(CONTACT).status_code == 405


def test_sending_many_is_throttled(client, throttled):
    statuses = [
        client.post(CONTACT, MESSAGE, format="json").status_code for _ in range(4)
    ]

    assert statuses[-1] == 429
