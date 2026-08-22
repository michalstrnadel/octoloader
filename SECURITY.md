# Security

## Reporting

Report a vulnerability through
[a private security advisory](https://github.com/michalstrnadel/octoloader/security/advisories/new).
Please do not open a public issue for one.

Expect an acknowledgement within a week. If the report holds, you will get a
fix and a released version, and credit in the advisory unless you would rather
not have it.

## What is in scope

The published package is a few SVG paths and a stylesheet. It has no runtime
dependencies, makes no network calls, reads no storage and evaluates nothing.
That leaves a narrow surface, but these are real and worth reporting:

- **Injection through a prop.** `label` and `announce` reach the DOM. React
  escapes what it renders and the custom element sets `textContent`, never
  `innerHTML` — a way around either is a bug.
- **CSS escaping the component.** The stylesheet is global by design (SVG
  styles always are), and every rule is namespaced `octo-`. A selector that
  reaches beyond that is a bug.
- **Supply chain.** Anything about how the package is built or published:
  the release workflow, its permissions, the provenance attestation.

## What is not

- The animation running while `prefers-reduced-motion` is set is a bug, but an
  accessibility one — open a normal issue.
- Vulnerabilities in devDependencies that cannot reach the published artefact.
  `files` ships `dist` only.

## Supported versions

The latest release. This is a small package; fixes go forward rather than into
old lines.

## How releases are made

Publishing runs from a tag through `.github/workflows/release.yml`, never from
anyone's machine. It authenticates with a short-lived OIDC token rather than a
stored npm token, so there is no long-lived credential to steal, and npm's
provenance attestation records which commit and which workflow run produced the
tarball. Check it on the package page before trusting a build.
