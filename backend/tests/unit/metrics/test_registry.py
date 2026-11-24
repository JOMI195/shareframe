from prometheus_client import REGISTRY
from prometheus_client.mmap_dict import MmapedDict, mmap_key

from metrics.registry import process_registry


def _write_worker_count(directory, pid, value):
    key = mmap_key("requests", "requests_total", [], [], "Requests")
    store = MmapedDict(str(directory / f"counter_{pid}.db"))
    store.write_value(key, value, 0)
    store.close()


def test_a_single_process_exports_its_own_registry(monkeypatch):
    monkeypatch.delenv("PROMETHEUS_MULTIPROC_DIR", raising=False)

    assert process_registry() is REGISTRY


def test_workers_sharing_a_directory_are_summed(monkeypatch, tmp_path):
    monkeypatch.setenv("PROMETHEUS_MULTIPROC_DIR", str(tmp_path))
    _write_worker_count(tmp_path, 101, 3)
    _write_worker_count(tmp_path, 102, 4)

    assert process_registry().get_sample_value("requests_total") == 7
