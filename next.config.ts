import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Don't auto-generate AGENTS.md/CLAUDE.md — this project already has its
  // own documentation conventions.
  agentRules: false,
};

export default nextConfig;
