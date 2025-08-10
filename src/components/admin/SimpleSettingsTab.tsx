
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description?: string;
  category: string;
}

export const SimpleSettingsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // États pour les nouveaux paramètres
  const [newSettingKey, setNewSettingKey] = useState('');
  const [newSettingValue, setNewSettingValue] = useState('');
  const [newSettingDescription, setNewSettingDescription] = useState('');
  const [newSettingCategory, setNewSettingCategory] = useState('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('setting_key', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres système",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingId: string, newValue: string) => {
    setSaving(settingId);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: newValue })
        .eq('id', settingId);

      if (error) throw error;

      setSettings(prev => 
        prev.map(setting => 
          setting.id === settingId 
            ? { ...setting, setting_value: newValue }
            : setting
        )
      );

      toast({
        title: "Paramètre mis à jour",
        description: "Le paramètre a été modifié avec succès",
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le paramètre",
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };

  const createSetting = async () => {
    if (!newSettingKey || !newSettingValue) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir au moins la clé et la valeur",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .insert({
          setting_key: newSettingKey,
          setting_value: newSettingValue,
          description: newSettingDescription || null,
          category: newSettingCategory
        })
        .select()
        .single();

      if (error) throw error;

      setSettings(prev => [...prev, data]);
      
      // Reset form
      setNewSettingKey('');
      setNewSettingValue('');
      setNewSettingDescription('');
      setNewSettingCategory('general');

      toast({
        title: "Paramètre créé",
        description: "Le nouveau paramètre a été ajouté avec succès",
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le paramètre",
        variant: "destructive"
      });
    }
  };

  const deleteSetting = async (settingId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paramètre ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('system_settings')
        .delete()
        .eq('id', settingId);

      if (error) throw error;

      setSettings(prev => prev.filter(setting => setting.id !== settingId));

      toast({
        title: "Paramètre supprimé",
        description: "Le paramètre a été supprimé avec succès",
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le paramètre",
        variant: "destructive"
      });
    }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Chargement des paramètres...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '30px', fontSize: '24px', fontWeight: 'bold' }}>
        Paramètres Système
      </h2>

      {/* Formulaire d'ajout de nouveau paramètre */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px' 
      }}>
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
          Ajouter un nouveau paramètre
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Clé du paramètre:
            </label>
            <input
              type="text"
              value={newSettingKey}
              onChange={(e) => setNewSettingKey(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              placeholder="ex: max_transfer_amount"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Valeur:
            </label>
            <input
              type="text"
              value={newSettingValue}
              onChange={(e) => setNewSettingValue(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              placeholder="ex: 1000000"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Catégorie:
            </label>
            <select
              value={newSettingCategory}
              onChange={(e) => setNewSettingCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="general">Général</option>
              <option value="limits">Limites</option>
              <option value="fees">Frais</option>
              <option value="security">Sécurité</option>
              <option value="notifications">Notifications</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Description:
            </label>
            <input
              type="text"
              value={newSettingDescription}
              onChange={(e) => setNewSettingDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              placeholder="Description du paramètre"
            />
          </div>
        </div>

        <button
          onClick={createSetting}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Ajouter le paramètre
        </button>
      </div>

      {/* Liste des paramètres par catégorie */}
      {Object.entries(groupedSettings).map(([category, categorySettings]) => (
        <div key={category} style={{ marginBottom: '30px' }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            marginBottom: '15px',
            textTransform: 'capitalize',
            color: '#495057'
          }}>
            {category}
          </h3>
          
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {categorySettings.map((setting) => (
              <div 
                key={setting.id}
                style={{
                  padding: '20px',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: '1' }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '5px',
                    fontSize: '16px'
                  }}>
                    {setting.setting_key}
                  </div>
                  {setting.description && (
                    <div style={{ 
                      color: '#666', 
                      fontSize: '14px',
                      marginBottom: '10px'
                    }}>
                      {setting.description}
                    </div>
                  )}
                  <input
                    type="text"
                    value={setting.setting_value}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setSettings(prev => 
                        prev.map(s => 
                          s.id === setting.id 
                            ? { ...s, setting_value: newValue }
                            : s
                        )
                      );
                    }}
                    onBlur={(e) => updateSetting(setting.id, e.target.value)}
                    disabled={saving === setting.id}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      width: '300px',
                      opacity: saving === setting.id ? 0.7 : 1
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {saving === setting.id && (
                    <span style={{ color: '#007bff', fontSize: '14px' }}>
                      Sauvegarde...
                    </span>
                  )}
                  <button
                    onClick={() => deleteSetting(setting.id)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      padding: '5px 10px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(groupedSettings).length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#666'
        }}>
          <p>Aucun paramètre système configuré.</p>
          <p>Utilisez le formulaire ci-dessus pour ajouter des paramètres.</p>
        </div>
      )}
    </div>
  );
};
