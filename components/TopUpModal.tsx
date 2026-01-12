import React, { useState } from 'react';
import { X, Check, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

interface PricingTier {
    id: string;
    credits: number;
    price: number;
    labelEn?: string;
    labelCn?: string;
    isPopular?: boolean;
}

const TIERS: PricingTier[] = [
    { id: 'tier_basic', credits: 10, price: 4.90 },
    { id: 'tier_standard', credits: 50, price: 19.90, labelEn: 'Save 18%', labelCn: '省 18%' },
    { id: 'tier_pro', credits: 100, price: 34.90, labelEn: 'Save 30%', labelCn: '省 30%', isPopular: true },
];

interface TopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    lang: 'en' | 'cn';
}

const translations = {
    en: {
        title: "Get Credits",
        subtitle: "Purchase credits to continue your analysis.",
        bestValue: "BEST VALUE",
        credits: "CREDITS",
        pay: "Pay",
        secure: "Secured by Stripe SSL. Non-refundable.",
        paymentMethod: "Secure Payment via Stripe"
    },
    cn: {
        title: "获取积分",
        subtitle: "购买积分以继续使用 SEO 分析工具。",
        bestValue: "最超值",
        credits: "积分",
        pay: "支付",
        secure: "Stripe SSL 安全支付。虚拟商品概不退款。",
        paymentMethod: "安全支付"
    }
};

const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, lang }) => {
    const [selectedTier, setSelectedTier] = useState<string>('tier_pro');
    const [loading, setLoading] = useState(false);
    const { getToken } = useAuth();

    const t = translations[lang];

    if (!isOpen) return null;

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            if (!backendUrl) {
                alert("Backend not configured");
                return;
            }

            // Call backend to create Stripe Session
            const res = await fetch(`${backendUrl}/api/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ packageId: selectedTier })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to initiate checkout");
            }

            const { url } = await res.json();
            // Redirect to Stripe
            window.location.href = url;
        } catch (e: any) {
            console.error(e);
            alert("Payment initiation failed: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const currentTier = TIERS.find(t => t.id === selectedTier)!;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="relative p-6 border-b border-slate-100">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <h2 className="text-2xl font-bold text-slate-900">{t.title}</h2>
                    <p className="text-slate-500 mt-1">{t.subtitle}</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Tiers Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        {TIERS.map((tier) => (
                            <button
                                key={tier.id}
                                onClick={() => setSelectedTier(tier.id)}
                                className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 h-32
                  ${selectedTier === tier.id
                                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                    }
                `}
                            >
                                {tier.isPopular && (
                                    <div className="absolute -top-3 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        {t.bestValue}
                                    </div>
                                )}

                                <span className="text-2xl font-black text-slate-900">{tier.credits}</span>
                                <span className="text-xs font-bold text-slate-500 uppercase mb-1">{t.credits}</span>
                                <span className="text-lg font-bold text-indigo-600">${tier.price.toFixed(2)}</span>

                                {(lang === 'cn' ? tier.labelCn : tier.labelEn) && (
                                    <span className="mt-1 text-[10px] font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                                        {lang === 'cn' ? tier.labelCn : tier.labelEn}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Payment Method Preview */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                        <div className="flex items-center gap-3 text-slate-600 mb-2">
                            <CreditCard size={16} />
                            <span className="text-sm font-medium">{t.paymentMethod}</span>
                        </div>
                        <div className="flex gap-2 opacity-50">
                            {/* Simple visual placeholders for card logos */}
                            <div className="h-6 w-10 bg-slate-200 rounded"></div>
                            <div className="h-6 w-10 bg-slate-200 rounded"></div>
                            <div className="h-6 w-10 bg-slate-200 rounded"></div>
                        </div>
                    </div>

                    {/* Pay Button */}
                    <button
                        onClick={handleCheckout}
                        disabled={loading}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg py-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            `${t.pay} $${currentTier.price.toFixed(2)}`
                        )}
                    </button>

                    <p className="text-center text-xs text-slate-400">
                        {t.secure}
                    </p>

                </div>
            </div>
        </div>
    );
};

export default TopUpModal;
