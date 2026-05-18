import { api } from "../lib/apiClient";

export type SentimentLabel = {
  id: number;
  code: string;
  labelEs: string;
  emoji: string;
  ordinal: number;
};

export type SentimentLabelUpdateRequest = {
  labelEs: string;
  emoji: string;
};

export const listSentimentLabels = () =>
  api.get<SentimentLabel[]>("/api/sentiment-labels");

export const updateSentimentLabel = (
  id: number,
  body: SentimentLabelUpdateRequest,
) => api.put<SentimentLabel>(`/api/sentiment-labels/${id}`, body);
