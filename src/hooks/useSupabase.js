"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function useSupabase() {
  const supabase = createClient();
  return supabase;
}

export async function getOrgId(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  return data?.organization_id;
}

export function useCrud(table) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const orgIdCache = useRef(null);

  const resolveOrgId = useCallback(async () => {
    if (orgIdCache.current) return orgIdCache.current;
    const id = await getOrgId(supabase);
    orgIdCache.current = id;
    return id;
  }, []);

  const fetchAll = useCallback(async (options = {}) => {
    setLoading(true);
    let query = supabase.from(table).select(options.select || "*");

    if (options.filters) {
      options.filters.forEach(([col, op, val]) => {
        query = query.filter(col, op, val);
      });
    }
    if (options.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending ?? false });
    } else {
      query = query.order("created_at", { ascending: false });
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    setLoading(false);
    if (error) throw error;
    setData(data || []);
    return data || [];
  }, [table]);

  const fetchOne = useCallback(async (id, select = "*") => {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }, [table]);

  const create = useCallback(async (values) => {
    setLoading(true);
    const organization_id = await resolveOrgId();
    const { data, error } = await supabase
      .from(table)
      .insert({ ...values, organization_id })
      .select()
      .single();
    setLoading(false);
    if (error) throw error;
    return data;
  }, [table, resolveOrgId]);

  const update = useCallback(async (id, values) => {
    setLoading(true);
    const { data, error } = await supabase
      .from(table)
      .update(values)
      .eq("id", id)
      .select()
      .single();
    setLoading(false);
    if (error) throw error;
    return data;
  }, [table]);

  const remove = useCallback(async (id) => {
    setLoading(true);
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", id);
    setLoading(false);
    if (error) throw error;
  }, [table]);

  return { data, loading, fetchAll, fetchOne, create, update, remove, setData, resolveOrgId };
}
