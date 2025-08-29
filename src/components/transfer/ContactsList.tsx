import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Users, Phone, MapPin, Clock, Contact2, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Contact {
  id: string;
  full_name: string;
  phone: string;
  country: string;
  avatar_url?: string;
  balance: number;
  created_at: string;
}

interface ContactsListProps {
  selectedCountry: string;
  onContactSelect: (contact: Contact) => void;
}

export const ContactsList = ({ selectedCountry, onContactSelect }: ContactsListProps) => {
  const { profile } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchPhone, setSearchPhone] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);

  // Fonction pour rechercher un contact par numéro
  const searchContactByPhone = async (phone: string) => {
    if (!phone || phone.length < 8 || !selectedCountry || !profile?.id) return;

    setLoading(true);
    try {
      console.log("🔍 Recherche du contact avec le numéro:", phone);
      
      // Normaliser le numéro (enlever espaces, tirets, etc.)
      const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
      
      // Rechercher avec et sans le préfixe +
      const phoneVariants = [
        normalizedPhone,
        `+${normalizedPhone}`,
        normalizedPhone.startsWith('+') ? normalizedPhone.substring(1) : `+${normalizedPhone}`
      ];

      const { data: foundContacts, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, country, avatar_url, balance, created_at')
        .eq('country', selectedCountry)
        .neq('id', profile.id)
        .in('phone', phoneVariants);

      if (error) {
        console.error("❌ Erreur lors de la recherche:", error);
        return;
      }

      console.log(`✅ ${foundContacts?.length || 0} contact(s) trouvé(s)`);
      setSearchResults(foundContacts || []);
    } catch (error) {
      console.error("❌ Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer tous les utilisateurs du pays
  const fetchAllContacts = async () => {
    if (!selectedCountry || !profile?.id) return;

    setLoading(true);
    try {
      console.log("🔍 Chargement des utilisateurs du pays:", selectedCountry);
      
      const { data: contactsData, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, country, avatar_url, balance, created_at')
        .eq('country', selectedCountry)
        .neq('id', profile.id)
        .order('full_name', { ascending: true })
        .limit(20);

      if (error) {
        console.error("❌ Erreur lors de la récupération des contacts:", error);
        return;
      }

      console.log("✅ Contacts chargés:", contactsData?.length || 0);
      setContacts(contactsData || []);
    } catch (error) {
      console.error("❌ Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  // Gérer la recherche en temps réel
  useEffect(() => {
    if (searchPhone.length >= 8) {
      const timeoutId = setTimeout(() => {
        searchContactByPhone(searchPhone);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchPhone, selectedCountry, profile?.id]);

  // Charger les contacts par défaut
  useEffect(() => {
    if (selectedCountry) {
      fetchAllContacts();
    }
  }, [selectedCountry, profile?.id]);

  const formatPhone = (phone: string) => {
    if (phone.length <= 8) return phone;
    return phone.slice(0, 4) + " " + phone.slice(4, 6) + " " + phone.slice(6, 8) + " " + phone.slice(8);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Aujourd'hui";
    if (diffInDays === 1) return "Hier";
    if (diffInDays < 30) return `Il y a ${diffInDays} jours`;
    if (diffInDays < 365) return `Il y a ${Math.floor(diffInDays / 30)} mois`;
    return `Il y a ${Math.floor(diffInDays / 365)} ans`;
  };

  if (!selectedCountry) return null;

  const displayedContacts = isExpanded ? contacts : contacts.slice(0, 3);

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600">
                Utilisateurs dans {selectedCountry}
              </p>
            </div>
          </div>
          {contacts.length > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {contacts.length}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Barre de recherche par numéro */}
        <div className="mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <Input
              type="tel"
              placeholder="Rechercher par numéro (ex: +221773637752)"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="pl-10 text-sm border-blue-200 focus:border-blue-400 focus:ring-blue-200"
            />
          </div>
          {searchPhone.length > 0 && searchPhone.length < 8 && (
            <p className="text-xs text-gray-500 mt-1">
              Entrez au moins 8 chiffres pour rechercher
            </p>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-blue-600">Recherche...</span>
          </div>
        )}

        {/* Résultats de recherche */}
        {searchPhone.length >= 8 && !loading && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Résultats de recherche
            </h4>
            {searchResults.length === 0 ? (
              <div className="text-center py-3 text-sm text-gray-500 bg-gray-50 rounded-lg">
                Aucun contact trouvé avec ce numéro
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((contact) => (
                  <div 
                    key={contact.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 cursor-pointer transition-all duration-200 group"
                    onClick={() => onContactSelect(contact)}
                  >
                    <Avatar className="h-10 w-10 border-2 border-green-300">
                      <AvatarImage src={contact.avatar_url} />
                      <AvatarFallback className="bg-green-100 text-green-700 text-sm font-medium">
                        {getInitials(contact.full_name || "User")}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-green-900 text-sm">
                        {contact.full_name || "Utilisateur"}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-xs text-green-700">
                          <Phone className="w-3 h-3" />
                          {formatPhone(contact.phone)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <MapPin className="w-3 h-3" />
                          {contact.country}
                        </div>
                      </div>
                    </div>

                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs h-7 px-3 border-green-300 text-green-700 hover:bg-green-100"
                    >
                      Sélectionner
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Separator className="my-4 bg-blue-100" />
          </div>
        )}

      </CardContent>
    </Card>
  );
};