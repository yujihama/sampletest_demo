from __future__ import annotations

from pathlib import Path
import os

# Base project root (two levels up from this file)
PROJECT_ROOT = Path(os.getenv("PROJECT_ROOT", Path(__file__).resolve().parent.parent))

DATA_DIR = PROJECT_ROOT / "data"
SAMPLE_DATA_DIR = DATA_DIR / "sample"
FORMAT_DIR = DATA_DIR / "format"
DEFAULT_FORMAT_FILE = FORMAT_DIR / "サンプルテスト調書フォーマット.xlsx"
