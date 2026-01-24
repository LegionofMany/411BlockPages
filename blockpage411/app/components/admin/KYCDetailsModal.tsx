import React from "react";
import ReactModal from "react-modal";

interface KYCDetailsModalProps {
  isOpen: boolean;
  wallet: { kycDetails?: Record<string, string> | null } | null;
  onClose: () => void;
}

const KYCDetailsModal: React.FC<KYCDetailsModalProps> = ({ isOpen, wallet, onClose }) => (
  <ReactModal
    isOpen={isOpen}
    onRequestClose={onClose}
    contentLabel="KYC Details"
    className="fixed inset-0 flex items-center justify-center z-50"
    overlayClassName="fixed inset-0 bg-black bg-opacity-60 z-40"
    ariaHideApp={false}
  >
    <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-5 sm:p-6 max-w-lg w-[min(32rem,92vw)] shadow-xl border border-white/10 relative">
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl"
        onClick={onClose}
      >×</button>
      <h2 className="text-base sm:text-lg font-semibold text-slate-100 mb-4">KYC Details</h2>
      {wallet && wallet.kycDetails ? (
        <div className="space-y-2">
          {Object.entries(wallet.kycDetails).map(([key, value]) =>
            value && typeof value === 'string' && (key.endsWith('Url') ? (
              <div key={key}>
                <span className="font-semibold text-slate-200">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}:</span>{' '}
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-200 hover:text-emerald-100 underline underline-offset-2 break-all"
                >
                  View Document
                </a>
              </div>
            ) : (
              <div key={key}>
                <span className="font-semibold text-slate-200">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}:</span>{' '}
                <span className="text-slate-100 break-words">{value}</span>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="text-slate-300">No KYC details available.</div>
      )}
    </div>
  </ReactModal>
);

export default KYCDetailsModal;
