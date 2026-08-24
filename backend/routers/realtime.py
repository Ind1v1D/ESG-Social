"""
SSE realtime router — frontend connects here to receive publish events.
"""
import asyncio
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from events import event_manager

router = APIRouter(prefix="/api", tags=["realtime"])


@router.get("/realtime")
async def realtime_stream():
    """SSE endpoint: streams publish events to connected frontends."""
    queue = await event_manager.subscribe()

    async def event_generator():
        try:
            while True:
                try:
                    msg = await asyncio.wait_for(queue.get(), timeout=30)
                    yield {"event": msg["event"], "data": msg["data"]}
                except asyncio.TimeoutError:
                    # Send keepalive comment
                    yield {"comment": "keepalive"}
        except asyncio.CancelledError:
            event_manager.unsubscribe(queue)
            raise
        finally:
            event_manager.unsubscribe(queue)

    return EventSourceResponse(event_generator())
