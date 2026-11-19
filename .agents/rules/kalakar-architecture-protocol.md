# Kalakar Events Architecture & Engineering Protocol

> Scope: Kalakar Events Application (`F:\automation` & `F:\kalakar`)

## Project Identity & Tech Stack
- **Product**: Kalakar Events CRM, Vendor Categorization Dashboard, and Quotation / Invoice Generator.
- **Frontend**: Next.js / React + Tailwind CSS dashboard.
- **Backend**: Node.js backend with PDF quotation generation engine (`test_sample_quotation.pdf`).
- **Deployments**: Vercel (Frontend), Render (Backend / Dockerfile).

## Mandatory Standards for Agents Working on Kalakar

1. **Quotation & Invoice Calculation Accuracy**:
   - Financial totals, itemized inclusions, taxes, and vendor margins must be calculated deterministically on the backend before PDF rendering.
2. **PDF Generation Stability**:
   - Ensure PDF render pipelines handle dynamic page breaks, multi-line inclusion blocks, and high-res client branding/logos without crashing headless Chromium/Puppeteer processes.
3. **Container & Environment Consistency**:
   - Dockerfile configurations must build cleanly without platform-specific binary mismatches.
4. **Verification Gate**:
   - Always verify that quotation PDF previews generate correctly and test builds succeed before reporting completion.
