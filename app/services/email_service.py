import httpx
from typing import Any

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)


async def send_meeting_summary(
    to_email: str,
    filename: str,
    summary: str,
    action_items: list[dict[str, Any]]
) -> bool:
    """
    Send meeting summary email via SendGrid API.

    Args:
        to_email: Recipient email address
        filename: Meeting file name
        summary: AI-generated summary
        action_items: List of action item dictionaries

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Format action items
        if action_items:
            formatted_items = []

            for idx, item in enumerate(action_items, start=1):
                formatted_items.append(
                    f"{idx}. Task: {item.get('task', 'N/A')}\n"
                    f"   Owner: {item.get('owner', 'Unassigned')}\n"
                    f"   Deadline: {item.get('deadline', 'No deadline')}"
                )

            action_items_text = (
                "\n\nAction Items:\n"
                + "=" * 50
                + "\n"
                + "\n\n".join(formatted_items)
            )
        else:
            action_items_text = "\n\nNo action items identified."

        email_body = f"""
Meeting Summary - {filename}
==================================================

Summary:
{summary}

{action_items_text}
"""

        payload = {
            "personalizations": [
                {
                    "to": [
                        {
                            "email": to_email
                        }
                    ]
                }
            ],
            "from": {
                "email": settings.SENDGRID_FROM_EMAIL
            },
            "subject": f"Meeting Summary — {filename}",
            "content": [
                {
                    "type": "text/plain",
                    "value": email_body
                }
            ]
        }

        headers = {
            "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers=headers,
                json=payload
            )

        if response.status_code == 202:
            logger.info(
                "Meeting summary email sent successfully to %s",
                to_email
            )
            return True

        logger.error(
            "Failed to send email to %s. Status: %s. Response: %s",
            to_email,
            response.status_code,
            response.text
        )
        return False

    except Exception:
        logger.exception(
            "Error sending meeting summary email to %s",
            to_email
        )
        return False