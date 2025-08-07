import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SimpleInternationalDepositFormProps {
  targetUserId: string;
  targetUserName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const currencies = [
  { code: 'XAF', name: 'Franc CFA', flag: '🇨🇲' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'USD', name: 'Dollar US', flag: '🇺🇸' },
  { code: 'GBP', name: 'Livre Sterling', flag: '🇬🇧' },
  { code: 'CAD', name: 'Dollar Canadien', flag: '🇨🇦' },
  { code: 'CHF', name: 'Franc Suisse', flag: '🇨🇭' },
];

const SimpleInternationalDepositForm = ({ targetUserId, targetUserName, onSuccess, onCancel }: SimpleInternationalDepositFormProps) => {
  const [amount, setAmount] = useState('');
  const [sourceCurrency, setSourceCurrency] = useState('EUR');
  const [targetCurrency, setTargetCurrency] = useState('XAF');
  const [exchangeRate, setExchangeRate] = useState('655.957');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const convertedAmount = parseFloat(amount || '0') * parseFloat(exchangeRate || '1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setMessage('Veuillez saisir un montant valide');
      return;
    }

    setIsLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.rpc('process_international_deposit', {
        target_user_id: targetUserId,
        deposit_amount: parseFloat(amount),
        deposit_currency: sourceCurrency,
        target_currency: targetCurrency,
        exchange_rate: parseFloat(exchangeRate),
        reference_number: reference || null,
        notes: notes || null
      });

      if (error) throw error;

      setMessage(`Dépôt de ${convertedAmount.toFixed(2)} ${targetCurrency} effectué avec succès`);
      
      // Reset form
      setAmount('');
      setReference('');
      setNotes('');
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error('Erreur dépôt international:', error);
      setMessage('Erreur lors du dépôt international');
    }
    setIsLoading(false);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        width: '90%', 
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
          🌍 Dépôt International - {targetUserName}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Devise source
              </label>
              <select 
                value={sourceCurrency} 
                onChange={(e) => setSourceCurrency(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.flag} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Devise cible
              </label>
              <select 
                value={targetCurrency} 
                onChange={(e) => setTargetCurrency(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.flag} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Montant ({sourceCurrency})
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Taux de change
              </label>
              <input
                type="number"
                step="0.000001"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="1.0"
                required
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {amount && exchangeRate && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f3f4f6', 
              borderRadius: '6px', 
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '14px' }}>
                💰 {amount} {sourceCurrency} → <strong>{convertedAmount.toFixed(2)} {targetCurrency}</strong>
              </span>
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Référence (optionnel)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Numéro de référence"
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ccc', 
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes sur la transaction..."
              rows={3}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ccc', 
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          {message && (
            <div style={{ 
              padding: '10px', 
              marginBottom: '15px', 
              borderRadius: '4px',
              backgroundColor: message.includes('succès') ? '#dcfce7' : '#fecaca',
              color: message.includes('succès') ? '#166534' : '#dc2626',
              fontSize: '14px'
            }}>
              {message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{ 
                padding: '10px 20px', 
                border: '1px solid #ccc', 
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{ 
                padding: '10px 20px', 
                border: 'none', 
                borderRadius: '4px',
                backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {isLoading ? "Traitement..." : "Effectuer le dépôt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleInternationalDepositForm;