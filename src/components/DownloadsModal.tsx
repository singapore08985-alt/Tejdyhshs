import React from 'react';
import { 
  X, 
  FolderDown, 
  Download, 
  Copy, 
  Check, 
  Smartphone, 
  FileCode, 
  FileArchive, 
  Clock 
} from 'lucide-react';
import { Order } from '../types';
import { triggerHapticFeedback, showAndroidToast } from '../utils/haptics';

interface DownloadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const DownloadsModal: React.FC<DownloadsModalProps> = ({
  isOpen,
  onClose,
  orders,
}) => {
  if (!isOpen) return null;

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    triggerHapticFeedback(15);
    showAndroidToast("License key copied!");
  };

  const handleDownloadSample = (title: string, key: string) => {
    triggerHapticFeedback(20);
    const content = `JHX DIGITAL SHOP - ASSET RECEIPT
Item: ${title}
License Key: ${key}
Downloaded at: ${new Date().toISOString()}

Thank you for choosing JHX Digital Shop!
For technical support or updates, visit: https://ais-dev-cxqa6wc3bmaxvk4wji3ka2-941055579571.asia-southeast1.run.app`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_License.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <FolderDown className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">My Digital Downloads & Licenses</h2>
          </div>
          <button
            onClick={() => {
              triggerHapticFeedback(10);
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {orders.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                <FolderDown className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-200 text-sm">No purchases yet</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Your purchased digital items, source code packages, and license keys will appear here with lifetime access.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div 
                  key={order.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-white font-mono">{order.id}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{order.date}</span>
                    </div>
                    <div className="text-xs font-bold text-emerald-400">
                      Paid: {order.currency === 'INR' ? '₹' : '$'}{order.total.toLocaleString()}
                    </div>
                  </div>

                  {/* Items in this order */}
                  <div className="space-y-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.product.thumbnail}
                            alt=""
                            className="w-10 h-10 object-cover rounded-lg bg-slate-800 flex-shrink-0"
                          />
                          <div className="truncate">
                            <div className="font-semibold text-slate-200 truncate">{item.product.title}</div>
                            <div className="text-[11px] text-slate-400">{item.license} license • {item.product.fileFormat}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.product.sampleDownloadUrl ? (
                            <a
                              href={item.product.sampleDownloadUrl}
                              download
                              onClick={() => triggerHapticFeedback(20)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download (.ZIP)
                            </a>
                          ) : (
                            <button
                              onClick={() => handleDownloadSample(item.product.title, order.licenseKey)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                              License File
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* License Key bar */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">License Key:</span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-emerald-400 text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {order.licenseKey}
                      </code>
                      <button
                        onClick={() => handleCopyKey(order.licenseKey)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Copy Key"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={() => {
              triggerHapticFeedback(10);
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
