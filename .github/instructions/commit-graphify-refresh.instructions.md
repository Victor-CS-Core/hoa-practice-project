---
description: "Use when performing commit-related tasks, preparing commits, or finalizing change batches. Reminds the agent to refresh graphify state so project graph context stays current."
name: "Commit Graphify Refresh Reminder"
---

# Commit Graphify Refresh Reminder

- During commit preparation, strongly prefer refreshing graphify before final commit steps.
- If HoaCommunityEvents/graphify-out/graph.json exists, run /graphify HoaCommunityEvents --update as part of commit readiness.
- If graphify has not been initialized in this workspace yet, run /graphify HoaCommunityEvents first.
- If graphify refresh is intentionally skipped, state why in the final update.
