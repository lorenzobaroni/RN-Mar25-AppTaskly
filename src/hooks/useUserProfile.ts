import { useEffect, useState } from 'react';
import api from '../utils/api';

interface ProfileData {
  name: string;
  phone_number: string;
  email?: string;
  picture: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [avatarSource, setAvatarSource] = useState<{ uri: string } | number>(require('../assets/avatars/ellipse1.png'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    console.log('🔍 Iniciando fetch do perfil via axios...');
    try {
      const response = await api.get('/profile');
      const data = response.data;
      console.log('✅ Dados recebidos do backend:', data);

      setProfile(data);

      const avatarUrl = data.picture?.startsWith('http')
        ? data.picture
        : `https://taskly-avatars.s3.us-east-2.amazonaws.com/${data.picture}.png`;

      setAvatarSource({ uri: avatarUrl });
    } catch (error) {
      console.error('❌ Erro ao carregar o perfil:', error);
    } finally {
      setIsLoading(false); // 👈 isso aqui é essencial
    }
  };

  const updateProfile = async (updatedData: { name: string; phone_number: string }) => {
    try {
      const response = await api.put('/profile', updatedData);
      if (!response || !response.data) throw new Error('Erro ao atualizar perfil');
      setProfile(response.data);
    } catch (error) {
      console.error('❌ Erro ao atualizar o perfil:', error);
      throw error;
    }
  };

  return { profile, avatarSource, updateProfile, isLoading, fetchProfile };
}
