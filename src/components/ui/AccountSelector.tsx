import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { ACCOUNT_TYPE_LABELS } from '../../constants';
import { formatCurrency } from '../../utils/currency';
import { Landmark, Banknote, CreditCard, Wallet, Layers, ChevronDown, Check } from 'lucide-react';

export const AccountSelector: React.FC = () => {
  const { accounts, selectedAccountId, setSelectedAccount, profile } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeAccounts = accounts.filter((a) => a.isActive);
  const currencySymbol = profile?.currencySymbol || '₹';

  // Total balance across all active accounts
  const totalBalance = activeAccounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const currentSelectedAccount =
    selectedAccountId === 'ALL' ? null : activeAccounts.find((a) => a.id === selectedAccountId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAccountIcon = (type?: string) => {
    switch (type) {
      case 'bank':
        return <Landmark className="w-4 h-4 text-blue-500" />;
      case 'cash':
        return <Banknote className="w-4 h-4 text-emerald-500" />;
      case 'credit_card':
        return <CreditCard className="w-4 h-4 text-purple-500" />;
      case 'wallet':
        return <Wallet className="w-4 h-4 text-amber-500" />;
      default:
        return <Layers className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-800 dark:text-gray-100 text-xs font-bold py-1.5 px-3 rounded-xl border border-gray-200 dark:border-gray-600 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          {getAccountIcon(currentSelectedAccount?.type)}
          <span className="max-w-[120px] truncate">
            {currentSelectedAccount ? currentSelectedAccount.name : 'All Accounts'}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-fade-in">
          <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
            Select Account Scope
          </div>

          {/* ALL ACCOUNTS option */}
          <button
            onClick={() => {
              setSelectedAccount('ALL');
              setIsOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
              selectedAccountId === 'ALL' ? 'bg-blue-50/70 dark:bg-blue-950/40' : ''
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg">
                <Layers className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">All Accounts</p>
                <p className="text-[10px] text-gray-400">Combined Total Balance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {formatCurrency(totalBalance, currencySymbol)}
              </span>
              {selectedAccountId === 'ALL' && <Check className="w-4 h-4 text-blue-600" />}
            </div>
          </button>

          <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

          {/* INDIVIDUAL ACCOUNTS */}
          <div className="max-h-60 overflow-y-auto">
            {activeAccounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => {
                  setSelectedAccount(acc.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                  selectedAccountId === acc.id ? 'bg-blue-50/70 dark:bg-blue-950/40' : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    {getAccountIcon(acc.type)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white max-w-[100px] truncate">
                      {acc.name}
                    </p>
                    <p className="text-[10px] text-gray-400 capitalize">{ACCOUNT_TYPE_LABELS[acc.type]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                    {formatCurrency(acc.currentBalance, currencySymbol)}
                  </span>
                  {selectedAccountId === acc.id && <Check className="w-4 h-4 text-blue-600" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
