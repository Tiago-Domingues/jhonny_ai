#!/usr/bin/env python3
"""Render TiagoDomingues_CV.html to PDF via WeasyPrint."""

from pathlib import Path

from weasyprint import HTML

ROOT = Path(__file__).resolve().parent
HTML_PATH = ROOT / "TiagoDomingues_CV.html"
PDF_PATH = ROOT / "CV_TiagoDomingues.pdf"


def main() -> None:
    HTML(filename=str(HTML_PATH)).write_pdf(str(PDF_PATH))
    print(f"Wrote {PDF_PATH}")


if __name__ == "__main__":
    main()
