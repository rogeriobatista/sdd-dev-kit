# @rogeriobatista/adapter-python

Stack adapter for **Python + pytest**.

## Role

| Phase | Behavior |
|-------|----------|
| Init / scaffold | `pyproject.toml` (or `requirements.txt`), `tests/`, `src/`, `sdd.yaml` with `adapter: python` |
| Executable | Canonical NL → pytest stubs under `tests/` (and optional `tests/features` notes) |
| Verify | `pytest` via `runners.pytest` / `runners.all` |

## Verify

```yaml
adapter: python
runners:
  pytest: pytest -q
  all: pytest -q
```

```bash
pip install -e ".[dev]"   # or: pip install -r requirements.txt
pytest -q --junitxml=reports/junit.xml
```

## Evidence for `/sdd demo`

| Artifact | Typical path |
|----------|----------------|
| JUnit XML | `reports/junit.xml` |
| HTML (optional) | `reports/report.html` (`pytest --html=…`) |

Wire runners accordingly:

```yaml
runners:
  pytest: pytest -q --junitxml=reports/junit.xml
  all: pytest -q --junitxml=reports/junit.xml
```

Then: `/sdd demo` → `.sdd/demo/<runId>/`.

## Canonical → test mapping

| Spec tag | Materialized artifact |
|----------|----------------------|
| `@api` / untagged | `tests/test_<slug>.py` with step comments as assert stubs |
| `@ui` / `@e2e` | Same pytest module with a `@pytest.mark.ui` skip-or-stub (no browser runner in this adapter) |

Portuguese GWT steps become comments + `pytest.fail("not implemented")` until implement.

## Templates

See `templates/` — copied into the target project by `scaffoldProject`.
