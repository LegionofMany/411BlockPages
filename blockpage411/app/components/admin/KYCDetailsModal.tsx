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
    <div className="bg-gray-900 rounded-lg p-8 max-w-lg w-full shadow-xl relative">
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl"
        onClick={onClose}
      >×</button>
      <h2 className="text-xl font-bold text-cyan-200 mb-4">KYC Details</h2>
      {wallet && wallet.kycDetails ? (
        <div className="space-y-2">
          {Object.entries(wallet.kycDetails).map(([key, value]) =>
            value && typeof value === 'string' && (key.endsWith('Url') ? (
              <div key={key}>
                <span className="font-semibold text-cyan-300">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}:</span>{' '}
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">View Document</a>
              </div>
            ) : (
              <div key={key}>
                <span className="font-semibold text-cyan-300">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}:</span> {value}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="text-cyan-400">No KYC details available.</div>
      )}
    </div>
  </ReactModal>
);

export default KYCDetailsModal;
