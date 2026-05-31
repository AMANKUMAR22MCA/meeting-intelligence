import base64
import asyncio
from app.core.celery_app import celery_app
from app.core.config import settings
from app.core.logger import get_logger
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import time
from app.models.meeting import Meeting 
from app.services.groq_service import transcribe_audio, summarize_transcript
from app.services.email_service import send_meeting_summary
logger = get_logger(__name__)

# Sync engine — Celery can't use async
sync_engine = create_engine(
    settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://"),
    pool_pre_ping=True  # tests connection before using it
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    expire_on_commit=False
)


@celery_app.task(bind=True, max_retries=3)
def process_audio_task(self, file_bytes_b64: str, filename: str, meeting_id: int, to_email: str = None):
    """
    Background task: transcribe audio + summarize + update DB
    bind=True → gives us 'self' to call self.retry()
    """
    try:
        # Step 1 — decode base64 back to raw bytes
        file_bytes = base64.b64decode(file_bytes_b64)
        logger.info(f"Task started for meeting_id: {meeting_id}")
        task_start_time = time.time()
        # Step 2 — transcribe (groq_service uses async, so we run it in event loop)
        with SyncSessionLocal() as db:
           meeting = db.get(Meeting, meeting_id)
           if meeting:
                meeting.status = "processing"
                db.commit()
        
        loop = asyncio.new_event_loop()
        transcript = loop.run_until_complete(
            transcribe_audio(file_bytes, filename)
        )
        
        # Step 3 — summarize
        analysis = loop.run_until_complete(
            summarize_transcript(transcript)
        )
        loop.close()

        # Step 4 — update meeting in DB (sync)
        with SyncSessionLocal() as db:
            
            meeting = db.get(Meeting, meeting_id)
            
            if meeting:
                meeting.transcript = transcript
                meeting.summary = analysis["summary"]
                meeting.action_items = analysis["action_items"]
                meeting.sentiment = analysis["meeting_sentiment"]
                meeting.status = "completed"
                meeting.processing_time = time.time() - task_start_time
                db.commit()
                logger.info(f"Meeting {meeting_id} updated successfully")
                # after meeting.status = "completed" and db.commit()
                if to_email:
                    loop2 = asyncio.new_event_loop()
                    loop2.run_until_complete(
                        send_meeting_summary(
                            to_email=to_email,
                            filename=filename,
                            summary=analysis["summary"],
                            action_items=analysis["action_items"]
                        )
                    )
                    loop2.close()

        return {"meeting_id": meeting_id, "status": "completed"}

    except Exception as exc:
        logger.error(f"Task failed for meeting {meeting_id}: {str(exc)}")
        # retry after 60 seconds, passes the exception along
        # update failed status
        with SyncSessionLocal() as db:

            meeting = db.get(Meeting, meeting_id)

            if meeting:
                meeting.status = "failed"
                db.commit()
        raise self.retry(exc=exc, countdown=60)