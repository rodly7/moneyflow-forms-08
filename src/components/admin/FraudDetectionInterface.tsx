import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Shield, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  User,
  FileText,
  Calendar,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

interface UserForVerification {
  id: string;
  full_name: string;
  phone: string;
  country: string;
  address: string;
  birth_date: string;
  id_card_photo_url: string;
  avatar_url: string;
  is_verified: boolean;
  created_at: string;
  role: string;
  balance: number;
}

export const FraudDetectionInterface = () => {
  const [users, setUsers] = useState<UserForVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserForVerification | null>(null);
  const [fraudNotes, setFraudNotes] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const markAsSuspicious = async (userId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_banned: true,
          banned_reason: `Fraude détectée: ${notes}`,
          banned_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success('Utilisateur marqué comme suspect');
      loadUsers();
      setSelectedUser(null);
      setFraudNotes('');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const verifyUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success('Utilisateur vérifié avec succès');
      loadUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la vérification');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  const suspiciousUsers = filteredUsers.filter(user => 
    !user.is_verified || (!user.is_verified && (user.id_card_photo_url || user.avatar_url))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-red-500" />
          <h2 className="text-2xl font-bold">Détection de Fraude</h2>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {suspiciousUsers.length} à vérifier
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Rechercher des utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Rechercher par nom ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {suspiciousUsers.map((user) => (
          <Card key={user.id} className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      <h3 className="font-semibold text-lg">{user.full_name || 'Nom non défini'}</h3>
                    </div>
                    <Badge variant={user.is_verified ? "default" : "secondary"}>
                      {user.is_verified ? 'Vérifié' : 'Non vérifié'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{user.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{user.country || 'Non défini'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {user.birth_date ? new Date(user.birth_date).toLocaleDateString('fr-FR') : 'Non définie'}
                      </span>
                    </div>
                    <div className="text-green-600 font-semibold">
                      Solde: {user.balance.toLocaleString()} XAF
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {user.avatar_url && (
                      <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">Photo de profil</div>
                        <img 
                          src={user.avatar_url} 
                          alt="Photo de profil" 
                          className="w-16 h-16 object-cover rounded-full border-2 border-gray-300"
                        />
                      </div>
                    )}
                    
                    {user.id_card_photo_url && (
                      <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">Pièce d'identité</div>
                        <img 
                          src={user.id_card_photo_url} 
                          alt="Pièce d'identité" 
                          className="w-20 h-16 object-cover rounded border-2 border-gray-300"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Examiner
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          Vérification d'identité - {user.full_name}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Informations du profil</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div><strong>Nom:</strong> {user.full_name}</div>
                              <div><strong>Téléphone:</strong> {user.phone}</div>
                              <div><strong>Pays:</strong> {user.country}</div>
                              <div><strong>Adresse:</strong> {user.address}</div>
                              <div><strong>Date de naissance:</strong> {user.birth_date ? new Date(user.birth_date).toLocaleDateString('fr-FR') : 'Non définie'}</div>
                              <div><strong>Solde:</strong> {user.balance.toLocaleString()} XAF</div>
                              <div><strong>Membre depuis:</strong> {new Date(user.created_at).toLocaleDateString('fr-FR')}</div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Photos à vérifier</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {user.avatar_url && (
                                <div>
                                  <div className="text-sm font-medium mb-2">Photo de profil</div>
                                  <img 
                                    src={user.avatar_url} 
                                    alt="Photo de profil" 
                                    className="w-full max-w-48 h-48 object-cover rounded border cursor-pointer"
                                    onClick={() => window.open(user.avatar_url, '_blank')}
                                  />
                                </div>
                              )}
                              
                              {user.id_card_photo_url && (
                                <div>
                                  <div className="text-sm font-medium mb-2">Pièce d'identité</div>
                                  <img 
                                    src={user.id_card_photo_url} 
                                    alt="Pièce d'identité" 
                                    className="w-full max-w-64 h-48 object-cover rounded border cursor-pointer"
                                    onClick={() => window.open(user.id_card_photo_url, '_blank')}
                                  />
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>

                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Points à vérifier:</strong>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Le nom sur la pièce d'identité correspond-il au nom du profil?</li>
                              <li>La photo de la pièce d'identité correspond-elle à la photo de profil?</li>
                              <li>La date de naissance est-elle cohérente?</li>
                              <li>L'adresse correspond-elle au pays indiqué?</li>
                              <li>La qualité des photos semble-t-elle authentique?</li>
                            </ul>
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Notes sur la vérification:</label>
                            <textarea
                              className="w-full p-3 border rounded-md mt-1"
                              rows={3}
                              placeholder="Notez vos observations..."
                              value={fraudNotes}
                              onChange={(e) => setFraudNotes(e.target.value)}
                            />
                          </div>

                          <div className="flex justify-end gap-3">
                            <Button
                              variant="destructive"
                              onClick={() => markAsSuspicious(user.id, fraudNotes)}
                              disabled={!fraudNotes.trim()}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Marquer comme suspect
                            </Button>
                            <Button
                              onClick={() => verifyUser(user.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approuver l'identité
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {suspiciousUsers.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">Aucune vérification en attente</h3>
              <p className="text-muted-foreground">
                Tous les utilisateurs avec des documents ont été vérifiés.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};