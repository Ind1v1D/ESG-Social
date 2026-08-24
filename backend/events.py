"""
SSE event manager for broadcasting publish events to connected frontends.
"""
import asyncio
import json
from datetime import datetime


class EventManager:
    """Manages SSE connections and broadcasts events."""

    def __init__(self):
        self._subscribers: list[asyncio.Queue] = []

    async def subscribe(self) -> asyncio.Queue:
        queue = asyncio.Queue()
        self._subscribers.append(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue):
        if queue in self._subscribers:
            self._subscribers.remove(queue)

    async def broadcast(self, event_type: str, data: dict):
        payload = json.dumps(data)
        dead_queues = []
        for queue in self._subscribers:
            try:
                await queue.put({"event": event_type, "data": payload})
            except Exception:
                dead_queues.append(queue)
        for q in dead_queues:
            self._subscribers.remove(q)

    async def publish_event(self, upload_id: int):
        await self.broadcast("published", {
            "active_upload_id": upload_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })


event_manager = EventManager()
