import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ── Supported Currencies ──────────────────────────────────────────────────────
export interface CurrencyDef {
    code: string;
    name: string;
    symbol: string;
    locale: string;
    decimals: number;
    country: string;
}

export const CURRENCIES: CurrencyDef[] = [
    { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US', decimals: 2, country: 'United States' },
    { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE', decimals: 2, country: 'Europe' },
    { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB', decimals: 2, country: 'United Kingdom' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN', decimals: 2, country: 'India' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', locale: 'en-CA', decimals: 2, country: 'Canada' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU', decimals: 2, country: 'Australia' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG', decimals: 2, country: 'Singapore' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', locale: 'ar-AE', decimals: 2, country: 'UAE' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP', decimals: 0, country: 'Japan' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', locale: 'zh-CN', decimals: 2, country: 'China' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', locale: 'ar-SA', decimals: 2, country: 'Saudi Arabia' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', locale: 'de-CH', decimals: 2, country: 'Switzerland' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', locale: 'en-NZ', decimals: 2, country: 'New Zealand' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', locale: 'en-ZA', decimals: 2, country: 'South Africa' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', locale: 'pt-BR', decimals: 2, country: 'Brazil' },
];

const DEFAULT_CURRENCY = CURRENCIES.find(c => c.code === 'USD')!;

// ── Storage helpers ───────────────────────────────────────────────────────────
const STORAGE_KEY_PREFIX = 'ev_currency_';

const loadCurrency = (clinicId?: number | string): CurrencyDef => {
    try {
        const key = `${STORAGE_KEY_PREFIX}${clinicId ?? 'global'}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            const found = CURRENCIES.find(c => c.code === saved);
            if (found) return found;
        }
    } catch { /* ignore */ }
    return DEFAULT_CURRENCY;
};

const saveCurrency = (code: string, clinicId?: number | string) => {
    try {
        const key = `${STORAGE_KEY_PREFIX}${clinicId ?? 'global'}`;
        localStorage.setItem(key, code);
    } catch { /* ignore */ }
};

// ── Context types ─────────────────────────────────────────────────────────────
interface CurrencyContextType {
    currency: CurrencyDef;
    setCurrencyCode: (code: string) => void;
    /** Format a raw number as currency string e.g. ₹1,23,456.00 */
    formatMoney: (amount: number | string | null | undefined) => string;
    /** Just the symbol e.g. ₹ */
    symbol: string;
    currencies: CurrencyDef[];
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export const CurrencyProvider = ({ children, clinicId }: { children: React.ReactNode; clinicId?: number | string }) => {
    const [currency, setCurrency] = useState<CurrencyDef>(() => loadCurrency(clinicId));

    // Re-read from storage if clinicId changes (e.g. after login)
    useEffect(() => {
        setCurrency(loadCurrency(clinicId));
    }, [clinicId]);

    const setCurrencyCode = useCallback((code: string) => {
        const found = CURRENCIES.find(c => c.code === code);
        if (!found) return;
        setCurrency(found);
        saveCurrency(code, clinicId);
    }, [clinicId]);

    const formatMoney = useCallback((amount: number | string | null | undefined): string => {
        const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
        if (isNaN(num)) return `${currency.symbol}0`;
        try {
            return new Intl.NumberFormat(currency.locale, {
                style: 'currency',
                currency: currency.code,
                minimumFractionDigits: currency.decimals,
                maximumFractionDigits: currency.decimals,
            }).format(num);
        } catch {
            // Fallback: manual format
            const fixed = num.toFixed(currency.decimals);
            const [int, dec] = fixed.split('.');
            const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return currency.decimals > 0
                ? `${currency.symbol}${intFormatted}.${dec}`
                : `${currency.symbol}${intFormatted}`;
        }
    }, [currency]);

    return (
        <CurrencyContext.Provider value={{ currency, setCurrencyCode, formatMoney, symbol: currency.symbol, currencies: CURRENCIES }}>
            {children}
        </CurrencyContext.Provider>
    );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useCurrency = (): CurrencyContextType => {
    const ctx = useContext(CurrencyContext);
    if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
    return ctx;
};
