# terraform-module

Tiny SDD example for **Terraform** using the null provider and native `terraform test`.

```bash
# Requires Terraform CLI locally — no cloud credentials
npm run smoke -w terraform-module
```

`adapter: terraform` in `sdd.yaml`. Default verify never runs `terraform apply`.
