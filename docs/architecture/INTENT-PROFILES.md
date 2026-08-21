# Custom MCP Intent Profiles & Capability Router

> Specification for tool routing and capability scoping per agent phase.

## Profile Matrix

| Profile    | Tools Scoped                                                                                                                                                                               | Primary Consumers                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| `author`   | `health_check`, `compile_requirement`, `compile_test_plan`, `validate_plan`, `validate_requirement`, `validate_generated_tests`, `discover_pages`, `snapshot_page`, `generate_page_object` | Planner, Generator                   |
| `debug`    | `health_check`, `get_test_failures`, `get_test_summary`, `trace_requirement`, `validate_generated_tests`, `inspect_file`, `extract_pdf_text`, `read_excel_summary`, `archive_report`       | Healer, Reporter                     |
| `artifact` | `health_check`, `inspect_file`, `extract_pdf_text`, `read_excel_summary`                                                                                                                   | Reporter, File Assertions            |
| `minimal`  | `health_check`, `discover_pages`                                                                                                                                                           | Pre-crawl discovery, Fast inspection |
| `all`      | All registered custom QA tools                                                                                                                                                             | Orchestrator, Master Pipeline        |
