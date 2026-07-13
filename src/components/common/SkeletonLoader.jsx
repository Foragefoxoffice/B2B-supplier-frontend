import React from 'react';
import { motion } from 'framer-motion';

// Base Skeleton Block
export const Skeleton = ({ className = '', rounded = 'rounded-md' }) => {
  return (
    <div className={`bg-slate-200 animate-pulse ${rounded} ${className}`}></div>
  );
};

// Generic Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="w-full">
      <div className="flex border-b border-slate-100 bg-slate-50/50 p-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full mx-2" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex border-b border-slate-50 p-4 items-center">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-full mx-2" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Dashboard Card Skeleton
export const TableRowsSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="p-4">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

// Dashboard Card Skeleton
export const DashboardCardSkeleton = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
      <div className="space-y-3 w-full">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
    </div>
  );
};

// Chart Skeleton
export const ChartSkeleton = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm w-full h-[400px] flex flex-col justify-end">
      <Skeleton className="h-6 w-1/4 mb-6" />
      <div className="flex items-end gap-2 h-[300px]">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className={`w-full ${i % 2 === 0 ? 'h-3/4' : 'h-1/2'} rounded-t-md`} rounded="" />
        ))}
      </div>
    </div>
  );
};

// Form Field Skeleton
export const FormFieldSkeleton = () => {
  return (
    <div className="space-y-2 mb-4">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
};

export const SettingsSkeleton = () => {
  return (
    <div className="max-w-6xl mx-auto pb-10">
      <PageHeaderSkeleton />
      <div className="flex flex-col lg:flex-row gap-8 mt-4">
        <div className="lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 space-y-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 md:p-8 space-y-8">
              <Skeleton className="h-6 w-1/4 mb-8" />
              <div className="flex items-center gap-5 mb-10">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormFieldSkeleton />
                <FormFieldSkeleton />
                <FormFieldSkeleton />
                <FormFieldSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PageHeaderSkeleton = () => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="space-y-2 w-1/3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-10 w-32 rounded-xl" />
    </div>
  );
};

export const FullDashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <div className="space-y-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    </div>
  );
};
