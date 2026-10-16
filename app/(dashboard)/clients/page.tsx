import { PAGE } from "@/lib/constants/copy";
import ClientsView from "@/components/views/ClientsView";
import { getClientList } from "@/lib/queries/clients";

export const metadata = { title: PAGE.clients.title };

export default async function ClientsPage() {
  const clientList = await getClientList();
  return <ClientsView clientList={clientList} />;
}
