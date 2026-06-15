import { useQuery } from "@tanstack/react-query";
import { Medication } from "@/types"; // Assuming Medication type is defined here or similar

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const fetchMedications = async (): Promise<Medication[]> => {
  const response = await fetch(`${API_BASE_URL}/api/medications`);
  if (!response.ok) {
    throw new Error("Failed to fetch medications");
  }
  return response.json();
};

export function useMedications() {
  return useQuery<Medication[], Error>({
    queryKey: ["medications"],
    queryFn: fetchMedications,
  });
}
