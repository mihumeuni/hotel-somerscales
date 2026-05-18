import { api } from "../lib/apiClient";

export type Category = {
  id: number;
  code: string;
  labelEs: string;
  labelEn: string;
};

export type CategoryUpsertRequest = {
  labelEs: string;
  labelEn?: string;
};

export type ReclassifyResult = {
  ranAt: string;
  mode: string;
  processed: number;
  ok: number;
  errors: number;
  elapsedSec: number;
};

export const listCategories = () => api.get<Category[]>("/api/categories");

export const createCategory = (body: CategoryUpsertRequest) =>
  api.post<Category>("/api/categories", body);

export const updateCategory = (id: number, body: CategoryUpsertRequest) =>
  api.put<Category>(`/api/categories/${id}`, body);

export const deleteCategory = (id: number) =>
  api.delete<void>(`/api/categories/${id}`);

export const reclassifyAll = () =>
  api.post<ReclassifyResult>("/api/categories/reclassify", {});
