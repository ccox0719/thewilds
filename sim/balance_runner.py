from __future__ import annotations

try:
    from .balance_runner_v2 import run
except ImportError:  # pragma: no cover
    import sys
    from pathlib import Path

    sys.path.append(str(Path(__file__).resolve().parent))
    from balance_runner_v2 import run  # type: ignore


if __name__ == "__main__":
    run()
