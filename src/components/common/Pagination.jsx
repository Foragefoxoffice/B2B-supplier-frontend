import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import SelectField from './SelectField';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems
}) => {
  if (totalPages <= 1 && (!totalItems || totalItems === 0)) return null;

  const startIndex = (currentPage - 1) * (itemsPerPage || 10);
  const showItemsCount = totalItems !== undefined && totalItems !== null && onItemsPerPageChange;

  return (
    <div className="bg-white px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between rounded-b-2xl relative gap-3">
      {/* Left side: Item count & Limit Dropdown */}
      <div className="flex-1 flex items-center justify-center sm:justify-start gap-3 w-full">
        {showItemsCount ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-slate-500 font-medium text-xs bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm shadow-slate-100/50">
              Showing <span className="text-slate-900 font-semibold">{totalItems === 0 ? 0 : startIndex + 1}</span> to{' '}
              <span className="text-slate-900 font-semibold">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of{' '}
              <span className="text-slate-900 font-semibold">{totalItems}</span> results
            </div>
            
            <div className="hidden sm:block w-px h-5 bg-slate-200"></div>
            
            <div className="flex items-center gap-1.5 bg-slate-50/80 px-1.5 py-1 rounded-lg border border-slate-100 shadow-sm shadow-slate-100/50">
              <span className="text-slate-400 font-medium text-[10px] uppercase tracking-wider pl-1.5">Show</span>
              <SelectField
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
                className="rounded-md px-2 py-0.5 text-xs cursor-pointer font-semibold text-slate-700 bg-white border border-slate-200 hover:border-blue-300 transition-colors focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                wrapperClassName="w-16"
                menuPosition="top"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </SelectField>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-600 bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm shadow-slate-100/50">
            Page <span className="font-semibold text-slate-900">{currentPage}</span> of <span className="font-semibold text-slate-900">{totalPages}</span>
          </div>
        )}
      </div>

      {/* Right side: Pagination Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 bg-slate-50/80 p-1 rounded-lg border border-slate-100 shadow-sm shadow-slate-100/50">
          <button
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            className="p-1.5 rounded-md bg-transparent hover:bg-white hover:shadow-sm hover:text-slate-900 transition-all duration-300 ease-in-out disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:shadow-none disabled:cursor-not-allowed cursor-pointer text-slate-500 flex items-center justify-center"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-0.5">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              
              // Smart ellipsis logic
              if (totalPages > 7) {
                if (pageNum !== 1 && pageNum !== totalPages) {
                  if (currentPage <= 4) {
                    if (pageNum > 5) {
                      if (pageNum === 6) return <div key="ellipsis-end" className="w-8 h-8 flex items-center justify-center text-slate-400"><MoreHorizontal className="h-3.5 w-3.5" /></div>;
                      return null;
                    }
                  } else if (currentPage >= totalPages - 3) {
                    if (pageNum < totalPages - 4) {
                      if (pageNum === totalPages - 5) return <div key="ellipsis-start" className="w-8 h-8 flex items-center justify-center text-slate-400"><MoreHorizontal className="h-3.5 w-3.5" /></div>;
                      return null;
                    }
                  } else {
                    if (Math.abs(pageNum - currentPage) > 1) {
                      if (pageNum === currentPage - 2) return <div key="ellipsis-start" className="w-8 h-8 flex items-center justify-center text-slate-400"><MoreHorizontal className="h-3.5 w-3.5" /></div>;
                      if (pageNum === currentPage + 2) return <div key="ellipsis-end" className="w-8 h-8 flex items-center justify-center text-slate-400"><MoreHorizontal className="h-3.5 w-3.5" /></div>;
                      return null;
                    }
                  }
                }
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`relative inline-flex items-center justify-center h-8 w-8 rounded-md text-xs font-semibold transition-all duration-300 ease-in-out cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-active-btn text-white shadow-sm shadow-blue-500/20 border-0'
                      : 'bg-transparent hover:bg-white text-slate-600 hover:text-slate-900 hover:shadow-sm border border-transparent'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            className="p-1.5 rounded-md bg-transparent hover:bg-white hover:shadow-sm hover:text-slate-900 transition-all duration-300 ease-in-out disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:shadow-none disabled:cursor-not-allowed cursor-pointer text-slate-500 flex items-center justify-center"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
