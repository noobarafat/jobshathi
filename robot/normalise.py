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

# Short phrases worth keeping in `req` because the engine looks for them.
SIGNALS = [
    re.compile(r"freshers?[^.]{0,40}(are\s+)?(also\s+)?(encouraged|welcome|can apply|may apply)", re.I),
    re.compile(r"no experience (is )?(needed|required)", re.I),
    re.compile(r"ফ্রেশার[^।.]{0,30}", re.I),
    re.compile(r"(age|বয়স)[^.।]{0,40}?\d{2}[^.।]{0,25}", re.I),
    re.compile(r"(only|শুধুমাত্র|শুধু)\s*(females?|males?|নারী|পুরুষ)[^.।]{0,20}", re.I),
    re.compile(r"(females?|males?|নারী|পুরুষ)\s*(candidates?\s*)?only", re.I),
    re.compile(r"(driving|driver'?s?|valid)\s+licen[cs]e[^.।]{0,20}", re.I),
    re.compile(r"ড্রাইভিং লাইসেন্স", re.I),
]

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

    if isinstance(skills, (list, tuple, set)):
        skills = ", ".join(str(s) for s in skills)
    for s in re.split(r"[,;|/\n]+", text_of(skills)):
        add(s)

    blob = " ".join(text_of(x) for x in (qualifications, description))
    for pat in SIGNALS:
        for m in pat.finditer(blob):
            add(m.group(0))

    out = ""
    for b in bits:
        candidate = f"{out}, {b}" if out else b
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


def post(**kw) -> dict:
    """One jobs.json entry, with empty fields left out."""
    allowed = ("id", "title", "company", "cat", "loc", "type", "salary", "exp", "edu", "age",
               "req", "postedAt", "deadline", "vacancies", "source", "url", "logo", "site")
    out = {}
    for k in allowed:
        v = kw.get(k)
        if v is None or v == "" or v == []:
            continue
        out[k] = v if k == "vacancies" else (v if isinstance(v, (int, float)) else text_of(v))
    return out
