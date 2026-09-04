# Greenhouse — stable field map

Starting guess only. The live form's fields win; a selector absent this run is
dropped from the plan. Custom questions are per-posting and never cached across
companies.

| selector                             | label           | source                                                   |
| ------------------------------------ | --------------- | -------------------------------------------------------- |
| `#first_name`                        | First name      | `data/basics.yaml`                                       |
| `#last_name`                         | Last name       | `data/basics.yaml`                                       |
| `#email`                             | Email           | `data/basics.yaml`                                       |
| `#phone`                             | Phone           | `data/basics.yaml`                                       |
| `#resume` (file)                     | Resume          | plan `cv`                                                |
| `input[id^=job_application_answers]` | custom question | resolve per `job-apply/references/contract-screening.md` |
| `#submit_app`                        | Submit          | recorded as `submit_selector`, never clicked             |
