"""A small in-memory rate limiter (sliding window).

It is per process, which is right for one backend instance. With several instances behind a load balancer,
move the counters to Redis. Set RATE_LIMIT_ENABLED=false to switch it off (the test suite does).
"""
import os
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

_hits: dict[str, deque] = defaultdict(deque)
_lock = threading.Lock()


def _enabled() -> bool:
    return os.getenv("RATE_LIMIT_ENABLED", "true").strip().lower() not in ("0", "false", "no", "off")


def client_ip(request: Request) -> str:
    # Behind the proxy, uvicorn's --proxy-headers puts the real client address here
    return request.client.host if request.client else "unknown"


def hit(key: str, limit: int, window_seconds: int) -> None:
    """Count one attempt for this key; answer 429 if there were already `limit` in the last window."""
    if not _enabled():
        return
    now = time.monotonic()
    with _lock:
        recent = _hits[key]
        while recent and now - recent[0] > window_seconds:
            recent.popleft()
        if len(recent) >= limit:
            retry_after = int(window_seconds - (now - recent[0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Please wait and try again.",
                headers={"Retry-After": str(retry_after)},
            )
        recent.append(now)


def reset() -> None:
    """Forget every counter (used by tests)."""
    with _lock:
        _hits.clear()
