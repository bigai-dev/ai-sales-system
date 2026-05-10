import ClientsView from "@/components/views/ClientsView";
import { getClientList } from "@/lib/queries/clients";

export default async function ClientsPage() {
  const clientList = await getClientList();
  return <ClientsView clientList={clientList} />;
}
