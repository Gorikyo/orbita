#!/usr/bin/env python3
"""Generate compact browser-ready ephemerides from official SPICE kernels."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import spiceypy as spice


BODIES = {
    "mercury": "MERCURY",
    "venus": "VENUS",
    "earth": "EARTH",
    "mars": "MARS BARYCENTER",
    "jupiter": "JUPITER BARYCENTER",
    "saturn": "SATURN BARYCENTER",
    "uranus": "URANUS BARYCENTER",
    "neptune": "NEPTUNE BARYCENTER",
}


def iso(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def rounded(values, digits: int):
    return [round(float(value), digits) for value in values]


def generate(spacecraft_kernel: Path, target: str, start: str, end: str, common: list[Path]):
    spice.kclear()
    for kernel in common:
        spice.furnsh(str(kernel))
    spice.furnsh(str(spacecraft_kernel))

    start_dt = iso(start)
    end_dt = iso(end)
    dates = []
    current = start_dt
    while current < end_dt:
        dates.append(current)
        current += timedelta(days=1)
    dates.append(end_dt)

    ets = [spice.str2et(date.strftime("%Y-%m-%d %H:%M:%S.%f UTC")) for date in dates]
    states = [spice.spkezr(target, et, "ECLIPJ2000", "NONE", "SUN")[0] for et in ets]
    body_positions = {
        body_id: [rounded(spice.spkpos(name, et, "ECLIPJ2000", "NONE", "SUN")[0], 1) for et in ets]
        for body_id, name in BODIES.items()
    }

    return {
        "source": "SPICE",
        "frame": "ECLIPJ2000",
        "startUtc": start_dt.isoformat().replace("+00:00", "Z"),
        "endUtc": end_dt.isoformat().replace("+00:00", "Z"),
        "times": [round((date - start_dt).total_seconds()) for date in dates],
        "positions": [rounded(state[:3], 1) for state in states],
        "velocities": [rounded(state[3:], 6) for state in states],
        "bodies": body_positions,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--kernels", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)

    common = [args.kernels / "naif0012.tls", args.kernels / "de432s.bsp"]
    missions = {
        "voyager2": generate(
            args.kernels / "voyager2.bsp",
            "-32",
            "1977-08-20T15:33:00Z",
            "1989-08-25T03:56:00Z",
            common,
        ),
        "juice": generate(
            args.kernels / "juice.bsp",
            "-28",
            "2023-04-14T12:44:00Z",
            "2031-07-21T06:27:00Z",
            common,
        ),
    }

    for name, data in missions.items():
        target = args.output / f"{name}.json"
        target.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
        print(f"{target}: {len(data['times'])} daily samples")


if __name__ == "__main__":
    main()
