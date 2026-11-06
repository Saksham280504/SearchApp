# HRMS Non-Target Screening Methodology

## Overview
High-Resolution Mass Spectrometry (HRMS) is used in this dashboard to detect "non-target" compounds in water samples. This means we are scanning for any chemical present, rather than looking for a specific predefined list of chemicals.

## Key Metrics
- **m/z (Mass-to-Charge Ratio)**: The mass of the ionized molecule divided by its charge. Used to determine the exact molecular weight (MW) of the compound.
- **Retention Time (RT)**: The time it takes for a compound to pass through the chromatography column. Measured in minutes. Used to distinguish isomers.
- **Area (Max Area)**: The area under the curve of the chromatogram peak. This represents the *relative abundance* of the compound. **Note:** Area is NOT an exact concentration (like µg/L), it only shows how much of the compound is present relative to other samples.

## Confidence Levels (Schymanski scale)
- **Level 1 (Confirmed)**: Identified using an analytical reference standard. Exact mass, RT, and MS2 spectra match.
- **Level 2 (Probable)**: Tentatively identified by matching m/z, isotopic pattern, and MS2 spectra to a library, but lacks a reference standard.
- **Level 3 (Tentative)**: Only exact mass (m/z) and isotopic pattern match a formula, but structure is uncertain.
- **Level 4 (Unequivocal Molecular Formula)**: We know the chemical formula (e.g. C8H10N4O2) based on mass, but not the structure.
- **Level 5 (Exact Mass of Interest)**: We only know the exact mass.
