# End-User License Agreement (EULA)

**TIA Openness API (for Siemens TIA Portal V21)**

> **Status: DRAFT / STUB.** This is a starting-point license agreement, not yet reviewed by a
> lawyer. The bracketed `[…]` items (licensor legal entity, governing law, contact) must be filled
> in before this is relied upon commercially. It does not constitute legal advice.

Copyright © 2026 Renan Oliveira. All rights reserved.

This End-User License Agreement ("Agreement") is a legal agreement between you (an individual or a
single legal entity, "You") and the copyright holder ("Licensor") for the TIA Openness API software,
including the application, HTTP/JSON API, command-line tools, installer, and accompanying
documentation (collectively, the "Software"). By downloading, installing, activating, or using the
Software, You agree to be bound by this Agreement. If You do not agree, do not install or use the
Software.

## 1. Definitions

- **"Software"** — the proprietary TIA Openness API application and tools distributed by the Licensor.
- **"Activation License"** — a cryptographically signed token, issued by the Licensor, that enables
  use of the Software. It may be time-limited, scope-limited, and seat-limited.
- **"Seat"** — one named user or one machine, as specified in Your Activation License.

## 2. License grant

Subject to Your compliance with this Agreement and to a **valid Activation License**, the Licensor
grants You a limited, non-exclusive, non-transferable, revocable license to install and use the
Software for its intended purpose, within the seat count, scope, and term of Your Activation License.

The **download is free**; **use requires a valid Activation License.** Without one, the Software
will refuse to operate (all API endpoints except `GET /health` return `license_required`).

## 3. Trial

The Licensor may issue time-limited **trial** Activation Licenses for evaluation. Trial use is
subject to this Agreement and ends automatically when the trial term expires.

## 4. Restrictions

Except as expressly permitted in writing by the Licensor, You may **not**:

(a) copy, redistribute, sublicense, sell, rent, lease, host as a service, or otherwise transfer the
Software or any part of it;
(b) modify, adapt, translate, or create derivative works of the Software;
(c) reverse-engineer, decompile, disassemble, or attempt to derive source code, or remove, disable,
or circumvent the activation/licensing gate, anti-tamper protection, or any technical protection
measure;
(d) share, resell, or sublicense an Activation License, or use it beyond its seat count, scope, or
term;
(e) remove or alter any copyright, trademark, or proprietary notices.

## 5. Ownership

The Software is licensed, not sold. The Licensor retains all right, title, and interest in and to the
Software, including all intellectual property rights. All rights not expressly granted are reserved.

## 6. Third-party components

The Software depends on **Siemens TIA Portal V21** and the **Siemens.Engineering Openness**
assemblies, which are **not** distributed with the Software and are governed by Siemens' own license
terms. You are responsible for obtaining and licensing TIA Portal (and the STEP 7 Professional
license that enables Openness) separately. Other third-party libraries retain their respective
licenses.

*TIA Portal, TIA, SIMATIC, STEP 7, and Siemens are trademarks of Siemens AG. The Software is an
independent product and is not affiliated with, sponsored by, or endorsed by Siemens.*

## 7. Fees and term

Fees, seat counts, scope (tier), and term are set out in Your purchase or Activation License. The
license is effective until it expires or is terminated. The Licensor may revoke an Activation License
for breach of this Agreement.

## 8. Termination

This Agreement terminates automatically if You breach it. On termination You must stop using and
remove the Software. Sections 4–11 survive termination.

## 9. No warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
NONINFRINGEMENT.

## 10. Limitation of liability

IN NO EVENT SHALL THE LICENSOR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR EQUIPMENT, ARISING FROM OR RELATED TO THE
SOFTWARE OR THIS AGREEMENT, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

## 11. Safety notice

⚠️ The Software can drive industrial automation hardware (PLCs) via TIA Portal. Any operation that
writes to a controller, the network, or a safety program is **gated and requires explicit human
approval.** **You are solely responsible for the safe operation of any equipment.** Do not use the
Software to commission hardware autonomously. Always verify a clean compile and follow your site's
commissioning and safety procedures before downloading to a controller.

## 12. Governing law and contact

This Agreement is governed by the laws of `[jurisdiction — to be specified]`. For licensing inquiries
or support, contact the Licensor via the project's
[issue tracker](https://github.com/renanlido/tia-openness/issues) or `[support contact — to be specified]`.
