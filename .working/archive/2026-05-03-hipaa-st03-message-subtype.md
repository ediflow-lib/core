# Implementation Plan: HIPAA ST03 Message Subtype Detection
**Date:** 2026-05-03
**Status:** DONE

## Goal
HIPAA 005010 messages use ST03 (Implementation Convention Reference) to identify
the specific message subtype (e.g. `005010X222A1` = 837P Professional).
The X12MessageParser must extract ST03 and the FileBasedMessageStructureRepository
must use it to find the correct message JSON (e.g. `837-Q1.json`).

## ST03 → MessageType Mapping (HIPAA 005010)
| ST03               | File        | Description                  |
|--------------------|-------------|------------------------------|
| 005010X222A1       | 837-Q1.json | Professional Claims (837P)   |
| 005010X223A2       | 837-Q2.json | Dental Claims (837D)         |
| 005010X223A3       | 837-Q3.json | Institutional Claims (837I)  |
| 005010X279A1       | 270-B1.json | Eligibility Inquiry          |
| 005010X279A1       | 271-B1.json | Eligibility Response         |
| 005010X212         | 276-A1.json | Claim Status Request         |
| 005010X214         | 277-A1.json | Status Notification          |
| 005010X214B3       | 277-B3.json | Claim Acknowledgment         |
| 005010X217         | 278-A1.json | Auth Request                 |
| 005010X217A3       | 278-A3.json | Auth Response                |
| 005010X218         | 820-A1.json | Premium Payment              |
| 005010X220A1       | 834-A1.json | Benefit Enrollment           |
| 005010X221A1       | 835-W1.json | Claim Payment/Advice         |
| 005010X231A1       | 999-A1.json | Implementation Acknowledgment|

## Affected Areas
- [ ] `packages/hipaa-x12-005010/data/messages/*.json` — add `"st03"` field
- [ ] `packages/infrastructure-shared/src/repositories/models/DataPackageModels.ts` — add optional `st03` to schema
- [ ] `packages/infrastructure-shared/src/repositories/FileBasedMessageStructureRepository.ts` — ST03-based lookup
- [ ] `packages/x12/src/infrastructure/parsers/X12MessageParser.ts` — extract ST03, set as messageType qualifier
- [ ] `examples/cli/hipaa/parse/input/claim-837.edi` — add ST03 to ST segment
- [ ] Result files regenerate

## Implementation Steps
1. Add `st03` field to all HIPAA message JSON files
2. Update DataPackageModels schema (optional st03)
3. Update FileBasedMessageStructureRepository: index by st03, lookup by message.st03
4. Update X12MessageParser: read ST03, store on EDIMessage or return as messageType suffix
5. Fix example EDI file
6. Regenerate result files
7. Tests

