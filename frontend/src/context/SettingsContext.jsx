import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const SettingsContext = createContext(null);

// Default settings (used until API responds)
const DEFAULT_SETTINGS = {
    editor_name: 'Pro Editor',
    tagline: 'Professional Video & Photo Editing Services',
    whatsapp: '919876543210',
    instagram: 'https://instagram.com/yourprofile',
    youtube: '',
    email: 'youremail@gmail.com',
    pricing_plans: [
        {
            id: 'basic', name: 'Basic Edit', price: 499, duration: '24–48 hrs', popular: false,
            features: ['Basic cuts & transitions', 'Background music sync', 'Color correction', 'Up to 5 min video', '2 revisions'],
        },
        {
            id: 'advanced', name: 'Advanced Edit', price: 999, duration: '2–3 days', popular: true,
            features: ['Advanced cuts & effects', 'Motion graphics & titles', 'Color grading (LUT)', 'Sound design', 'Up to 15 min video', '4 revisions'],
        },
        {
            id: 'pro', name: 'Pro / Cinematic', price: 1999, duration: '3–5 days', popular: false,
            features: ['Full cinematic grade', 'Custom 2D/3D motion graphics', 'Advanced VFX compositing', 'Multi-camera edit', 'No time limit', 'Unlimited revisions'],
        },
    ],
};

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        api.get('/settings')
            .then(({ data }) => {
                if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
            })
            .catch(() => { /* Use defaults silently */ })
            .finally(() => setLoaded(true));
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, setSettings, loaded }}>
            {children}
        </SettingsContext.Provider>
    );
}

// Hook for easy consumption
export function useSettings() {
    return useContext(SettingsContext);
}
