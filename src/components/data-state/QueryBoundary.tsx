import type { ReactNode } from "react";
import { type UseQueryResult } from "@tanstack/react-query";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { ApiError, NotImplementedError } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";

interface QueryBoundaryProps<TData> {
  query: UseQueryResult<TData>;
  loading?: ReactNode;
  isEmpty?: (data: TData) => boolean;
  empty?: ReactNode;
  children: (data: TData) => ReactNode;
}

export function QueryBoundary<TData>({
  query,
  loading,
  isEmpty,
  empty,
  children,
}: QueryBoundaryProps<TData>) {
  if (query.isPending) {
    return <>{loading ?? <DefaultLoading />}</>;
  }
  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }
  const data = query.data as TData;
  if (isEmpty && isEmpty(data)) {
    return <>{empty ?? <EmptyState title="Nothing here yet" />}</>;
  }
  return <>{children(data)}</>;
}

function DefaultLoading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const isNotImplemented = error instanceof NotImplementedError;
  const api = error instanceof ApiError ? error : null;
  const message = api?.message ?? (error instanceof Error ? error.message : "Unexpected error");
  const code = api?.code ?? "unknown_error";

  return (
    <div
      className={`surface-1 flex flex-col items-start gap-3 rounded-md p-6 ${className ?? ""}`}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-destructive" strokeWidth={1.75} />
        <span className="font-mono text-xs text-muted-foreground">error / {code}</span>
      </div>
      <p className="max-w-lg text-sm text-foreground">{message}</p>
      {isNotImplemented && (
        <p className="text-xs text-muted-foreground">
          This screen is UI-complete but the endpoint is not wired yet. It will light up once the
          API is connected.
        </p>
      )}
      {onRetry && !isNotImplemented && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <RefreshCw className="h-3 w-3" strokeWidth={2} />
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`surface-1 flex flex-col items-start gap-3 rounded-md p-8 ${className ?? ""}`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-border-subtle bg-background text-muted-foreground">
        {icon ?? <Inbox className="h-4 w-4" strokeWidth={1.75} />}
      </div>
      <div>
        <p className="font-mono text-sm text-foreground">{title}</p>
        {description && (
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
