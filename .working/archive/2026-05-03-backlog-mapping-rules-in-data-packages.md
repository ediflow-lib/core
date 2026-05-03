# Implementation Plan: Mapping Rules in Data Packages

**Date:** 2026-05-03  
**Status:** BACKLOG — Next Sprint

## Goal

Ergänze `mapping` Rules in den Data Package JSON-Dateien so dass
`StructureMappingService.map()` echte Business Objects liefert.

## Problem

`ORDERS.json`, `850.json` etc. haben nur Segment-Struktur ohne `mapping` Felder.
Der `StructureMappingService` gibt `{}` zurück weil kein Knoten ein `mapping` hat.

## Was sind Mapping Rules?

```json
// ORDERS.json — BGM Segment mit mapping:
{
  "nodeType": "segment",
  "segmentRef": "BGM",
  "tag": "BGM",
  "mapping": {
    "targetField": "documentNumber",
    "elementIndex": 1,
    "typeConversion": "string"
  }
}
```

## Vorgehensweise

1. Für ORDERS (EDIFACT): Top-10 Felder mappen: documentNumber, orderDate, buyer, supplier, lineItems
2. Für 850 (X12): documentNumber, orderDate, buyer, supplier, lineItems
3. `StructureMappingService` Tests mit echten Feldern
4. CLI parse Output enthält dann `data.documentNumber` etc.

## Pilotmessage-Felder für ORDERS

| Business Field | Segment | Element | Component |
|---|---|---|---|
| `documentNumber` | BGM | 1 | — |
| `documentType` | BGM | 0 | — |
| `orderDate` | DTM (qualifier=137) | 1 | 1 |
| `buyer.id` | NAD (qualifier=BY) | 1 | 0 |
| `buyer.name` | NAD (qualifier=BY) | 3 | — |
| `supplier.id` | NAD (qualifier=SU) | 1 | 0 |
| `supplier.name` | NAD (qualifier=SU) | 3 | — |
| `currency` | CUX | 0 | 1 |

## Definition of Done

- [ ] ORDERS.json (D.96A) hat mapping rules für die 8 Kernfelder
- [ ] `parse orders.edi` → `data.documentNumber = "PO-2026-001"`
- [ ] `parse orders.edi` → `data.buyer.id = "BUYER123"`
- [ ] 850.json (004010) hat mapping rules für Kernfelder
- [ ] Integration Tests: `expect(order.documentNumber).toBe('PO-2026-001')`
- [ ] QUICK_START.md Beispiele funktionieren mit echten Werten
