import logging
from pythonjsonlogger import jsonlogger
from datetime import datetime

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super(CustomJsonFormatter, self).add_fields(log_record, record, message_dict)
        if not log_record.get('timestamp'):
            # this doesn't use record.created, so it is slightly off
            now = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            log_record['timestamp'] = now
        if log_record.get('level'):
            log_record['level'] = log_record['level'].upper()
        else:
            log_record['level'] = record.levelname

def setup_logging(log_level="INFO", is_prod=False):
    """
    Configures logging.
    - Production: Uses Structured JSON Logging (easy for Render/Datadog to parse)
    - Development: Uses Pretty Human-Readable Logging
    """
    root_logger = logging.getLogger()
    handler = logging.StreamHandler()
    
    if is_prod:
        formatter = CustomJsonFormatter('%(timestamp)s %(level)s %(name)s %(message)s')
    else:
        # Standard readable format for development
        formatter = logging.Formatter(
            fmt="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        
    handler.setFormatter(formatter)
    root_logger.handlers = [handler]
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    
    # Silence noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("stripe").setLevel(logging.INFO)
