"use client";

import { useState, useEffect } from "react";

export type Department = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export function useDepartments(): { departments: Department[]; loading: boolean; error: string | null } {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/departments")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load departments");
        return res.json();
      })
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setDepartments(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load departments");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { departments, loading, error };
}
