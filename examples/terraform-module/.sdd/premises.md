# Premises

## Stack
- adapter: terraform
- Terraform >= 1.6
- null provider only (no cloud apply in verify)

## Verify
- `terraform fmt -check`
- `terraform validate` (after `init -backend=false`)
- `terraform test`
