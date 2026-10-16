// Every link, redirect() and revalidatePath() goes through here so a page can
// move without hunting for hard-coded strings. Old addresses are forwarded in
// next.config.ts.

export const routes = {
  today: () => "/",
  dashboard: () => "/dashboard",
  clients: () => "/clients",
  client: (id: string) => `/clients/${id}`,
  readiness: (id: string) => `/clients/${id}/readiness`,
  readinessIndex: () => "/clients/readiness",
  deals: (opts?: { hot?: boolean }) => (opts?.hot ? "/deals?hot=1" : "/deals"),
  calls: () => "/calls",
  call: (id: string) => `/calls/${id}`,
  training: () => "/training",
  rolePlay: (topic?: string) =>
    topic ? `/training/role-play/${topic}` : "/training/role-play",
  playbook: (id?: string) => (id ? `/training/playbook/${id}` : "/training/playbook"),
} as const;
