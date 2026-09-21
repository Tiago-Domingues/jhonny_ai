#!/usr/bin/env python3
"""Build the three CV layout variants (baseline cv/ files are never modified)."""

from __future__ import annotations

import html
from pathlib import Path

from weasyprint import HTML

import shared_content as C

ROOT = Path(__file__).resolve().parent


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def bullets(items: list[str]) -> str:
    return "<ul>" + "".join(f"<li>{esc(b)}</li>" for b in items) + "</ul>"


def job_block(title: str, org: str, dates: str, blurb: str, items: list[str], cls: str = "job") -> str:
    return f"""
    <div class="{cls}">
      <div class="job-header">
        <h3>{esc(title)}</h3>
        <span class="job-dates">{esc(dates)}</span>
      </div>
      <p class="job-org">{esc(org)}</p>
      <p class="job-blurb">{esc(blurb)}</p>
      {bullets(items)}
    </div>"""


def additional_block(title: str, org: str, dates: str, blurb: str) -> str:
    return f"""
    <div class="job additional">
      <div class="job-header">
        <h3>{esc(title)}</h3>
        <span class="job-dates">{esc(dates)}</span>
      </div>
      <p class="job-org">{esc(org)}</p>
      <p class="job-blurb">{esc(blurb)}</p>
    </div>"""


def experience_html() -> str:
    return "".join(job_block(*j) for j in C.EXPERIENCE)


def additional_html() -> str:
    return "".join(additional_block(*a) for a in C.ADDITIONAL)


def skills_html(two_col: bool = False) -> str:
    items = "".join(
        f"<p><strong>{esc(k)}:</strong> {esc(v)}</p>" for k, v in C.SKILLS
    )
    items += f"<p><strong>Languages:</strong> {esc(C.LANGUAGES)}</p>"
    cls = "skills-grid two-col" if two_col else "skills-grid"
    return f'<div class="{cls}">{items}</div>'


def education_html() -> str:
    parts = []
    for school, dates, detail in C.EDUCATION:
        parts.append(
            f"""<div class="edu-item">
      <div class="edu-header"><h3>{esc(school)}</h3><span class="edu-meta">{esc(dates)}</span></div>
      <p>{esc(detail)}</p>
    </div>"""
        )
    return "".join(parts)


def certifications_html() -> str:
    parts = []
    for name, meta in C.CERTIFICATIONS:
        parts.append(
            f"""<div class="cert-item">
      <div class="cert-header"><strong>{esc(name)}</strong><span class="cert-meta">{esc(meta)}</span></div>
    </div>"""
        )
    return "".join(parts)


def publications_html() -> str:
    return "".join(f'<p class="pub-line">{esc(p)}</p>' for p in C.PUBLICATIONS)


def activities_html(activities=None) -> str:
    items = activities if activities is not None else C.ACTIVITIES
    parts = []
    for title, body in items:
        parts.append(
            f'<div class="act-item"><strong>{esc(title)}.</strong> {esc(body)}</div>'
        )
    return "".join(parts)


def highlights_html() -> str:
    return (
        '<ul class="highlights">'
        + "".join(f"<li><strong>{esc(k)}:</strong> {esc(v)}</li>" for k, v in C.HIGHLIGHTS)
        + "</ul>"
    )


def sidebar_skills() -> str:
    return "".join(
        f'<div class="side-block"><h4>{esc(k)}</h4><p>{esc(v)}</p></div>'
        for k, v in C.SKILLS
    )


def sidebar_edu() -> str:
    return "".join(
        f'<div class="side-edu"><strong>{esc(school.split("—")[0].strip())}</strong>'
        f'<span>{esc(dates)}</span><p>{esc(detail)}</p></div>'
        for school, dates, detail in C.EDUCATION
    )


def sidebar_certs(certs=None) -> str:
    items = certs if certs is not None else C.CERTIFICATIONS
    return "".join(
        f'<div class="side-cert"><strong>{esc(name)}</strong><span>{esc(meta)}</span></div>'
        for name, meta in items
    )


# V3-only trims to keep a single-page two-column layout
V3_CERTIFICATIONS = [c for c in C.CERTIFICATIONS if not c[0].startswith("R Programming")]
V3_ACTIVITIES = [a for a in C.ACTIVITIES if not a[0].startswith("Volunteer")]


# --- V1 Classic refined ---

def render_v1() -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>CV — {esc(C.NAME)} (Classic refined)</title>
  <link rel="stylesheet" href="cv.css" />
</head>
<body>
  <header class="header">
    <h1>{esc(C.NAME)}</h1>
    <p class="headline">{esc(C.HEADLINE)}</p>
    <p class="contact">{esc(C.LOCATION)} · {esc(C.PHONE)} · {esc(C.EMAIL)} ·
      <a href="{esc(C.LINKEDIN_URL)}">{esc(C.LINKEDIN)}</a></p>
  </header>

  <h2>Professional Summary</h2>
  <div class="summary">
    <p>{esc(C.SUMMARY)}</p>
    {highlights_html()}
  </div>

  <h2>Work Experience</h2>
  {experience_html()}

  <h2>Additional Experience</h2>
  {additional_html()}

  <h2>Technical Skills</h2>
  {skills_html(two_col=True)}

  <h2>Education</h2>
  {education_html()}

  <h2>Certifications</h2>
  {certifications_html()}

  <h2>Selected Publications</h2>
  {publications_html()}

  <h2>Activities &amp; Awards</h2>
  {activities_html()}
</body>
</html>
"""


V1_CSS = """
@page { size: A4; margin: 14mm 15mm 14mm 15mm; }
* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  font-family: "Liberation Serif", "Times New Roman", Times, serif;
  font-size: 9.3pt; line-height: 1.28; color: #111;
}
.header { text-align: center; margin-bottom: 8pt; }
h1 {
  margin: 0; font-size: 14.5pt; font-weight: 700;
  letter-spacing: 0.05em; text-transform: uppercase;
}
.headline {
  margin: 2pt 0 3pt 0; font-size: 9.5pt; font-style: italic; color: #222;
}
.contact { margin: 0; font-size: 8.6pt; line-height: 1.35; }
.contact a { color: #111; text-decoration: none; }
h2 {
  margin: 8pt 0 3.5pt 0; font-size: 10pt; font-weight: 700;
  letter-spacing: 0.07em; text-transform: uppercase;
  border-bottom: 1pt solid #222; padding-bottom: 1.5pt;
}
h3 { margin: 0; font-size: 9.5pt; font-weight: 700; }
.job, .additional { margin: 0 0 6pt 0; break-inside: avoid; page-break-inside: avoid; }
.job-header { display: flex; justify-content: space-between; gap: 8pt; align-items: baseline; }
.job-dates { white-space: nowrap; font-size: 8.6pt; }
.job-org { font-style: italic; margin: 0 0 2pt 0; font-size: 9pt; }
.job-blurb { text-align: justify; margin: 0 0 2pt 0; }
ul { margin: 0; padding-left: 12pt; }
li { margin: 0 0 1pt 0; text-align: justify; }
.summary p { text-align: justify; margin: 0 0 2pt 0; }
.highlights { margin: 2pt 0 0 0; }
.skills-grid.two-col {
  column-count: 2; column-gap: 14pt;
}
.skills-grid p { margin: 0 0 1.5pt 0; break-inside: avoid; }
.edu-item, .cert-item { margin: 0 0 3.5pt 0; break-inside: avoid; }
.edu-header, .cert-header { display: flex; justify-content: space-between; gap: 8pt; }
.edu-meta, .cert-meta { font-size: 8.6pt; white-space: nowrap; }
.pub-line { margin: 0 0 2.5pt 0; font-size: 8.8pt; }
.act-item { margin: 0 0 3.5pt 0; font-size: 8.9pt; text-align: justify; break-inside: avoid; }
"""


# --- V2 Executive ---

def render_v2() -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>CV — {esc(C.NAME)} (Executive)</title>
  <link rel="stylesheet" href="cv.css" />
</head>
<body>
  <header class="header">
    <h1>{esc(C.NAME)}</h1>
    <p class="headline">{esc(C.HEADLINE)}</p>
    <p class="contact">{esc(C.LOCATION)} · {esc(C.PHONE)} · {esc(C.EMAIL)} ·
      <a href="{esc(C.LINKEDIN_URL)}">{esc(C.LINKEDIN)}</a></p>
  </header>

  <h2>Profile</h2>
  <p class="summary">{esc(C.SUMMARY)}</p>

  <h2>Experience</h2>
  {experience_html()}

  <h2>Additional Experience</h2>
  {additional_html()}

  <h2>Skills</h2>
  {skills_html(two_col=True)}

  <div class="bottom-grid">
    <div>
      <h2>Education</h2>
      {education_html()}
      <h2>Certifications</h2>
      {certifications_html()}
    </div>
    <div>
      <h2>Publications</h2>
      {publications_html()}
      <h2>Activities</h2>
      {activities_html()}
    </div>
  </div>
</body>
</html>
"""


V2_CSS = """
@page { size: A4; margin: 15mm 16mm 15mm 16mm; }
* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  font-family: "Liberation Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 9pt; line-height: 1.32; color: #1a1a1a;
}
.header { margin-bottom: 10pt; padding-bottom: 8pt; border-bottom: 1.5pt solid #1a2744; }
h1 {
  margin: 0; font-size: 18pt; font-weight: 700; letter-spacing: -0.01em;
  color: #1a2744; text-transform: none;
}
.headline {
  margin: 3pt 0 4pt 0; font-size: 10pt; font-weight: 500; color: #334155;
}
.contact { margin: 0; font-size: 8.5pt; color: #444; }
.contact a { color: #1a2744; text-decoration: none; }
h2 {
  margin: 10pt 0 4pt 0; font-size: 9pt; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase; color: #1a2744;
  border-bottom: 0.6pt solid #cbd5e1; padding-bottom: 2pt;
}
h3 { margin: 0; font-size: 9.4pt; font-weight: 700; color: #111; }
.summary { text-align: justify; margin: 0 0 2pt 0; }
.job, .additional { margin: 0 0 7pt 0; break-inside: avoid; page-break-inside: avoid; }
.job-header { display: flex; justify-content: space-between; gap: 8pt; align-items: baseline; }
.job-dates { white-space: nowrap; font-size: 8.3pt; color: #555; }
.job-org { margin: 0 0 2pt 0; font-size: 8.7pt; color: #334155; font-weight: 500; font-style: normal; }
.job-blurb { text-align: justify; margin: 0 0 2pt 0; color: #222; }
ul { margin: 0; padding-left: 12pt; }
li { margin: 0 0 1.2pt 0; text-align: justify; }
.skills-grid.two-col { column-count: 2; column-gap: 16pt; }
.skills-grid p { margin: 0 0 2pt 0; break-inside: avoid; font-size: 8.6pt; }
.edu-item, .cert-item { margin: 0 0 4pt 0; break-inside: avoid; }
.edu-header, .cert-header { display: flex; justify-content: space-between; gap: 8pt; }
.edu-meta, .cert-meta { font-size: 8.2pt; color: #555; white-space: nowrap; }
.edu-item p { margin: 1pt 0 0 0; font-size: 8.5pt; }
.pub-line { margin: 0 0 3pt 0; font-size: 8.4pt; }
.act-item { margin: 0 0 4pt 0; font-size: 8.4pt; text-align: justify; break-inside: avoid; }
.bottom-grid { display: flex; gap: 16pt; }
.bottom-grid > div { flex: 1; }
"""


# --- V3 Two-column (single-page table layout for stable sidebar) ---

def _v3_recent_jobs() -> str:
    return "".join(job_block(*j) for j in C.EXPERIENCE[:5])


def _v3_earlier_jobs() -> str:
    parts = []
    for title, org, dates, blurb, items in C.EXPERIENCE[5:]:
        detail = blurb
        if items:
            detail += " " + " ".join(f"• {x}" for x in items[:2])
        parts.append(
            f"""<div class="job compact-job">
      <div class="job-header"><h3>{esc(title)}</h3><span class="job-dates">{esc(dates)}</span></div>
      <p class="job-org">{esc(org)}</p>
      <p class="job-blurb">{esc(detail)}</p>
    </div>"""
        )
    return "".join(parts)


def render_v3() -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>CV — {esc(C.NAME)} (Two-column)</title>
  <link rel="stylesheet" href="cv.css" />
</head>
<body>
  <table class="page-table">
    <tr>
      <td class="sidebar">
        <h1>{esc(C.NAME)}</h1>
        <p class="headline">{esc(C.HEADLINE)}</p>
        <div class="side-contact">
          <p>{esc(C.LOCATION)}</p>
          <p>{esc(C.PHONE)}</p>
          <p>{esc(C.EMAIL)}</p>
          <p><a href="{esc(C.LINKEDIN_URL)}">{esc(C.LINKEDIN)}</a></p>
        </div>
        <h2>Skills</h2>
        {sidebar_skills()}
        <div class="side-block"><h4>Spoken languages</h4><p>{esc(C.LANGUAGES)}</p></div>
        <h2>Certifications</h2>
        {sidebar_certs(V3_CERTIFICATIONS)}
        <h2>Education</h2>
        {sidebar_edu()}
        <h2>Publications</h2>
        {publications_html()}
        <h2>Activities</h2>
        {activities_html(V3_ACTIVITIES)}
      </td>
      <td class="main">
        <h2>Profile</h2>
        <p class="summary">{esc(C.SUMMARY)}</p>
        <h2>Experience</h2>
        {_v3_recent_jobs()}
        {_v3_earlier_jobs()}
        <h2>Additional</h2>
        {additional_html()}
      </td>
    </tr>
  </table>
</body>
</html>
"""


V3_CSS = """
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  font-family: "Liberation Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 8pt; line-height: 1.22; color: #1a1a1a;
}
.page-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.page-table td { vertical-align: top; }
.sidebar {
  width: 32%;
  background: #f4f6f9;
  color: #1a2744;
  padding: 11mm 7mm 10mm 9mm;
}
.main {
  width: 68%;
  padding: 11mm 10mm 10mm 8mm;
}
.sidebar h1 {
  margin: 0 0 3pt 0; font-size: 11.5pt; font-weight: 700;
  line-height: 1.12; color: #1a2744;
}
.sidebar .headline {
  margin: 0 0 6pt 0; font-size: 7.4pt; font-weight: 600;
  color: #334155; line-height: 1.25;
}
.side-contact { margin: 0 0 6pt 0; font-size: 7.2pt; color: #333; }
.side-contact p { margin: 0 0 1pt 0; }
.side-contact a { color: #1a2744; text-decoration: none; word-break: break-all; }
.sidebar h2, .main h2 {
  margin: 6pt 0 2.5pt 0; font-size: 7.4pt; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; color: #1a2744;
  border-bottom: 1pt solid #1a2744; padding-bottom: 1.5pt;
}
.side-block { margin: 0 0 3pt 0; }
.side-block h4 { margin: 0 0 0.5pt 0; font-size: 7.2pt; font-weight: 700; color: #1a2744; }
.side-block p { margin: 0; font-size: 7pt; color: #333; line-height: 1.2; }
.side-cert, .side-edu { margin: 0 0 3pt 0; }
.side-cert strong, .side-edu strong { display: block; font-size: 7.2pt; color: #1a2744; }
.side-cert span, .side-edu span { display: block; font-size: 6.8pt; color: #555; margin: 0.5pt 0; }
.side-edu p { margin: 0; font-size: 6.9pt; color: #333; }
.summary { text-align: justify; margin: 0 0 2pt 0; font-size: 7.8pt; }
h3 { margin: 0; font-size: 8.1pt; font-weight: 700; }
.job, .additional { margin: 0 0 3.5pt 0; break-inside: avoid; page-break-inside: avoid; }
.compact-job .job-blurb { margin-bottom: 0; }
.job-header { display: flex; justify-content: space-between; gap: 5pt; align-items: baseline; }
.job-dates { white-space: nowrap; font-size: 7pt; color: #555; }
.job-org { margin: 0 0 1pt 0; font-size: 7.3pt; color: #334155; font-weight: 500; font-style: normal; }
.job-blurb { text-align: justify; margin: 0 0 1pt 0; font-size: 7.4pt; }
ul { margin: 0; padding-left: 10pt; }
li { margin: 0 0 0.4pt 0; text-align: justify; font-size: 7.3pt; }
.pub-line { margin: 0 0 1.5pt 0; font-size: 7.1pt; }
.act-item { margin: 0 0 2pt 0; font-size: 7.1pt; text-align: justify; break-inside: avoid; }
"""


VARIANTS = [
    ("v1-classic-refined", render_v1, V1_CSS),
    ("v2-executive", render_v2, V2_CSS),
    ("v3-two-column", render_v3, V3_CSS),
]


def main() -> None:
    for name, render, css in VARIANTS:
        folder = ROOT / name
        folder.mkdir(parents=True, exist_ok=True)
        html_path = folder / "index.html"
        css_path = folder / "cv.css"
        pdf_path = folder / "CV_TiagoDomingues.pdf"
        html_path.write_text(render(), encoding="utf-8")
        css_path.write_text(css, encoding="utf-8")
        HTML(filename=str(html_path)).write_pdf(str(pdf_path))
        print(f"Wrote {pdf_path}")


if __name__ == "__main__":
    main()
