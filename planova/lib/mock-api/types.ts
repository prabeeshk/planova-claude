import type { ID, ISODateTime } from "@/lib/domain/types";

export interface PageInfo {
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

export interface ApiResponseMeta {
  demo: true;
  generatedAt: ISODateTime;
  simulatedLatencyMs: number;
}

export interface ApiListResponse<T> {
  data: T[];
  pageInfo: PageInfo;
  meta: ApiResponseMeta;
}

export interface ApiSingleResponse<T> {
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  correlationId: string;
  detail: string;
  fieldErrors?: Record<string, string>;
}

export class MockApiError extends Error {
  public problem: ApiProblemDetails;
  constructor(problem: ApiProblemDetails) {
    super(problem.detail || problem.title);
    this.name = "MockApiError";
    this.problem = problem;
  }
  get status(): number {
    return this.problem.status;
  }
  get code(): string {
    return this.problem.code;
  }
}

export interface FaultInjectionConfig {
  simulateLatency: boolean;
  minLatencyMs: number;
  maxLatencyMs: number;
  forceErrorStatus: number | null; // e.g. 403, 404, 409, 500
  forceErrorMessage?: string;
  simulateConflictOnVersionMismatch: boolean;
}
