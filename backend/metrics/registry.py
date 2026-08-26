from prometheus_client import CollectorRegistry

# Scraped on its own slower endpoint, so the DB pass it does stays off the hot path.
BUSINESS_REGISTRY = CollectorRegistry()
