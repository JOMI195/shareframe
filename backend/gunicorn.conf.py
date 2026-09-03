import multiprocessing

worker_class = "gthread"
workers = max(2, multiprocessing.cpu_count())
threads = 4
timeout = 120
graceful_timeout = 30
