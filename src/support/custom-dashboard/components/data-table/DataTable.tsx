/** @jsxImportSource @kitajs/html */
import type { Children } from '@kitajs/html';

export interface DataTableProps {
  variant?: 'report' | 'history' | 'compare' | 'default';
  class?: string;
  id?: string;
  children: Children;
}

export function DataTable({
  variant = 'default',
  class: className = '',
  id,
  children,
}: DataTableProps) {
  const variantClass =
    variant === 'history'
      ? 'history-table'
      : variant === 'compare'
        ? 'comparison-table'
        : 'qa-report-table';
  const cls = [variantClass, 'data-table', className].filter(Boolean).join(' ');
  return (
    <table class={cls} id={id}>
      {children}
    </table>
  );
}
