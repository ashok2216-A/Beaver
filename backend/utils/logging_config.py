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

class ColoredFormatter(logging.Formatter):
    """
    Pretty, terminal-colorized log formatter for local development.
    Uses Orange for warnings, Red for errors, Green for info, Grey for debug.
    """
    GREY = "\033[90m"
    GREEN = "\033[32m"
    ORANGE = "\033[38;5;208m"
    RED = "\033[31m"
    BOLD_RED = "\033[1;31m"
    RESET = "\033[0m"

    LEVEL_COLORS = {
        logging.DEBUG: GREY,
        logging.INFO: GREEN,
        logging.WARNING: ORANGE,
        logging.ERROR: RED,
        logging.CRITICAL: BOLD_RED,
    }

    def format(self, record):
        level_color = self.LEVEL_COLORS.get(record.levelno, self.RESET)
        orig_levelname = record.levelname
        
        # Pad the level name to keep output perfectly aligned
        padded_lvl = f"{orig_levelname:<8}"
        record.levelname = f"{level_color}{padded_lvl}{self.RESET}"
        
        result = super().format(record)
        record.levelname = orig_levelname
        return result

def setup_logging(log_level="INFO", is_prod=False):
    """
    Configures logging.
    - Production: Uses Structured JSON Logging (easy for Render/Datadog to parse)
    - Development: Uses Pretty Human-Readable Terminal Logging with colors
    """
    root_logger = logging.getLogger()
    handler = logging.StreamHandler()
    
    if is_prod:
        formatter = CustomJsonFormatter('%(timestamp)s %(level)s %(name)s %(message)s')
    else:
        # Standard readable format with colors for local development
        formatter = ColoredFormatter(
            fmt="%(asctime)s │ %(levelname)s │ %(name)s │ %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        
    handler.setFormatter(formatter)
    root_logger.handlers = [handler]
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    
    # Silence noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("stripe").setLevel(logging.INFO)
