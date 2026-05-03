# Implementation Plan: X12 Builder

**Date:** 2026-05-03  
**Status:** BACKLOG

## Goal

`build` Command für X12 implementieren: Business Object / EDIMessage → X12 EDI String.

## Problem

`builders.set('X12', ...)` fehlt im DIContainer — kein X12 Builder existiert im `@ediflow/x12` Paket.

## Affected Areas

- `packages/x12/src/infrastructure/builders/` — NEU: `X12MessageBuilder.ts`
- `packages/cli/src/infrastructure/container/DIContainer.ts` — X12 Builder registrieren

## Definition of Done

- [ ] `X12MessageBuilder` implementiert `IMessageBuilder`
- [ ] `build x12/build/input/purchase-order-850.json` → gültiger X12 String
- [ ] Roundtrip: parse → build → parse → gleiche Segmente
- [ ] Tests grün
