#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
import_session.py -- Workout Tracker JSON export  ->  Body Composition Tracker.xlsx

    python workout/tools/import_session.py "path/to/workout-export-YYYY-MM-DD.json" --dry-run
    python workout/tools/import_session.py "path/to/workout-export-YYYY-MM-DD.json"

Takes the JSON the tracker's Export screen produces and appends every set of every
app-logged session to the `Workout Log` sheet, then updates the `Lift Progress`
blocks that exist for those lifts.

--------------------------------------------------------------------------
Two things this has to translate
--------------------------------------------------------------------------
1. VOCABULARY.  The tracker uses the new routine's names ("Back Squat"); the
   spreadsheet has years of history under the old Kalos names ("Barbell Back
   Squat"), and the Lift Progress MAXIFS formulas match those old names as exact
   strings.  ALIASES below is the inverse of tools/make_seed.py's map: the
   spreadsheet keeps its vocabulary, the tracker keeps its own, and this script
   translates between them.  A lift with no historical equivalent (hip thrust,
   face pull, rear-delt fly) is written under its tracker name and reported.

2. EFFORT.  The tracker records RIR (reps in reserve); the sheet's column F wants
   RPE.  RPE = 10 - RIR, which is the standard conversion.

Idempotent: a session whose date already has rows in the Workout Log is skipped,
so re-running on the same export does nothing.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("Need openpyxl.  Run:  pip install openpyxl", file=sys.stderr)
    sys.exit(1)

HERE = Path(__file__).resolve().parent
WORKBOOK = HERE.parent.parent / "Body Composition Tracker.xlsx"

# tracker canonical name -> Workout Log / Lift Progress vocabulary
ALIASES = {
    "Back Squat": "Barbell Back Squat",
    "Standing Barbell OHP": "Barbell Overhead Press",
    "Incline Barbell Bench Press": "Barbell Incline Bench Press",
    "DB Incline Bench Press": "Dumbbell Incline Bench Press",
    "Close-Grip Lat Pulldown": "Close Grip Lat Pulldown",
    "DB Incline Curl": "Dumbbell Incline Bicep Curl",
    "Bulgarian Split Squat (lever)": "Lever Squat Machine — BSS",
    "Chest-Supported DB Row": "Dumbbell Incline Row",
    "DB Lateral Raise": "Dumbbell Lateral Raise",
    "Face Pull": "Cable Face Pull",
    "One-Arm DB Row": "Dumbbell Single Arm Row",
    "DB Shrug": "Dumbbell Shrug",
    "EZ-Bar Curl": "Barbell Bicep Curl",
    "Hammer Curl": "Alternating Dumbbell Hammer Curl",
    "Cable Tricep Pushdown": "Cable Straight Bar Tricep Pushdown",
    "Rope Overhead Tricep Extension": "Cable Rope Standing Overhead Tricep Extension",
    "Overhead Tricep Extension": "Dumbbell Tricep Extension",
    "Assisted Pull-up": "Machine Assisted Pull Up",
    "Assisted Chin-up": "Machine Assisted Chin Up",
    # identity (listed so the mapping is auditable rather than implicit)
    "Barbell Deadlift": "Barbell Deadlift",
    "Barbell Bench Press": "Barbell Bench Press",
    "Leg Press": "Leg Press",
}

PR_WORDS = {"weight": "Weight PR", "reps": "Rep PR", "e1rm": "e1RM PR", "assist": "Assist PR"}


def sheet_name(tracker_name: str) -> tuple[str, bool]:
    """(name to write, whether it was translated)."""
    if tracker_name in ALIASES:
        return ALIASES[tracker_name], ALIASES[tracker_name] != tracker_name
    return tracker_name, False


def e1rm(w, r):
    if not w or not r:
        return None
    return round(w * (1 + r / 30), 1)


def iso_to_mdy(d: str) -> str:
    y, m, dd = d.split("-")
    return "%d/%d/%s" % (int(m), int(dd), y)


def build_note(st, ex_name, superset_partner, lead):
    bits = []
    if lead:
        bits.append(lead)
    if st.get("warmup"):
        bits.append("Warmup")
    else:
        est = e1rm(st.get("weight"), st.get("reps"))
        if superset_partner:
            bits.append("SUPERSET w/ %s" % superset_partner)
        bits.append("Working" + ("; e1RM %s" % est if est else ""))
        flags = st.get("prFlags") or []
        if flags:
            bits.append("(" + " + ".join(PR_WORDS.get(f, f) for f in flags) + ")")
        if st.get("rir") is not None:
            bits.append("RIR %s" % st["rir"])
    bits.append("via Workout Tracker")
    return "; ".join(bits)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("export", help="workout-export-*.json")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--workbook", default=str(WORKBOOK))
    args = ap.parse_args()

    payload = json.loads(Path(args.export).read_text(encoding="utf-8"))
    sessions = [s for s in payload.get("sessions", []) if s.get("source") == "app"]
    if not sessions:
        print("No app-logged sessions in this export (only the seeded history). Nothing to do.")
        return

    wb = openpyxl.load_workbook(args.workbook, data_only=False)
    wl = wb["Workout Log"]

    existing_dates = {str(wl.cell(r, 1).value).strip() for r in range(4, wl.max_row + 1) if wl.cell(r, 1).value}
    row = wl.max_row + 1
    while wl.cell(row - 1, 1).value is None and row > 4:
        row -= 1

    # exercise names the Lift Progress sheet actually tracks
    lp = wb["Lift Progress"]
    import re
    tracked = set()
    for r in range(1, lp.max_row + 1):
        v = lp.cell(r, 2).value
        if isinstance(v, str) and "MAXIFS" in v:
            # MAXIFS(sum_range, criteria_range, "criteria", ...) -- ranges never
            # contain commas, so the third argument is the exercise name. The sheet
            # mixes 'Workout Log'!B:B and 'Workout Log'!B$4:B$1503 forms, so match
            # on argument position rather than on the range's shape.
            m = re.search(r'MAXIFS\([^,]+,[^,]+,"([^"]+)"', v)
            if m:
                tracked.add(m.group(1))

    added = 0
    translated, untracked = set(), set()
    for s in sessions:
        mdy = iso_to_mdy(s["date"])
        if mdy in existing_dates:
            print("SKIP %s (%s already has rows in the Workout Log)" % (s["id"], mdy))
            continue

        dur = ""
        if s.get("startTime") and s.get("endTime"):
            from datetime import datetime
            a = datetime.fromisoformat(s["startTime"].replace("Z", "+00:00"))
            b = datetime.fromisoformat(s["endTime"].replace("Z", "+00:00"))
            dur = "%d min" % round((b - a).total_seconds() / 60)

        print("\nIMPORT %s  (%s, Day %s, %s)" % (s["id"], mdy, s.get("day"), dur))
        # superset partners, by slot adjacency in the routine
        names = [ex["name"] for ex in s.get("exercises", [])]
        first = True
        for ex in s.get("exercises", []):
            name, was_tr = sheet_name(ex["name"])
            if was_tr:
                translated.add("%s -> %s" % (ex["name"], name))
            if name not in tracked:
                untracked.add(name)
            partner = None
            print("   %-46s %s" % (name, "" if name in tracked else "(no Lift Progress block)"))
            for st in ex.get("sets", []):
                lead = ("FB %s — logged in Workout Tracker%s" % (s.get("day"), (", " + dur) if dur else "")) if first else None
                first = False
                if not args.dry_run:
                    wl.cell(row, 1).value = mdy
                    wl.cell(row, 2).value = name
                    wl.cell(row, 3).value = st.get("setNum")
                    wl.cell(row, 4).value = st.get("weight")
                    wl.cell(row, 5).value = st.get("reps")
                    wl.cell(row, 6).value = (10 - st["rir"]) if st.get("rir") is not None else None
                    wl.cell(row, 7).value = '=IF(OR(D%d="",E%d=""),"",D%d*(1+E%d/30))' % (row, row, row, row)
                    wl.cell(row, 8).value = '=IF(OR(D%d="",E%d=""),"",D%d*E%d)' % (row, row, row, row)
                    wl.cell(row, 9).value = build_note(st, name, partner, lead)
                row += 1
                added += 1

    print("\n%d set rows %s" % (added, "would be added (dry run)" if args.dry_run else "added"))
    if translated:
        print("\nname translations applied (tracker -> spreadsheet):")
        for t in sorted(translated):
            print("   " + t)
    if untracked:
        print("\nno Lift Progress block tracks these (Workout Log row is still written):")
        for u in sorted(untracked):
            print("   " + u)
        print("   -> adding a block is a judgement call; left for Bobby to decide.")

    if not args.dry_run and added:
        wb.save(args.workbook)
        print("\nsaved %s" % args.workbook)


if __name__ == "__main__":
    main()
