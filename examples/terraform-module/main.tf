terraform {
  required_version = ">= 1.6.0"
  required_providers {
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}

variable "greeting" {
  type    = string
  default = "hello"
}

resource "null_resource" "marker" {
  triggers = {
    greeting = var.greeting
  }
}

output "greeting" {
  value = var.greeting
}
