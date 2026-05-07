import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from models import User
from config import get_settings

log = logging.getLogger(__name__)
settings = get_settings()

async def send_agent_alert(user: User, agent_name: str, error_message: str):
    """
    Sends an email alert using SMTP (e.g. Gmail).
    Falls back to Mock Email Service if credentials are missing.
    """
    if not user.email_notifications:
        log.info(f"Skipping email alert for {user.email} (notifications disabled)")
        return

    if not user.email:
        log.warning(f"Cannot send email to user {user.id}: No email address found")
        return

    subject = f"⚠️ Beaver Agent Alert: {agent_name}"
    html_body = f"""
    <html>
      <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #dc2626;">Your AI Agent encountered an error</h2>
        <p><b>Agent:</b> {agent_name}</p>
        <p><b>Error Details:</b></p>
        <pre style="background: #f4f4f4; padding: 15px; border-radius: 8px; border: 1px solid #ddd; white-space: pre-wrap;">{error_message}</pre>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">
          This is an automated alert from your Beaver Agentic Studio. 
          You can disable these alerts in your dashboard settings.
        </p>
      </body>
    </html>
    """

    # Use SMTP if password is provided
    if settings.email_password and settings.email_user:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"Beaver Studio <{settings.email_user}>"
            msg["To"] = user.email

            msg.attach(MIMEText(error_message, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(settings.email_host, settings.email_port) as server:
                server.starttls()  # Secure the connection
                server.login(settings.email_user, settings.email_password)
                server.sendmail(settings.email_user, user.email, msg.as_string())
            
            log.info(f"Real SMTP email sent to {user.email}")
            return
        except Exception as e:
            log.error(f"SMTP failed to send email: {e}")

    # Fallback to Mock
    print("\n" + "="*50)
    print(f"📧 [MOCK EMAIL SENT]")
    print(f"TO:      {user.email}")
    print(f"SUBJECT: {subject}")
    print(f"BODY:    {error_message}")
    print("="*50 + "\n")
