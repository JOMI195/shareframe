from .blacklist import USERNAME_BLACKLIST
import Levenshtein as lev


def is_username_allowed(username, threshold=0.9):
    username = username.lower()
    for term in USERNAME_BLACKLIST:
        term_lower = term.lower()
        distance = lev.distance(username, term_lower)
        max_distance = max(len(username), len(term_lower))
        similarity = 1 - (distance / max_distance)

        if similarity >= threshold:
            return False
    return True
