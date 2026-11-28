import pymysql
from pymysql.cursors import DictCursor

DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",
    "password": "",
    "database": "archive_store",
    "charset": "utf8mb4",
    "cursorclass": DictCursor,
}


def get_db_connection():
    """Open and return a new connection to the archive_store MySQL database."""
    return pymysql.connect(**DB_CONFIG)