import { PharmacyPriorityManager } from "@/components/settings/PharmacyPriorityManager";
import { useAuthStore } from "@/store/useAuthStore";

export default function PharmacyPriorityPage() {
  const { user } = useAuthStore();
  
  // Get client ID from user context
  const clientId = user?.client_id || "";

  if (!clientId) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          Unable to load client information
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PharmacyPriorityManager clientId={clientId} />
    </div>
  );
}
