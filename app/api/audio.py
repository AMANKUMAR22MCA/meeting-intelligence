import os
from fastapi import APIRouter, UploadFile, File, HTTPException,Depends
from app.services.groq_service import transcribe_audio, summarize_transcript
from app.core.logger import get_logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.schemas import UploadResponse, MeetingResponse
from app.core.database import get_db
from app.models.meeting import Meeting
import base64
from app.tasks.audio_tasks import process_audio_task
from app.core.celery_app import celery_app
from celery.result import AsyncResult
import time
from fastapi import Form

router = APIRouter()

logger = get_logger(__name__)

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".mp4", ".webm", ".ogg"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB (Groq's limit)


@router.get("/meetings",response_model=list[MeetingResponse])
async def get_meetings(skip:int=0,limit:int=10,db:AsyncSession=Depends(get_db)):
    '''get all the meetings by newest first'''
    result = await db.execute(select (Meeting)
    .order_by(desc(Meeting.created_at))
    .offset(skip)
    .limit(limit)
    )
    meetings = result.scalars().all()
    return meetings

@router.get("/meetings/{meeting_id}",response_model=MeetingResponse)
async def get_meeting(meeting_id: int,db: AsyncSession = Depends(get_db)):
    '''get meeting by id '''
    result = await db.execute(select(Meeting).where(Meeting.id == meeting_id))
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise HTTPException(status_code=404,detail="Meeting not found")
    return meeting

@router.post("/upload-async")
async def upload_async(
    file: UploadFile = File(...),
    email: str = Form(None),
    db: AsyncSession = Depends(get_db)
):

    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type"
        )

    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large"
        )

    # create pending meeting
    meeting = Meeting(
        filename=file.filename
    )

    db.add(meeting)
    await db.commit()
    await db.refresh(meeting)

    # encode bytes → base64
    file_bytes_b64 = base64.b64encode(
        file_bytes
    ).decode("utf-8")

    # # send celery task
    # task = process_audio_task.delay(
    #     file_bytes_b64,
    #     file.filename,
    #     meeting.id,
    #     to_email=email
    # )
    import inspect

    print(process_audio_task)
    print(process_audio_task.run)
    print(inspect.signature(process_audio_task.run))
    task = process_audio_task.apply_async(
    args=[file_bytes_b64, file.filename, meeting.id, email],)

    return {
        "job_id": task.id,
        "meeting_id": meeting.id,
        "status": "processing"
    }

@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):

    result = AsyncResult(
        job_id,
        app=celery_app
    )

    return {
        "job_id": job_id,
        "status": result.status,
        "result": result.result
    }

@router.post("/upload",response_model=UploadResponse)
async def upload_meeting(file: UploadFile = File(...),db: AsyncSession = Depends(get_db)):
    """
    Upload a meeting audio file.
    Returns transcript + AI-generated summary + action items.
    """

    # --- Validation ---
    logger.info(f"Upload started: {file.filename}")
    start_time = time.time()
    
    
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        logger.error(f"Unsupported file type: {ext}")
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not supported. Use: {ALLOWED_EXTENSIONS}"
        )

    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_SIZE:
        logger.error(f"File too large: {file.filename}")
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size is 25MB."
        )

    # --- Transcription ---
    try:
        transcription_start = time.time()
        transcript = await transcribe_audio(file_bytes, file.filename)
        transcription_end = time.time()
        transcription_time = transcription_end - transcription_start
        word_count = len(transcript.split())
        logger.info(f"transcript completed : {word_count} words in {transcription_time:.2f} secs")
    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    # --- Summarization ---
    try:
        summary_start = time.time()
        analysis = await summarize_transcript(transcript)
        summary_end = time.time()
        summary_time = summary_end - summary_start
        logger.info(
        f"Summarization completed in "
        f"{summary_time:.2f} seconds"
    )
    except Exception as e:
        logger.error(f"Summarization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")
    processing_time = time.time() - start_time
    logger.info(f"Request completed in {processing_time:.2f}s")

    meeting = Meeting(
        filename=file.filename,
        transcript=transcript,
        summary=analysis["summary"],
        action_items=analysis["action_items"],
        sentiment=analysis["meeting_sentiment"],
        processing_time=processing_time
    )

    db.add(meeting)
    await db.commit()
    await db.refresh(meeting)

    return {
    "id": meeting.id,
    "created_at": meeting.created_at,
    "filename": meeting.filename,
    "transcript": meeting.transcript,
    "analysis": analysis
    }
  
