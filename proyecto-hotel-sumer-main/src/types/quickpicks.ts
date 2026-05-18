import { api } from "../lib/apiClient";

export type FichaQuickpick = {
  id: number;
  rowLabel: string;
  value: string;
  ordinal: number;
};

export type FichaQuickpickUpsertRequest = {
  rowLabel: string;
  value: string;
  ordinal: number;
};

export const listQuickpicks = () =>
  api.get<FichaQuickpick[]>("/api/sheet-quickpicks");

export const listQuickpickLabels = () =>
  api.get<string[]>("/api/sheet-quickpicks/labels");

export const createQuickpick = (body: FichaQuickpickUpsertRequest) =>
  api.post<FichaQuickpick>("/api/sheet-quickpicks", body);

export const updateQuickpick = (
  id: number,
  body: FichaQuickpickUpsertRequest,
) => api.put<FichaQuickpick>(`/api/sheet-quickpicks/${id}`, body);

export const deleteQuickpick = (id: number) =>
  api.delete<void>(`/api/sheet-quickpicks/${id}`);
