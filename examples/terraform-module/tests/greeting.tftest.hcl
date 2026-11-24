run "default_greeting" {
  command = plan

  assert {
    condition     = var.greeting == "hello"
    error_message = "default greeting should be hello"
  }
}

run "custom_greeting" {
  command = plan

  variables {
    greeting = "ola"
  }

  assert {
    condition     = var.greeting == "ola"
    error_message = "greeting should accept custom value"
  }
}
