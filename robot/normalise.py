"""Turning one post from any source into the shape src/engine.js reads.

The engine reads free text, so these helpers keep the post's own short wording
("Tk. 20,000 - 25,000", "1 to 3 years", "Mirpur, Dhaka") rather than inventing codes.
`req` is deliberately NOT the description: only the keywords the matcher needs.
"""
from __future__ import annotations

import html
import re
import unicodedata
from datetime import date, datetime, timedelta, timezone

DHAKA = timezone(timedelta(hours=6))

BN_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
BN_MONTHS = {
    "জানুয়ারি": 1, "ফেব্রুয়ারি": 2, "মার্চ": 3, "এপ্রিল": 4, "মে": 5, "জুন": 6,
    "জুলাই": 7, "আগস্ট": 8, "সেপ্টেম্বর": 9, "অক্টোবর": 10, "নভেম্বর": 11, "ডিসেম্বর": 12,
}
EN_MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}

# Same list as SCAM_PATTERNS in src/taxonomy.js, kept in step by hand.
SCAM = [
    re.compile(p, re.I) for p in (
        r"registration fee", r"security (money|deposit)", r"training fee", r"processing fee",
        r"(pay|send|deposit)\s+(tk\.?|taka|bdt|৳)\s?\d",
        r"(bkash|nagad|rocket)\s+(number|no\.?|payment)", r"investment required",
        r"earn\s+(tk\.?|taka|bdt|৳)?\s?[\d,]+\s*(per|a|/)\s*day", r"no interview",
    )
] + [re.compile(p) for p in (r"জামানত", r"রেজিস্ট্রেশন ফি", r"টাকা জমা")]

def _rx(pattern: str, flags=re.I):
    """A pattern in the same Unicode form text_of() gives the text (Bangla letters such as য় have two)."""
    return re.compile(unicodedata.normalize("NFC", pattern), flags)


# Short phrases worth keeping in `req` because the engine looks for them.
SIGNALS = [
    _rx(r"freshers?[^.]{0,40}(are\s+)?(also\s+)?(encouraged|welcome|can apply|may apply)"),
    _rx(r"no experience (is )?(needed|required)"),
    _rx(r"ফ্রেশার[^।.]{0,30}"),
    _rx(r"অভিজ্ঞতার প্রয়োজন নেই"),
    _rx(r"(age|বয়স)[^.।]{0,40}?\d{2}[^.।]{0,25}"),
    _rx(r"(only|শুধুমাত্র|শুধু)\s*(females?|males?|নারী|পুরুষ)[^.।]{0,20}"),
    _rx(r"(females?|males?|নারী|পুরুষ)\s*(candidates?\s*)?only"),
    _rx(r"(driving|driver'?s?|valid)\s+licen[cs]e[^.।]{0,20}"),
    _rx(r"ড্রাইভিং লাইসেন্স"),
]

# How a post words the experience and the education it asks for. A company's own board gives no
# separate field for either: they are sentences in the description.
_NUM = r"[\d০-৯]+(?:\.[\d০-৯]+)?"
_SPAN = r"\s*(?:\+|(?:to|-|–|থেকে|হতে)\s*" + _NUM + r")?\s*\+?\s*"
EXPERIENCE = [
    _rx(_NUM + _SPAN + r"(?:years?|yrs?|year\(s\))['’s]*\s*(?:of\s+)?(?:[a-z-]+\s+){0,3}experience"),
    _rx(r"experience\s*(?:of|:|-)?\s*(?:at least|minimum|min\.?)?\s*" + _NUM + _SPAN + r"(?:years?|yrs?|year\(s\))"),
    _rx(_NUM + _SPAN + r"(?:বছর|বৎসর)(?:ের)?\s*(?:বাস্তব\s*)?(?:কাজের\s*)?অভিজ্ঞতা"),
    _rx(r"অভিজ্ঞতা[^।.\d০-৯]{0,20}" + _NUM + _SPAN + r"(?:বছর|বৎসর)"),
]
REQUIREMENTS_START = _rx(r"requirements?|qualifications?|what you(?:'ll| will)? (?:need|bring)|who you are|you (?:should |must )?have|eligibility|যোগ্যতা")
EDUCATION = _rx(r"(?:bachelor|\bb\.?\s?sc\b|\bbba\b|\bmba\b|master'?s?\b|\bm\.?\s?sc\b|post[- ]?graduat\w*|graduat(?:e|ion)\b|diploma|honou?rs|\bhsc\b|\bssc\b|স্নাতকোত্তর|স্নাতক|ডিপ্লোমা|এইচএসসি|এসএসসি)[^.;।\n]{0,60}")

TAGS = re.compile(r"<[^>]+>")
SPACES = re.compile(r"\s+")


def digits(s: str) -> str:
    return (s or "").translate(BN_DIGITS)


def text_of(raw: str | None) -> str:
    """HTML or messy text -> one clean line."""
    if not raw:
        return ""
    s = TAGS.sub(" ", str(raw))
    s = html.unescape(s)
    s = unicodedata.normalize("NFC", s)
    return SPACES.sub(" ", s).strip()


def iso_date(value) -> str | None:
    """Many date spellings, English and Bangla, -> YYYY-MM-DD."""
    if not value:
        return None
    if isinstance(value, (int, float)):                       # unix seconds
        try:
            return datetime.fromtimestamp(float(value), tz=DHAKA).date().isoformat()
        except (OverflowError, OSError, ValueError):
            return None
    s = digits(text_of(str(value)))
    if not s:
        return None
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", s)              # ISO / schema.org
    if m:
        return _safe(int(m[1]), int(m[2]), int(m[3]))
    for name, num in BN_MONTHS.items():                        # ২৬ অক্টোবর ২০২৬
        if name in s:
            m = re.search(r"(\d{1,2})\s*" + name + r"[,\s]*(\d{4})", s)
            if m:
                return _safe(int(m[2]), num, int(m[1]))
    m = re.search(r"(\d{1,2})[\s/-]+([A-Za-z]{3,9})[,\s/-]+(\d{4})", s)   # 10 Nov, 2026
    if m and m[2][:3].lower() in EN_MONTHS:
        return _safe(int(m[3]), EN_MONTHS[m[2][:3].lower()], int(m[1]))
    m = re.search(r"([A-Za-z]{3,9})\s+(\d{1,2})[,\s]+(\d{4})", s)         # Nov 10, 2026
    if m and m[1][:3].lower() in EN_MONTHS:
        return _safe(int(m[3]), EN_MONTHS[m[1][:3].lower()], int(m[2]))
    m = re.search(r"(\d{1,2})[/-](\d{1,2})[/-](\d{4})", s)                # 10/11/2026 d/m/y
    if m:
        return _safe(int(m[3]), int(m[2]), int(m[1]))
    return None


def _safe(y: int, mo: int, d: int) -> str | None:
    try:
        return date(y, mo, d).isoformat()
    except ValueError:
        return None


def employment_type(value) -> str:
    """schema.org or portal wording -> words engine.js parseType understands."""
    t = text_of(str(value or "")).lower().replace("_", " ").replace("-", " ")
    if "intern" in t:
        return "Internship"
    if "part time" in t:
        return "Part-time"
    if "contract" in t or "temporary" in t:
        return "Contract"
    return "Full-time"


def experience_text(months=None, fallback: str = "") -> str:
    """The engine reads wording like '1 to 3 years' or '6 months'."""
    fb = text_of(fallback)
    if fb and re.search(r"\d", digits(fb)):
        return digits(fb)[:60]
    try:
        n = int(float(months))
    except (TypeError, ValueError):
        return fb[:60]
    if n <= 0:
        return "Freshers can apply"
    if n < 12:
        return f"{n} months"
    years = n // 12
    return f"{years} year" if years == 1 else f"{years} years"


def is_scam(*parts: str) -> bool:
    blob = " ".join(text_of(p) for p in parts if p)
    return any(p.search(blob) for p in SCAM)


def is_government(job: dict) -> bool:
    """A government circular. Its application fee ("টাকা জমা", "processing fee" paid through Teletalk)
    is official, so the money rule does not apply to it."""
    return ("govern" in str(job.get("cat") or "").lower()
            or str(job.get("id") or "").startswith("alljobs:")
            or "/gov-jobs/" in str(job.get("url") or ""))


def asks_for_money(job: dict) -> bool:
    """The money rule for one post: its keywords, title, pay line and (when still held) full text."""
    if is_government(job):
        return False
    return is_scam(job.get("_text", ""), job.get("req", ""), job.get("title", ""), job.get("salary", ""))


def short_req(skills="", description="", qualifications="", limit: int = 300) -> str:
    """Only what the matcher needs: skill keywords plus short requirement signals.

    Never the whole description. jobs.json is public and the site links to the original post.
    """
    bits: list[str] = []
    seen: set[str] = set()

    def add(piece: str) -> None:
        piece = text_of(piece).strip(" .,;।")
        key = piece.lower()
        if piece and key not in seen and len(piece) <= 120:
            seen.add(key)
            bits.append(piece)

    # the short requirement signals first (there are few of them), then the skill words
    blob = " ".join(text_of(x) for x in (qualifications, description))
    for pat in SIGNALS:
        for m in pat.finditer(blob):
            add(m.group(0))

    if isinstance(skills, (list, tuple, set)):
        skills = ", ".join(str(s) for s in skills)
    for s in re.split(r"[,;|/\n]+", text_of(skills)):
        add(s)

    out = ""
    for b in bits:
        candidate = f"{out}, {b}" if out else b
        if len(candidate) > limit:
            break
        out = candidate
    return out


def experience_line(text) -> str:
    """The post's own wording of the experience it asks for ("2 to 4 years of hands-on experience"), or ""."""
    t = text_of(text)
    if not t:
        return ""
    hits = []
    for pat in EXPERIENCE:
        for m in pat.finditer(t):
            years = [float(x) for x in re.findall(r"\d+(?:\.\d+)?", digits(m.group(0)))]
            if years and max(years) <= 15:       # "25 years of experience in the industry" is the company describing itself
                hits.append((m.start(), m.group(0)))
    if not hits:
        return ""
    start = REQUIREMENTS_START.search(t)        # a number in the requirements part is the one that counts
    later = [h for h in hits if start and h[0] >= start.start()]
    return digits(min(later or hits)[1]).strip()[:70]


def requirements_part(text) -> str:
    """A description from its "Requirements" / "Qualifications" heading on, or all of it when there is none.

    The introduction of a company and its list of benefits name many things that are not asked of the candidate.
    """
    t = text_of(text)
    m = REQUIREMENTS_START.search(t)
    return t[m.start():] if m and len(t) - m.start() >= 80 else t


def education_line(text) -> str:
    """The post's own wording of the education it asks for ("Bachelor's degree in CSE"), or ""."""
    t = text_of(text)
    start = REQUIREMENTS_START.search(t) if t else None
    m = (EDUCATION.search(t, start.start()) if start else None) or (EDUCATION.search(t) if t else None)
    return m.group(0).strip(" ,:-")[:80] if m else ""


def keywords_req(skills, req: str = "", limit: int = 300) -> str:
    """`req` with the dictionary's skills added: what the matcher needs, never the description.

    Order: the short requirement signals first ("Freshers can apply", an age limit), because the line is
    cut at `limit` and those must never be the part that falls off; then the skills; then the rest.
    """
    pieces = [p.strip() for p in re.split(r",\s+", req or "") if p.strip()]
    signals = [p for p in pieces if any(s.search(p) for s in SIGNALS)]
    rest = [p for p in pieces if p not in signals]
    parts, seen = [], set()
    for piece in signals + list(skills or []) + rest:
        if piece and piece.lower() not in seen:
            seen.add(piece.lower())
            parts.append(piece)
    out = ""
    for p in parts:
        candidate = f"{out}, {p}" if out else p
        if len(candidate) > limit:
            break
        out = candidate
    return out


def place_text(*parts) -> str:
    """'Tongi' + 'Gazipur' -> 'Tongi, Gazipur' (what the engine's place reader wants)."""
    out, seen = [], set()
    for p in parts:
        p = text_of(p).strip(" ,")
        if p and p.lower() not in seen and p.lower() not in ("bd", "bangladesh"):
            seen.add(p.lower())
            out.append(p)
    return ", ".join(out)


TEXT_FOR_AI = 3500      # characters of a post's own wording the AI step may read


def post(**kw) -> dict:
    """One jobs.json entry, with empty fields left out.

    `text` (the post's description) is kept under the private key `_text` only while
    the run lasts, for the AI step to read. run.py removes every key that starts with
    "_" before jobs.json is written, so descriptions are never stored or published.
    """
    allowed = ("id", "title", "company", "cat", "loc", "type", "salary", "exp", "edu", "age",
               "req", "postedAt", "deadline", "vacancies", "source", "url", "logo", "site")
    out = {}
    for k in allowed:
        v = kw.get(k)
        if v is None or v == "" or v == []:
            continue
        out[k] = v if k == "vacancies" else (v if isinstance(v, (int, float)) else text_of(v))
    text = text_of(kw.get("text"))
    if text:
        out["_text"] = text[:TEXT_FOR_AI]
        # what the keyword step reads: the part that says what the candidate must have, when a reader
        # can point to it (skills_text), else from the first "Requirements" heading on
        out["_kw"] = (text_of(kw.get("skills_text")) or requirements_part(text))[:TEXT_FOR_AI]
    return out


def public(job: dict) -> dict:
    """The post as it may be written to a file: without the private "_..." keys."""
    return {k: v for k, v in job.items() if not k.startswith("_")}
