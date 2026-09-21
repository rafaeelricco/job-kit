# Decision index

A decision record captures a selected or proposed choice with context, alternatives, consequences, and links to its design and evidence. Accepted means a direction is selected; implementation status is separate. Superseded records remain as historical evidence and link to the decision that replaced them.

| Decision                                                               | Status     | Implementation  |
| ---------------------------------------------------------------------- | ---------- | --------------- |
| [Personal companion execution](0001-personal-companion.md)             | superseded | not implemented |
| [Selective event sourcing](0002-selective-event-sourcing.md)           | accepted   | not implemented |
| [Workflow owner](0003-workflow-owner.md)                               | superseded | not implemented |
| [Workspace-scoped posting identity](0004-posting-identity.md)          | proposed   | not implemented |
| [Package authorization](0005-package-authorization.md)                 | proposed   | not implemented |
| [Self-hosted discovery browser](0006-self-hosted-discovery-browser.md) | accepted   | not implemented |
| [Web-only product platform](0007-web-only-platform.md)                 | accepted   | not implemented |
| [Self-hosted platform](0008-self-hosted-platform.md)                   | accepted   | not implemented |

New records use stable numbered filenames. When a decision is replaced, mark the earlier record superseded and link both records. Research dates belong with evidence; changes to a decision belong here. Local domain questions remain with their owning modules. The Event Delivery Engine remains a researched but undecided external option, not an accepted dependency. Current selected work delivery uses `pg-boss` backed by application-owned durable intent and idempotency.
