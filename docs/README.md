# Job Kit documentation

Start with the product, then read domain decisions before implementation mechanisms.

1. [Product overview](product/overview.md): audience, accepted constraints, and intended experience.
2. [Domain model](domain/README.md): information ownership and the six modules; the [submission journey](domain/journeys/application-submission.md) is a post-V1 proposal.
3. [Architecture](architecture/overview.md): accepted web-only, self-hosted direction, persistence, execution, identity/data, and repository layout. The platform is not implemented.
4. [Delivery roadmap](delivery/roadmap.md): the five-step V1 journey, scoped implementation briefs, and later delivery.
5. [Linear backlog index](delivery/linear-backlog.md): milestone and issue identifiers, dependencies, and the published V1 specification.

Use the [decision index](decisions/README.md) for choice status and rationale, the [research index](research/README.md) for dated evidence and alternatives, and the [Event Delivery Engine reference](references/event-delivery-engine.md) for the external specification whose adoption remains undecided.

## Document ownership

Product owns intended behavior and constraints. Domain modules own business invariants and acceptance scenarios. Journeys show coordination and link to those owners. Architecture owns shared mechanisms and the target repository layout. Delivery owns sequencing. Decisions record consequential choices. Research retains dated findings, alternatives, and validation limits; it does not override current design.

Step briefs own delivery scope, dependencies, acceptance criteria, and questions for later scoped work. They link to domain rules and architecture decisions rather than redefining them. Domain and architecture documents describe the broader target design; the roadmap identifies which capabilities belong in V1.

## Status conventions

Design and decision documents distinguish `proposed`, `accepted`, and `superseded`, record an update date, and separately state implementation as `not implemented`, `partial`, or `implemented`. An accepted direction is not proof of working code. Research records its research date and validation limits instead. Illustrative command/event names remain distinguishable from implemented contracts.

Keep open questions in their owning documents and link delivery blockers from the roadmap. Keep one authoritative statement of each rule and link to it from summaries. Preserve supersession history without maintaining competing current designs.
