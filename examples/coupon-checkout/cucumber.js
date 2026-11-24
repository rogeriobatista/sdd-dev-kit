export default {
  paths: ["tests/features/**/*.feature"],
  import: ["tests/steps/**/*.ts"],
  format: ["progress", "json:reports/cucumber.json"],
};
