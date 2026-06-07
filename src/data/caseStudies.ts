// Per-project deep dives, authored in Markdown (rendered via src/os/markdown.ts).
// Keyed by project slug (see RESUME.projects in data/resume.ts). Only projects with an entry here
// show a "CASE STUDY" button; the rest just link out.
export const CASE_STUDIES: Record<string, string> = {
  'financial-doc-engine': `## The problem
Indian listed companies publish financial data in messy, inconsistent formats. Analysts at Leadzen were hand-assembling reports — slow, error-prone, and impossible to scale across thousands of companies.

## The approach
I built an **agentic pipeline** that turns raw filings into polished, dynamic financial documents:

- **CrewAI agents** decompose each report into roles (extract → analyse → write → review)
- **LangChain + Hugging Face** for retrieval and generation, grounded on the cleaned dataset
- A **FastAPI** service orchestrates jobs with per-agent step/time bounds so nothing loops forever
- **Redis** for memory + caching of intermediate results

## What mattered
> Grounding every step in retrieval — not the model's weights — was the difference between "demo" and "shippable". Agents that look things up don't hallucinate numbers.

## Outcome
- **50% faster** report generation
- **95%+ accuracy** on generated figures
- Scaled from a handful of companies to the full coverage universe

**Stack:** FastAPI · CrewAI · LangChain · Hugging Face · Redis`,

  'data-pipeline': `## The problem
The product needed fresh, structured data on Indian public companies — but the sources are scattered across portals, PDFs and APIs, each with its own quirks and rate limits.

## The approach
An end-to-end pipeline powering the company web app:

1. **Scrape** — resilient collectors (Selenium + BeautifulSoup) with retries and backoff
2. **Clean & normalise** — schema validation before anything is trusted
3. **Store** — MongoDB for documents, Redis for hot paths
4. **Serve** — FastAPI endpoints with realtime updates + caching

## What mattered
- Treat every external source as hostile: validate, bound, and log failures loudly.
- Cache aggressively, but invalidate on real signals — stale financials are worse than slow ones.

## Outcome
- **10,000+ data points/day** ingested reliably
- **-25% retrieval time**, **+40% processing efficiency**

**Stack:** Python · FastAPI · MongoDB · Redis`,

  'security-audit': `## The problem
Before scaling, the company's production web apps needed to be proven safe — not assumed safe.

## The approach
A full **security audit + penetration test**:

- Recon & surface mapping (\`nmap\`, \`sublist3r\`)
- Manual testing for the OWASP Top 10 with **Burp Suite** on **Kali**
- Auth, access-control and input-validation review
- Clear, prioritised reporting — each finding with impact + a concrete fix

## What mattered
> A vuln report is only useful if it gets fixed. I paired each finding with remediation steps and verified the fixes, instead of throwing a scary PDF over the wall.

## Outcome
- Real vulnerabilities found and **remediated before launch**
- Backed by a **Cyber Security & Bug Bounty** cert from IIT Kanpur

**Stack:** Burp Suite · nmap · sublist3r · Kali Linux`,

  'telegram-bot-api': `## The problem
Powerful LLM/GenAI tools, a Python executor and a media catalogue — all locked behind paywalls or clunky UIs. I wanted them free and instant, where people already are: Telegram.

## The approach
- Reverse-engineered upstream services to expose them through clean **FastAPI** endpoints
- A **Telegram bot** front-end wrapping LLM chat, a sandboxed Python code-runner, and media search
- Stateless handlers + caching so it stays snappy under load

## Outcome
- **3,000+ users** served
- A reusable backend that turned several services into simple bot commands

**Stack:** Python · FastAPI · Telegram · LLM APIs`,
}
export const hasCaseStudy = (slug: string) => slug in CASE_STUDIES
