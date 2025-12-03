/**
 * 通用类型定义
 * 用于统一整个应用的基础类型
 */

/**
 * API 统一响应格式
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

/**
 * API 错误信息
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

/**
 * 分页响应数据
 */
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor?: string | null;
}

/**
 * 分页 API 响应
 */
export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

/**
 * 基础实体接口
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 时间戳接口
 */
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

/**
 * 软删除接口
 */
export interface SoftDelete {
  deletedAt?: string | null;
  isDeleted?: boolean;
}

/**
 * 排序方向
 */
export type SortOrder = "asc" | "desc";

/**
 * 排序参数
 */
export interface SortParams<T = string> {
  field: T;
  order: SortOrder;
}

/**
 * 过滤操作符
 */
export type FilterOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "notIn"
  | "contains"
  | "startsWith"
  | "endsWith";

/**
 * 过滤条件
 */
export interface FilterCondition<T = unknown> {
  field: string;
  operator: FilterOperator;
  value: T;
}

/**
 * ID 类型（UUID）
 */
export type UUID = string;

/**
 * 可选的 ID（用于创建操作）
 */
export type OptionalId<T extends { id: string }> = Omit<T, "id"> & {
  id?: string;
};

/**
 * 部分更新类型（排除时间戳）
 */
export type PartialUpdate<T extends BaseEntity> = Partial<
  Omit<T, "id" | "createdAt" | "updatedAt">
>;
