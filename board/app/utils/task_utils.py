# helpers/task_restart.py
import asyncio
import logging
from typing import Callable, Optional, Any


async def restart_task_on_failure(
    task_coro_factory: Callable[[], Any],
    task_name: str,
    restart_delay: int = 5,
    max_retries: int = 3,
    instance: Optional[object] = None,
    task_ref_attr: Optional[str] = None,
    logger: Optional[logging.Logger] = None,
) -> None:
    """
    Generic function to monitor and restart any task if it fails.

    Args:
        task_coro_factory: A callable that returns the coroutine to run
        task_name: Name of the task for logging purposes
        restart_delay: Base delay in seconds before restarting (uses exponential backoff)
        max_retries: Maximum consecutive failures before giving up
        instance: Optional object instance to store task reference on
        task_ref_attr: Optional attribute name to store the task reference (e.g., 'display_task')
        logger: Optional logger instance, creates new one if not provided

    Returns:
        None - This function runs indefinitely until cancelled or max retries reached

    Raises:
        Exception: Re-raises the last exception if max_retries is exceeded
    """
    if logger is None:
        logger = logging.getLogger(__name__)

    retry_count = 0
    task = None
    last_exception = None

    while True:
        try:
            logger.info(f"Starting task: {task_name}")
            retry_count = 0  # Reset retry count on successful start

            # Create and run the task
            task = asyncio.create_task(task_coro_factory())

            # Store the task reference if both instance and attribute name are provided
            if instance is not None and task_ref_attr is not None:
                setattr(instance, task_ref_attr, task)

            # Wait for the task to complete (or fail)
            await task

        except asyncio.CancelledError:
            logger.info(f"Task '{task_name}' was cancelled - stopping restart monitor")
            break

        except Exception as e:
            last_exception = e
            retry_count += 1
            logger.error(
                f"Task '{task_name}' failed (attempt {retry_count}/{max_retries}): {e}",
                exc_info=True,
            )

            if retry_count >= max_retries:
                logger.critical(
                    f"Task '{task_name}' failed {max_retries} times in a row. Stopping restart attempts."
                )
                # Re-raise the last exception so calling code can handle it
                raise last_exception

            # Exponential backoff with maximum delay of 60 seconds
            actual_delay = min(restart_delay * (2 ** (retry_count - 1)), 60)
            logger.info(f"Restarting task '{task_name}' in {actual_delay} seconds...")
            await asyncio.sleep(actual_delay)
