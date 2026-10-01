from unittest.mock import patch

from prometheus_client import CollectorRegistry

from metrics.collectors import ShareframeFrameCollector


def test_registering_on_an_auto_describing_registry_does_not_collect():
    collector = ShareframeFrameCollector()

    with patch.object(collector, "collect") as collect:
        CollectorRegistry(auto_describe=True).register(collector)

    collect.assert_not_called()
