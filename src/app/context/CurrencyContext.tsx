import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSettingsQuery } from '../hooks/useSettings';

export type CurrencyCode = 'USD' | 'NGN' | 'AED' | 'INR';

interface BankDetails {
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingNumber?: string;
    currency: CurrencyCode;
}

interface CurrencyInfo {
    code: CurrencyCode;
    symbol: string;
    rate: number; // Mock rate against USD
    label: string;
    bankDetails: BankDetails;
}

export const currencies: Record<CurrencyCode, CurrencyInfo> = {
    USD: {
        code: 'USD',
        symbol: '$',
        rate: 1,
        label: 'US Dollar',
        bankDetails: {
            bankName: 'Global Bank NY',
            accountName: 'GME INTERCHANGE LLC',
            accountNumber: '9876543210',
            routingNumber: 'SWIFT: GBLBNY33',
            currency: 'USD'
        }
    },
    NGN: {
        code: 'NGN',
        symbol: '₦',
        rate: 1500,
        label: 'Nigerian Naira',
        bankDetails: {
            bankName: 'Access Bank Nigeria',
            accountName: 'GME INTERCHANGE NIGERIA LTD',
            accountNumber: '0011223344',
            routingNumber: '044 (Access Bank)',
            currency: 'NGN'
        }
    },
    AED: {
        code: 'AED',
        symbol: 'AED',
        rate: 3.67,
        label: 'UAE Dirham',
        bankDetails: {
            bankName: 'Emirates NBD',
            accountName: 'GME INTERCHANGE FZE',
            accountNumber: '1122334455',
            routingNumber: 'SWIFT: ENBDAEAD',
            currency: 'AED'
        }
    },
    INR: {
        code: 'INR',
        symbol: '₹',
        rate: 83.50,
        label: 'Indian Rupee',
        bankDetails: {
            bankName: 'State Bank of India',
            accountName: 'GME INTERCHANGE INDIA PVT LTD',
            accountNumber: '3344556677',
            routingNumber: 'IFSC: SBIN0001234',
            currency: 'INR'
        }
    },
};

interface CurrencyContextType {
    currency: CurrencyCode;
    setCurrency: (code: CurrencyCode) => void;
    formatCurrency: (amount: number, shouldConvert?: boolean) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Only enable the query if we have a user in localStorage to prevent unnecessary calls on login page
    const { data: companySettings } = useSettingsQuery({ 
        enabled: !!localStorage.getItem('britcore_user')   // must match USER_KEY in AuthContext
    });
    const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
        const saved = localStorage.getItem('currency');
        return (saved as CurrencyCode) || 'USD';
    });

    useEffect(() => {
        if (companySettings?.currency) {
            setCurrencyState(companySettings.currency as CurrencyCode);
        }
    }, [companySettings?.currency]);

    useEffect(() => {
        localStorage.setItem('currency', currency);
    }, [currency]);

    const setCurrency = (code: CurrencyCode) => setCurrencyState(code);

    const formatCurrency = (amount: number, shouldConvert: boolean = true) => {
        const activeCurrency = currencies[currency] || currencies['AED'];
        const { symbol, rate } = activeCurrency;
        const convertedAmount = shouldConvert ? amount * rate : amount;
        return `${symbol}${convertedAmount.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}`;
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
