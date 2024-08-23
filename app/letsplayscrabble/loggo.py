import logging
import os
import sys

def setup_logging() -> None:
    # Read environment variable
    log_level = os.getenv('LOG_LEVEL', 'WARNING').upper()
    print(f"Current LOG_LEVEL: {log_level}")

    # Configure logging to handle different log levels dynamically
    numeric_level = getattr(logging, log_level, None)

    if not isinstance(numeric_level, int):
        raise ValueError(f'Invalid log level: {log_level}')

    logging.basicConfig(level=numeric_level,
                        format='%(asctime)s - %(levelname)s - %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S',
                        handlers=[logging.StreamHandler(sys.stdout)])

def get_logger(name):
    return logging.getLogger(name)

setup_logging()
