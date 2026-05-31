import logging


def get_logger(name: str):
    # Create logger
    logger = logging.getLogger(name)

    # Prevent duplicate handlers
    if not logger.handlers:

        # Set minimum log level
        logger.setLevel(logging.INFO)

        # Create terminal handler
        handler = logging.StreamHandler()

        # Create format
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )

        # Apply format to handler
        handler.setFormatter(formatter)

        # Attach handler to logger
        logger.addHandler(handler)

    return logger