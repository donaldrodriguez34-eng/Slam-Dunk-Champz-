import React, { useState } from 'react';
import { X, Sparkles, Check, CreditCard, ShieldCheck, Zap, Gift, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { StorePackage } from '../types';
import { POINT_PACKAGES } from '../data/initialDunks';
import { sound } from '../utils/audio';

interface PointStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchasePoints: (amount: number) => void;
  currentPoints: number;
}

export const PointStoreModal: React.FC<PointStoreModalProps> = ({
  isOpen,
  onClose,
  onPurchasePoints,
  currentPoints,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<StorePackage>(POINT_PACKAGES[1]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'google'>('card');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (code === 'SLAMDUNK50' || code === 'AIRTIME' || code === 'HOOP2026') {
      setPromoApplied(true);
      sound.playJudgeChime();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    } else {
      setPromoError('Invalid promo code. Try "SLAMDUNK50" for bonus points!');
    }
  };

  const handleBuy = () => {
    setIsProcessing(true);
    sound.playBounce();

    setTimeout(() => {
      const bonus = promoApplied ? 250 : 0;
      const totalPointsAdded = selectedPackage.points + selectedPackage.bonusPoints + bonus;
      
      onPurchasePoints(totalPointsAdded);
      sound.playCashRegister();
      sound.playCrowdCheer();

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#f97316', '#eab308', '#38bdf8', '#ffffff']
      });

      setIsProcessing(false);
      setSuccessMessage(`Successfully added +${totalPointsAdded.toLocaleString()} Dunk Points to your account!`);
      
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2200);
    }, 900);
  };

  return (
    <div id="point-store-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="point-store-modal"
        className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-orange-500/20">
              <Sparkles className="w-6 h-6 text-neutral-950 fill-neutral-950" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display tracking-wide uppercase text-white flex items-center gap-2">
                Dunk Points Locker
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Instant Credit
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400">
                Unlock legendary moves, boost contest multipliers, or fund your signature Dunk Lab creation!
              </p>
            </div>
          </div>

          <button
            id="close-store-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast Banner */}
        {successMessage && (
          <div className="bg-emerald-500 text-neutral-950 font-black px-6 py-3 text-center flex items-center justify-center gap-2 text-sm sm:text-base animate-bounce">
            <Check className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Current Balance Banner */}
          <div className="flex items-center justify-between bg-neutral-950/80 border border-neutral-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🏀</div>
              <div>
                <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Your Current Wallet</div>
                <div className="text-xl sm:text-2xl font-black font-display text-amber-400">
                  {currentPoints.toLocaleString()} Dunk Points
                </div>
              </div>
            </div>
            <div className="text-right text-xs text-neutral-400 hidden sm:block">
              <div>Secure AI Studio Locker</div>
              <div className="text-emerald-400 font-medium flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Protected Checkout
              </div>
            </div>
          </div>

          {/* Point Packages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {POINT_PACKAGES.map((pkg) => {
              const isSelected = selectedPackage.id === pkg.id;
              const totalPackagePoints = pkg.points + pkg.bonusPoints;

              return (
                <div
                  key={pkg.id}
                  id={`store-pkg-${pkg.id}`}
                  onClick={() => {
                    setSelectedPackage(pkg);
                    sound.playBounce();
                  }}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-neutral-800/90 border-orange-500 shadow-xl shadow-orange-500/15 scale-[1.02]'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 font-black text-[10px] uppercase px-3 py-0.5 rounded-full shadow-md tracking-wider">
                      Most Popular
                    </div>
                  )}

                  {pkg.tag && !pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-neutral-800 text-neutral-300 font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full border border-neutral-700 tracking-wider">
                      {pkg.tag}
                    </div>
                  )}

                  <div>
                    <div className="text-center pt-2 pb-3">
                      <div className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
                        {pkg.points.toLocaleString()}
                      </div>
                      {pkg.bonusPoints > 0 && (
                        <div className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                          <Zap className="w-3 h-3 fill-amber-400" />
                          +{pkg.bonusPoints} FREE BONUS
                        </div>
                      )}
                      <div className="text-xs text-neutral-400 mt-1 uppercase font-semibold">
                        Total {totalPackagePoints.toLocaleString()} PTS
                      </div>
                    </div>

                    <div className="h-px bg-neutral-800 my-3" />

                    <ul className="space-y-2 text-xs text-neutral-300 mb-4">
                      {pkg.perks.map((perk, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <button
                      className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 font-black shadow-md'
                          : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                      }`}
                    >
                      ${pkg.priceUsd.toFixed(2)} USD
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Promo Code & Payment Options Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            
            {/* Promo Code Box */}
            <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800 flex flex-col justify-between">
              <div>
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mb-1.5">
                  <Gift className="w-3.5 h-3.5 text-amber-400" />
                  Have a Dunk Code? (Try "SLAMDUNK50")
                </label>
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    id="promo-code-input"
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter SLAMDUNK50"
                    disabled={promoApplied}
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 uppercase font-mono tracking-wider"
                  />
                  <button
                    type="submit"
                    id="apply-promo-btn"
                    disabled={promoApplied || !promoCode.trim()}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                  >
                    {promoApplied ? 'Applied ✓' : 'Apply'}
                  </button>
                </form>
              </div>

              {promoApplied && (
                <p className="text-xs text-emerald-400 font-semibold mt-2 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Code activated! +250 Bonus Points will be credited.
                </p>
              )}
              {promoError && (
                <p className="text-xs text-rose-400 font-semibold mt-2">
                  {promoError}
                </p>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800">
              <label className="text-xs font-semibold text-neutral-300 block mb-2">
                Simulated Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  id="pay-method-card"
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-neutral-800 border-orange-500 text-white shadow-sm'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-orange-400" />
                  <span>Card</span>
                </button>

                <button
                  id="pay-method-apple"
                  type="button"
                  onClick={() => setPaymentMethod('apple')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'apple'
                      ? 'bg-neutral-800 border-orange-500 text-white shadow-sm'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span> Pay</span>
                </button>

                <button
                  id="pay-method-google"
                  type="button"
                  onClick={() => setPaymentMethod('google')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'google'
                      ? 'bg-neutral-800 border-orange-500 text-white shadow-sm'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>G Pay</span>
                </button>
              </div>

              <div className="mt-3 text-[11px] text-neutral-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Sandbox secure mode: instantly credits points without actual charge.</span>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer / Checkout CTA */}
        <div className="p-4 sm:p-6 bg-neutral-950 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="text-xs text-neutral-400">Total Purchase</div>
            <div className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-2xl font-black font-display text-orange-400">
                ${selectedPackage.priceUsd.toFixed(2)}
              </span>
              <span className="text-xs text-neutral-400 font-normal">
                for {(selectedPackage.points + selectedPackage.bonusPoints + (promoApplied ? 250 : 0)).toLocaleString()} Points
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id="cancel-store-btn"
              onClick={onClose}
              className="w-1/3 sm:w-auto px-5 py-3 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-sm font-bold transition-colors"
            >
              Cancel
            </button>

            <button
              id="confirm-buy-btn"
              disabled={isProcessing}
              onClick={handleBuy}
              className="w-2/3 sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-neutral-950 font-black text-sm sm:text-base tracking-wide uppercase shadow-lg shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Adding Points...</span>
              ) : (
                <>
                  <span>Unlock {selectedPackage.points.toLocaleString()} PTS</span>
                  <ArrowRight className="w-4 h-4 text-neutral-950" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
