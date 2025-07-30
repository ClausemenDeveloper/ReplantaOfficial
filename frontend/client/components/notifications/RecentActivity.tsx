import { useEffect, useState } from "react";

interface RecentActivityProps {
  userEmail: string;
}

export default function RecentActivity({ userEmail }: RecentActivityProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/client/activity?email=${encodeURIComponent(userEmail)}`)
      .then((res) => res.ok ? res.json() : Promise.reject("Erro ao carregar atividades"))
      .then((data) => setActivities(Array.isArray(data) ? data : []))
      .catch((err) => setError(typeof err === "string" ? err : "Erro desconhecido"))
      .finally(() => setLoading(false));
  }, [userEmail]);

  if (loading) return <p className="text-sm text-gray-500">Carregando...</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!activities.length) return <p className="text-sm text-gray-500">Nenhuma atividade recente encontrada.</p>;

  return (
    <>
      {activities.map((activity, idx) => (
        <div key={idx} className="flex items-start space-x-3">
          <div className={`w-2 h-2 rounded-full mt-2 ${activity.color || "bg-garden-green"}`}></div>
          <div>
            <p className="text-sm text-gray-900">{activity.message}</p>
            <p className="text-xs text-gray-500">{activity.timestamp}</p>
          </div>
        </div>
      ))}
    </>
  );
}
