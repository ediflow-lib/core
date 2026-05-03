# Implementation Plan: Export Schema - Full JSON Schema Properties

**Date:** 2026-05-03  
**Status:** BACKLOG

## Goal

`export-schema` generiert vollständige JSON Schemas mit echten Feldern/Properties
basierend auf den Mapping-Rules in den Data Packages (statt leere `properties: {}`).

## Problem

`SchemaGenerationService` erstellt aktuell nur die Schema-Hülle:
```json
{ "$schema": "...", "title": "Purchase order", "type": "object", "properties": {} }
```

Die `MessageStructureDTO` enthält `mapping` Rules pro Segment/Feld.
Diese müssen in JSON Schema Properties übersetzt werden.

## Affected Areas

- `packages/core/src/application/services/SchemaGenerationService.ts` — Properties aus MappingRules generieren

## Definition of Done

- [ ] `export-schema -m ORDERS -s EDIFACT -v D.20B` → `properties.documentNumber`, `properties.orderDate` etc.
- [ ] `export-schema -m 850 -s X12 -v 004010` → `properties` mit X12-Feldern
- [ ] Alle Schema-Tests grün

