import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Phone, MapPin, Clock, Contact2 } from "lucide-react";
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
  const [hasContactsPermission, setHasContactsPermission] = useState(false);

  // Fonction pour importer contacts via fichier
  const importContactsFromFile = () => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.vcf,.csv';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            const contacts = parseContactsFile(content, file.type);
            resolve(contacts);
          };
          reader.readAsText(file);
        } else {
          resolve([]);
        }
      };
      input.click();
    });
  };

  // Fonction pour parser le fichier de contacts
  const parseContactsFile = (content: string, fileType: string) => {
    const contacts: any[] = [];
    
    if (fileType.includes('vcf') || content.includes('BEGIN:VCARD')) {
      // Parser VCF
      const vcards = content.split('BEGIN:VCARD');
      vcards.forEach(vcard => {
        if (vcard.includes('FN:') && vcard.includes('TEL:')) {
          const nameMatch = vcard.match(/FN:(.*)/);
          const telMatch = vcard.match(/TEL[^:]*:(.*)/);
          if (nameMatch && telMatch) {
            contacts.push({
              name: [nameMatch[1].trim()],
              tel: [telMatch[1].trim()]
            });
          }
        }
      });
    }
    
    return contacts;
  };

  // Fonction pour demander l'accès aux contacts
  const requestContactsAccess = async () => {
    try {
      // 1. Essayer l'API Contacts native (très limitée)
      if ('contacts' in navigator && 'ContactsManager' in window) {
        console.log("📱 API Contacts disponible, demande d'accès...");
        try {
          const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: true });
          if (contacts && contacts.length > 0) {
            return contacts;
          }
        } catch (error) {
          console.log("❌ API Contacts échouée:", error);
        }
      }
      
      // 2. Fallback: importer depuis un fichier
      console.log("📱 Ouverture de l'importation de fichier...");
      const contacts = await importContactsFromFile();
      return contacts;
      
    } catch (error) {
      console.error("❌ Erreur lors de l'accès aux contacts:", error);
      return null;
    }
  };

  // Fonction pour normaliser les numéros de téléphone
  const normalizePhoneNumber = (phone: string): string => {
    return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
  };

  // Fonction pour récupérer les contacts du téléphone et vérifier lesquels ont un compte
  const fetchPhoneContacts = async () => {
    if (!selectedCountry || !profile?.id) return;

    setLoading(true);
    try {
      console.log("📱 Demande d'accès aux contacts du téléphone...");

      // Demander l'accès aux contacts
      const phoneContacts = await requestContactsAccess();
      
      if (!phoneContacts || phoneContacts.length === 0) {
        console.log("Aucun contact trouvé ou accès refusé");
        // Fallback: afficher tous les utilisateurs du pays comme avant
        await fetchAllContacts();
        return;
      }

      console.log(`📱 ${phoneContacts.length} contacts trouvés dans le téléphone`);

      // Extraire les numéros de téléphone des contacts
      const phoneNumbers = phoneContacts
        .filter((contact: any) => contact.tel && contact.tel.length > 0)
        .map((contact: any) => normalizePhoneNumber(contact.tel[0]))
        .filter((phone: string) => phone.length >= 8);

      if (phoneNumbers.length === 0) {
        console.log("Aucun numéro de téléphone valide trouvé");
        await fetchAllContacts();
        return;
      }

      console.log(`🔍 Vérification de ${phoneNumbers.length} numéros dans la base de données...`);

      // Vérifier quels contacts ont un compte dans la base de données
      const { data: existingUsers, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, country, avatar_url, balance, created_at')
        .eq('country', selectedCountry)
        .neq('id', profile.id)
        .in('phone', phoneNumbers.map(phone => `+${phone}`)); // Ajouter le préfixe +

      if (error) {
        console.error("❌ Erreur lors de la vérification des contacts:", error);
        return;
      }

      console.log(`✅ ${existingUsers?.length || 0} contacts trouvés avec un compte`);
      setContacts(existingUsers || []);
      setHasContactsPermission(true);
    } catch (error) {
      console.error("❌ Erreur:", error);
      // En cas d'erreur, utiliser la méthode de fallback
      await fetchAllContacts();
    } finally {
      setLoading(false);
    }
  };

  // Fonction de fallback pour afficher tous les contacts du pays
  const fetchAllContacts = async () => {
    if (!selectedCountry || !profile?.id) return;

    try {
      console.log("🔍 Recherche de tous les utilisateurs du pays:", selectedCountry);
      
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

      console.log("✅ Tous les contacts trouvés:", contactsData?.length || 0);
      setContacts(contactsData || []);
    } catch (error) {
      console.error("❌ Erreur:", error);
    }
  };

  useEffect(() => {
    if (selectedCountry) {
      fetchPhoneContacts();
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
              <CardTitle className="text-sm font-semibold text-blue-900">
                Contacts disponibles
              </CardTitle>
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
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-blue-600">Recherche...</span>
          </div>
        )}

        {!loading && contacts.length === 0 && (
          <div className="text-center py-4">
            <Contact2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">
              {hasContactsPermission 
                ? "Aucun de vos contacts n'a de compte dans ce pays"
                : "Trouvez vos contacts qui ont déjà un compte"
              }
            </p>
            {!hasContactsPermission && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPhoneContacts}
                  className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  📱 Importer mes contacts
                </Button>
                <p className="text-xs text-gray-400">
                  Importez vos contacts (.vcf) pour voir lesquels ont un compte
                </p>
              </div>
            )}
          </div>
        )}

        {!loading && contacts.length > 0 && (
          <div className="space-y-2">
            {displayedContacts.map((contact, index) => (
              <div key={contact.id}>
                <div 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/80 cursor-pointer transition-all duration-200 group border border-transparent hover:border-blue-200"
                  onClick={() => onContactSelect(contact)}
                >
                  <Avatar className="h-10 w-10 border-2 border-blue-200">
                    <AvatarImage src={contact.avatar_url} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                      {getInitials(contact.full_name || "User")}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                        {contact.full_name || "Utilisateur"}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {getRelativeTime(contact.created_at)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Phone className="w-3 h-3" />
                        {formatPhone(contact.phone)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {contact.country}
                      </div>
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    variant="outline"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7 px-3 border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    Sélectionner
                  </Button>
                </div>
                {index < displayedContacts.length - 1 && (
                  <Separator className="my-2 bg-blue-100" />
                )}
              </div>
            ))}

            {contacts.length > 3 && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full text-blue-600 hover:bg-blue-50 text-xs h-8"
                >
                  {isExpanded 
                    ? `Voir moins` 
                    : `Voir ${contacts.length - 3} autres contacts`
                  }
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};