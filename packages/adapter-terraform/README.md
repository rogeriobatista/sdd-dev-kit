# @sdd-dev-kit/adapter-terraform

Stack adapter for **Terraform**. Default verify uses local **`terraform fmt`**, **`terraform validate`**, and native **`terraform test`** (`.tftest.hcl`). **No cloud apply** and no cloud credentials required.

## Role

| Phase | Behavior |
|-------|----------|
| Init | Module layout + null/local provider example, `sdd.yaml` with `adapter: terraform` |
| Executable | Canonical NL → `.tftest.hcl` stubs with commented GWT assertions |
| Verify | `terraform fmt -check` + `validate` + `test` |

## Verify

```yaml
adapter: terraform
runners:
  fmt: terraform fmt -check -recursive
  validate: terraform init -backend=false && terraform validate
  terraform: terraform test
  all: npm run sdd:verify:all
```

Requires the Terraform CLI locally. Never put cloud secrets in the repo.
