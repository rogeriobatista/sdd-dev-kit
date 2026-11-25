# Premises

## Stack
- adapter: python
- Python 3.11+
- pytest

## Tags
- `@api` / untagged → pytest (Spec Tests)

## Camadas de teste
- Spec / domain: `tests/` (pytest)
- Prefer also: `tests/unit`, `tests/integration` when splitting layers; e2e when UI applies
