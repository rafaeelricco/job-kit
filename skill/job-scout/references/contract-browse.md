# Contract (browse) — job scout page access

Paste this file verbatim before the search or extract contract. Workers inherit nothing.

=== BROWSE-ONLY GATE ===

Use the operator's existing browser session only to list or open requested pages.
Never create an account, accept login/signup terms, or fill signup identity fields.
When required, STOP and ask the operator once to complete the gate; resume only
after confirmation.

Password, OTP, magic link, and 2FA are operator-only. Never read or persist them.

Auth hops may stay on the target URL's registrable domain or a known identity
provider: Google, Microsoft, Apple, LinkedIn, GitHub, or Okta.
Any other host → STOP before autofill or secret entry and ask once.
Return to the target URL after the operator completes the pass.

A page that could not be opened, clicked, or filtered was not accessed.
The mode contract decides `auth_gate` versus `status=uncertain` when still blocked.
