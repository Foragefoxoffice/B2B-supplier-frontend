import React, { useState } from 'react';
import { X, Package } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const DeliveryModal = ({ isOpen, onClose, onConfirm }) => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [bookingCopy, setBookingCopy] = useState(null);
  const [invoiceCopy, setInvoiceCopy] = useState(null);

  if (!isOpen) return null;

  const handleFileCompress = async (file) => {
    if (file && file.type.startsWith('image/')) {
      const options = {
        maxSizeMB: 0.15,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        initialQuality: 0.7
      };
      try {
        return await imageCompression(file, options);
      } catch (error) {
        console.error('Error compressing image:', error);
        return file;
      }
    }
    return file;
  };

  const handleConfirm = () => {
    onConfirm({ trackingNumber, bookingCopy, invoiceCopy });
    setTrackingNumber('');
    setBookingCopy(null);
    setInvoiceCopy(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-5 flex items-start justify-between border-b border-green-50/50 bg-green-50/30">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 shrink-0">
              <Package size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-[20px]">Good Tracking Details</h3>
              <p className="text-[13px] text-slate-500 mt-0.5">Add delivery details before completing</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <input
              type="text"
              placeholder="Tracking Number"
              className="w-full border border-slate-200 rounded-lg p-3 text-[14px] focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Booking Copy (LR)</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-[13px] font-semibold rounded-lg transition-colors border border-green-100">
                Choose File
                <input
                  type="file"
                  className="hidden"
                  onChange={async (e) => setBookingCopy(await handleFileCompress(e.target.files[0]))}
                  accept=".pdf, image/*"
                />
              </label>
              <span className="text-[13px] text-slate-500 truncate max-w-[200px]">
                {bookingCopy ? bookingCopy.name : 'No file chosen'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Invoice Copy</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-[13px] font-semibold rounded-lg transition-colors border border-green-100">
                Choose File
                <input
                  type="file"
                  className="hidden"
                  onChange={async (e) => setInvoiceCopy(await handleFileCompress(e.target.files[0]))}
                  accept=".pdf, image/*"
                />
              </label>
              <span className="text-[13px] text-slate-500 truncate max-w-[200px]">
                {invoiceCopy ? invoiceCopy.name : 'No file chosen'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Package size={16} />
            Confirm Delivery
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryModal;
