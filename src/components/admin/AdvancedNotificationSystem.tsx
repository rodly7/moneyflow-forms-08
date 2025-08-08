
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, Bell, Users, MessageSquare, 
  AlertTriangle, CheckCircle, Clock,
  Target, Zap, Settings
} from 'lucide-react';
import { useAdvancedAdmin } from '@/hooks/useAdvancedAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  category: string;
}

interface User {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  country: string;
}

const AdvancedNotificationSystem = () => {
  const { sendTargetedNotification, isProcessing } = useAdvancedAdmin();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
    targetRole: 'all',
    targetCountry: 'all',
    scheduleTime: '',
    template: ''
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    message: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
    category: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les utilisateurs
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role, country')
        .order('full_name');

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Charger les templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('notification_templates')
        .select('*')
        .order('name');

      if (!templatesError && templatesData) {
        setTemplates(templatesData);
      }
    } catch (error: any) {
      console.error('Erreur chargement données:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    let filtered = users;

    if (notificationForm.targetRole !== 'all') {
      filtered = filtered.filter(u => u.role === notificationForm.targetRole);
    }

    if (notificationForm.targetCountry !== 'all') {
      filtered = filtered.filter(u => u.country === notificationForm.targetCountry);
    }

    return filtered;
  };

  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le titre et le message",
        variant: "destructive"
      });
      return;
    }

    let recipients = selectedUsers;
    
    // Si aucun utilisateur spécifique n'est sélectionné, utiliser les filtres
    if (recipients.length === 0) {
      recipients = getFilteredUsers().map(u => u.id);
    }

    if (recipients.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun destinataire sélectionné",
        variant: "destructive"
      });
      return;
    }

    const result = await sendTargetedNotification(
      recipients,
      notificationForm.title,
      notificationForm.message,
      notificationForm.priority
    );

    if (result.success) {
      setNotificationForm({
        title: '',
        message: '',
        priority: 'normal',
        targetRole: 'all',
        targetCountry: 'all',
        scheduleTime: '',
        template: ''
      });
      setSelectedUsers([]);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.title || !templateForm.message) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs du template",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('notification_templates')
        .insert({
          name: templateForm.name,
          title: templateForm.title,
          message: templateForm.message,
          priority: templateForm.priority,
          category: templateForm.category
        });

      if (error) throw error;

      setTemplateForm({
        name: '',
        title: '',
        message: '',
        priority: 'normal',
        category: ''
      });

      loadData(); // Recharger les templates

      toast({
        title: "Template sauvegardé",
        description: "Le template a été sauvegardé avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde du template",
        variant: "destructive"
      });
    }
  };

  const loadTemplate = (template: NotificationTemplate) => {
    setNotificationForm(prev => ({
      ...prev,
      title: template.title,
      message: template.message,
      priority: template.priority,
      template: template.id
    }));
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      low: { color: 'bg-gray-500', label: 'Faible' },
      normal: { color: 'bg-blue-500', label: 'Normale' },
      high: { color: 'bg-red-500', label: 'Élevée' }
    };
    const { color, label } = config[priority as keyof typeof config];
    return <Badge className={`${color} text-white`}>{label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredUsers = getFilteredUsers();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Système de Notifications Avancé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="send" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="send">Envoyer</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="send" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulaire d'envoi */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nouvelle Notification</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Template (optionnel)</Label>
                      <Select
                        value={notificationForm.template}
                        onValueChange={(value) => {
                          const template = templates.find(t => t.id === value);
                          if (template) loadTemplate(template);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Titre *</Label>
                      <Input
                        placeholder="Titre de la notification"
                        value={notificationForm.title}
                        onChange={(e) => setNotificationForm(prev => ({ 
                          ...prev, title: e.target.value 
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Message *</Label>
                      <Textarea
                        placeholder="Contenu de la notification"
                        value={notificationForm.message}
                        onChange={(e) => setNotificationForm(prev => ({ 
                          ...prev, message: e.target.value 
                        }))}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Priorité</Label>
                      <Select
                        value={notificationForm.priority}
                        onValueChange={(value: 'low' | 'normal' | 'high') => 
                          setNotificationForm(prev => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Faible</SelectItem>
                          <SelectItem value="normal">Normale</SelectItem>
                          <SelectItem value="high">Élevée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleSendNotification}
                      disabled={isProcessing}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer la Notification
                    </Button>
                  </CardContent>
                </Card>

                {/* Ciblage des destinataires */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Ciblage des Destinataires
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Rôle cible</Label>
                        <Select
                          value={notificationForm.targetRole}
                          onValueChange={(value) => setNotificationForm(prev => ({ 
                            ...prev, targetRole: value 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les rôles</SelectItem>
                            <SelectItem value="user">Utilisateurs</SelectItem>
                            <SelectItem value="agent">Agents</SelectItem>
                            <SelectItem value="admin">Administrateurs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Pays cible</Label>
                        <Select
                          value={notificationForm.targetCountry}
                          onValueChange={(value) => setNotificationForm(prev => ({ 
                            ...prev, targetCountry: value 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les pays</SelectItem>
                            <SelectItem value="Congo Brazzaville">Congo Brazzaville</SelectItem>
                            <SelectItem value="Cameroun">Cameroun</SelectItem>
                            <SelectItem value="France">France</SelectItem>
                            <SelectItem value="Canada">Canada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Utilisateurs ciblés ({filteredUsers.length})</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const allIds = filteredUsers.map(u => u.id);
                            setSelectedUsers(selectedUsers.length === allIds.length ? [] : allIds);
                          }}
                        >
                          {selectedUsers.length === filteredUsers.length ? 'Tout déselectionner' : 'Tout sélectionner'}
                        </Button>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-2 border rounded p-2">
                        {filteredUsers.map((user) => (
                          <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedUsers([...selectedUsers, user.id]);
                                } else {
                                  setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{user.full_name}</p>
                              <p className="text-xs text-gray-600">
                                {user.role} • {user.country}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="text-sm text-gray-600">
                        {selectedUsers.length > 0 ? (
                          <p>✅ {selectedUsers.length} utilisateur(s) sélectionné(s)</p>
                        ) : (
                          <p>📤 Envoi vers tous les utilisateurs ciblés ({filteredUsers.length})</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Nouveau template */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Créer un Template</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nom du template *</Label>
                      <Input
                        placeholder="Ex: Bienvenue agent"
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm(prev => ({ 
                          ...prev, name: e.target.value 
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <Input
                        placeholder="Ex: Bienvenue, Alerte, Information"
                        value={templateForm.category}
                        onChange={(e) => setTemplateForm(prev => ({ 
                          ...prev, category: e.target.value 
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Titre *</Label>
                      <Input
                        placeholder="Titre de la notification"
                        value={templateForm.title}
                        onChange={(e) => setTemplateForm(prev => ({ 
                          ...prev, title: e.target.value 
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Message *</Label>
                      <Textarea
                        placeholder="Contenu du message"
                        value={templateForm.message}
                        onChange={(e) => setTemplateForm(prev => ({ 
                          ...prev, message: e.target.value 
                        }))}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Priorité par défaut</Label>
                      <Select
                        value={templateForm.priority}
                        onValueChange={(value: 'low' | 'normal' | 'high') => 
                          setTemplateForm(prev => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Faible</SelectItem>
                          <SelectItem value="normal">Normale</SelectItem>
                          <SelectItem value="high">Élevée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleSaveTemplate}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Sauvegarder le Template
                    </Button>
                  </CardContent>
                </Card>

                {/* Liste des templates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Templates Existants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {templates.map((template) => (
                        <div key={template.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{template.name}</h4>
                              {template.category && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {template.category}
                                </Badge>
                              )}
                            </div>
                            {getPriorityBadge(template.priority)}
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {template.title}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {template.message}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 w-full"
                            onClick={() => loadTemplate(template)}
                          >
                            <Zap className="w-4 h-4 mr-1" />
                            Utiliser
                          </Button>
                        </div>
                      ))}

                      {templates.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>Aucun template créé</p>
                          <p className="text-sm text-gray-400">
                            Créez votre premier template pour gagner du temps
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historique des Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Historique des notifications</p>
                    <p className="text-sm text-gray-400">
                      Cette section affichera l'historique complet des notifications envoyées
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedNotificationSystem;
