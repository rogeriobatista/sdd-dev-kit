# Adapter Terraform scaffold

Scaffolded by `@sdd-dev-kit/adapter-terraform`.

- Requires Terraform CLI (no cloud credentials for default verify)
- Edit only `specs/` (+ `.sdd/premises.md`)
- Generated: `tests/*.tftest.hcl`, `.sdd/canonical`, `.sdd/plan`
- Verify: `terraform fmt -check`, `terraform validate`, `terraform test`
