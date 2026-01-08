import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, Eye, EyeOff, Save } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const stored = localStorage.getItem('gemini_api_key');
            if (stored) setApiKey(stored);
            setSaved(false);
        }
    }, [isOpen]);

    const handleSave = () => {
        if (apiKey.trim()) {
            localStorage.setItem('gemini_api_key', apiKey.trim());
            setSaved(true);
            setTimeout(() => {
                onClose();
                window.location.reload(); // Reload to pick up the new key in services
            }, 1000);
        } else {
            localStorage.removeItem('gemini_api_key');
            setSaved(true);
            setTimeout(() => onClose(), 1000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Key className="text-indigo-500" size={20} />
                        API Settings
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Gemini API Key</label>
                        <div className="relative">
                            <input
                                type={showKey ? "text" : "password"}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-12 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="AIzaSy..."
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    setSaved(false);
                                }}
                            />
                            <ShieldCheck className="absolute left-3 top-3.5 text-slate-500" size={18} />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-3.5 text-slate-500 hover:text-white"
                            >
                                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Your key is stored locally in your browser and never sent to our servers.
                        </p>
                    </div>

                    <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-4">
                        <h4 className="text-indigo-400 text-sm font-bold mb-1">Security Note</h4>
                        <p className="text-xs text-slate-400">
                            To prevent unauthorized usage, do not share your deployed URL if you have entered a key. For public deployments, users should enter their own keys.
                        </p>
                    </div>

                    <button
                        onClick={handleSave}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${saved ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                    >
                        {saved ? <ShieldCheck size={20} /> : <Save size={20} />}
                        {saved ? 'Saved Securely' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
