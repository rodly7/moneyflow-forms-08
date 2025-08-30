
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { countries } from '@/data/countries';
import { toast } from 'sonner';


interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

const SignUpForm = ({ onSwitchToLogin }: SignUpFormProps) => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: '',
    city: '',
    role: 'user',
    birthDate: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedCountry = countries.find(c => c.name === formData.country);
  const phonePrefix = selectedCountry ? selectedCountry.code : '';
  
  const handlePhoneChange = (value: string) => {
    // Remove any existing prefix to avoid duplication
    let cleanPhone = value;
    if (phonePrefix && value.startsWith(phonePrefix)) {
      cleanPhone = value.substring(phonePrefix.length).trim();
    }
    setFormData(prev => ({ ...prev, phone: cleanPhone }));
  };

  const handleCountryChange = (countryName: string) => {
    setFormData(prev => ({ 
      ...prev, 
      country: countryName,
      city: '', // Reset city when country changes
      phone: '' // Reset phone when country changes
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }


    setIsLoading(true);

    try {
      // Combine country code with phone number
      const fullPhoneNumber = phonePrefix + ' ' + formData.phone;
      
      const metadata = {
        full_name: formData.fullName,
        phone: fullPhoneNumber,
        country: formData.country,
        address: formData.city, // Using city as address
        role: formData.role,
        birth_date: formData.birthDate,
        
      };

      await signUp(formData.phone, formData.password, metadata);
      
      toast.success('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <img 
            src="/icons/icon-192x192.png" 
            alt="SendFlow Logo" 
            className="h-20 w-20 rounded-2xl shadow-lg"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet *</Label>
          <Input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">Date de naissance *</Label>
          <Input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleInputChange('birthDate', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Pays *</Label>
          <Select value={formData.country} onValueChange={handleCountryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez votre pays" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.name}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ville *</Label>
          <Select 
            value={formData.city} 
            onValueChange={(value) => handleInputChange('city', value)}
            disabled={!formData.country}
          >
            <SelectTrigger>
              <SelectValue placeholder={formData.country ? "Sélectionnez votre ville" : "Sélectionnez d'abord un pays"} />
            </SelectTrigger>
            <SelectContent>
              {selectedCountry?.cities.map((city) => (
                <SelectItem key={city.name} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Numéro de téléphone *</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={phonePrefix}
              disabled
              className="w-20 bg-gray-100"
            />
            <Input
              id="phone"
              type="tel"
              placeholder="XX XXX XX XX"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              disabled={!formData.country}
              required
              className="flex-1"
            />
          </div>
        </div>


        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? 'Inscription...' : 'S\'inscrire'}
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm text-blue-600 hover:underline"
        >
          Déjà un compte ? Se connecter
        </button>
      </div>
    </div>
  );
};

export default SignUpForm;
