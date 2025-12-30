
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

export type Settings = {
    "expenses-chart": boolean;
    "accounts": boolean;
    "pending-transactions": boolean;
    "budget-summary": boolean;
    "goals": boolean;
    "income-chart": boolean;
    "monthly-balance-chart": boolean;
    "credit-card-info": boolean;
}

export const initialSettings: Settings = {
    "expenses-chart": true,
    "accounts": true,
    "pending-transactions": true,
    "budget-summary": true,
    "goals": true,
    "income-chart": false,
    "monthly-balance-chart": false,
    "credit-card-info": false,
};

type SettingsContextType = {
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
};

export const SettingsContext = createContext<SettingsContextType>({
    settings: initialSettings,
    setSettings: () => {},
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<Settings>(initialSettings);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('dashboardSettings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                // Ensure all keys from initialSettings are present
                const validatedSettings = { ...initialSettings, ...parsedSettings };
                setSettings(validatedSettings);
            }
        } catch (error) {
            console.error("Failed to load settings from localStorage", error);
            setSettings(initialSettings);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem('dashboardSettings', JSON.stringify(settings));
            } catch (error) {
                console.error("Failed to save settings to localStorage", error);
            }
        }
    }, [settings, isLoaded]);

    return (
        <SettingsContext.Provider value={{ settings, setSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
