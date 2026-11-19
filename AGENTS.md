# Kalakar Events Project Instructions & Architecture Standards

Please refer to the detailed architecture guidelines in:
[`.agents/rules/kalakar-architecture-protocol.md`](file:///F:/automation/.agents/rules/kalakar-architecture-protocol.md)

### Key Directives:
1. **Engineering Loop**: Always `Plan -> Test -> Implement -> Review -> Verify -> Remember`.
2. **Build Gate**: Verify that both backend and frontend builds compile cleanly.
3. **PDF Generation**: Ensure quotation and invoice math is deterministic and dynamic inclusions format cleanly without PDF clipping.
4. **Deployments**: Keep Dockerfile, Render configurations, and Vercel settings synchronized.
