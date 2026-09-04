# Ashby — stable field map

Starting guess only. The live form's fields win; a selector absent this run is
dropped from the plan. Custom questions are per-posting and never cached across
companies.

| selector                      | label           | source                                                             |
| ----------------------------- | --------------- | ------------------------------------------------------------------ |
| `#_systemfield_name`          | Full name       | `data/basics.yaml`                                                 |
| `#_systemfield_email`         | Email           | `data/basics.yaml`                                                 |
| `#_systemfield_phone`         | Phone           | `data/basics.yaml`                                                 |
| `#_systemfield_resume` (file) | Resume          | plan `cv`                                                          |
| `[id^="_field_"]`             | custom question | resolve per `job-apply/references/contracts/contract-screening.md` |
| `button[type=submit]`         | Submit          | recorded as `submit_selector`, never clicked                       |
