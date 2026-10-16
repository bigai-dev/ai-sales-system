// Every link, redirect() and revalidatePath() goes through here so a page can
// move without hunting for hard-coded strings.

export const routes = {
  today: () => "/today",
  dashboard: () => "/",
  clients: () => "/clients",
  client: (id: string) => `/clients/${id}`,
  readiness: (id: string) => `/clients/${id}/health-check`,
  readinessIndex: () => "/health-check",
  deals: (opts?: { hot?: boolean }) => (opts?.hot ? "/pipeline?hot=1" : "/pipeline"),
  calls: () => "/calls",
  call: (id: string) => `/calls/${id}`,
  training: () => "/training",
  trends: () => "/training/trends",
  rolePlay: (topic?: string) =>
    topic ? `/training/role-play/${topic}` : "/training/role-play",
  playbook: (id?: string) => (id ? `/training/playbook/${id}` : "/training/playbook"),
} as const;
