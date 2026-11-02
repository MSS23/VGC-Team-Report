# [A11y] Light-mode --success (3.13:1) and --warning (3.03:1) fail AA for body text

- **Priority:** High
- **Labels:** auto-research, Accessibility
- **Target state:** Backlog
- **Status:** NOT FILED — Linear workspace is at its free-plan active-issue limit

## Source

`.swarm/r8-accessibility-02-11-26.md`, blocking AA failures.

## Finding

In **light** mode the semantic status tokens measure, against their own background:

* `--success` — **3.13:1**
* `--warning` — **3.03:1**

AA requires **4.5:1** for normal-size text. Both clear only the 3:1 large-text bar, and they are used for status messages at body size.

## Note on what is already fixed

The **dark**-mode variants of `--danger`, `--success` and `--warning` were **already corrected** in commit `72bb956` — this run verified that fix held. This ticket is the **light**-mode half, which that commit did not cover.

## Fix

Darken both tokens until they clear 4.5:1 against the light surface. Keep them recognisably green and amber; the audit report records the measured ratios so a replacement value can be checked arithmetically before it ships.
