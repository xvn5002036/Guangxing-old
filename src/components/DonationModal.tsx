import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Building2 } from 'lucide-react';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'credit' | 'mobile' | 'bank'>('credit');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would integrate with payment processor
    alert(`感謝您的捐款 NT$${amount}！（此為模擬功能）`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-mystic-dark border border-mystic-gold/20 rounded-lg p-6 w-full max-w-md animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-mystic-gold">香油捐款</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              捐款金額 (NT$)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-mystic-gold/30 rounded-md text-white focus:border-mystic-gold focus:outline-none"
              placeholder="請輸入金額"
              min={1}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              付款方式
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-3 border border-mystic-gold/20 rounded-md cursor-pointer hover:border-mystic-gold/40 transition-colors">
                <input
                  type="radio"
                  name="method"
                  value="credit"
                  checked={method === 'credit'}
                  onChange={(e) => setMethod(e.target.value as typeof method)}
                  className="text-mystic-gold focus:ring-mystic-gold"
                />
                <CreditCard className="w-5 h-5 text-mystic-gold" />
                <span className="text-gray-300">信用卡</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-mystic-gold/20 rounded-md cursor-pointer hover:border-mystic-gold/40 transition-colors">
                <input
                  type="radio"
                  name="method"
                  value="mobile"
                  checked={method === 'mobile'}
                  onChange={(e) => setMethod(e.target.value as typeof method)}
                  className="text-mystic-gold focus:ring-mystic-gold"
                />
                <Smartphone className="w-5 h-5 text-mystic-gold" />
                <span className="text-gray-300">行動支付</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-mystic-gold/20 rounded-md cursor-pointer hover:border-mystic-gold/40 transition-colors">
                <input
                  type="radio"
                  name="method"
                  value="bank"
                  checked={method === 'bank'}
                  onChange={(e) => setMethod(e.target.value as typeof method)}
                  className="text-mystic-gold focus:ring-mystic-gold"
                />
                <Building2 className="w-5 h-5 text-mystic-gold" />
                <span className="text-gray-300">銀行轉帳</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-mystic-gold hover:bg-mystic-gold/90 text-black font-semibold py-3 px-4 rounded-md transition-colors duration-200"
          >
            確認捐款
          </button>
        </form>
      </div>
    </div>
  );
};

export default DonationModal;