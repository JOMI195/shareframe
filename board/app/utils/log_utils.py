def truncate_message(message, max_length=500):
    """Truncate message from the middle if it's too long."""
    if isinstance(message, (bytes, bytearray)):
        # For binary messages, just show length and partial content
        return (
            f"<binary data of length {len(message)}, starts with: {message[:20]!r}...>"
        )

    message_str = str(message)
    if len(message_str) <= max_length:
        return message_str

    half_length = (max_length - 3) // 2
    return message_str[:half_length] + "..." + message_str[-half_length:]
