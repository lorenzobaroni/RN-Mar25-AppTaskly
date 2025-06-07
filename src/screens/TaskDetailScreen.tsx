import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { TaskDetailRouteProp } from '../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../utils/api';

import Header from '../components/molecules/Header';
import TabBar from '../components/molecules/TabBar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TaskDetail'>;

export default function TaskDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TaskDetailRouteProp>();
  const { task } = route.params;
  const [subtaskInputs, setSubtaskInputs] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [confirmedSubtasks, setConfirmedSubtasks] = useState<{ text: string; checked: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<{ picture: string } | null>(null);

  const fetchTaskDetails = async () => {
    try {
      const response = await api.get('/tasks');
      const foundTask = response.data.find((t: any) => t.id === task.id);

      if (foundTask?.subtasks) {
        const formattedSubtasks = foundTask.subtasks.map((sub: any) => ({
          text: sub.title,
          checked: sub.done,
        }));
        setConfirmedSubtasks(formattedSubtasks);
      }
    } catch (error) {
      console.error('Erro ao carregar subtasks da API:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile');
        const data = response.data;
        const pictureUrl = data.picture?.startsWith('http')
          ? data.picture
          : `https://taskly-avatars.s3.us-east-2.amazonaws.com/${data.picture}.png`;
        setProfile({ picture: pictureUrl });
        console.log('🔍 Perfil recebido:', pictureUrl);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    };

    fetchTaskDetails();
    fetchProfile();
  }, [task.id]);

  const addSubtaskInput = () => {
    setSubtaskInputs([...subtaskInputs, '']);
  };

  const updateSubtaskInput = (index: number, text: string) => {
    const updatedInputs = [...subtaskInputs];
    updatedInputs[index] = text;
    setSubtaskInputs(updatedInputs);
  };

  const confirmSubtask = async (index: number) => {
    const inputText = subtaskInputs[index].trim();
    if (!inputText) return;

    try {
      const newSubtask = { title: inputText, done: false };

      const updatedSubtasks = [
        ...confirmedSubtasks.map(s => ({
          title: s.text,
          done: s.checked,
        })),
        newSubtask,
      ];

      console.log('🛰️ Enviando subtasks para API:', updatedSubtasks);

      await api.put(`/tasks/${task.id}`, {
        title: task.title,
        description: task.description,
        priority: Number(task.prioridade) || 1,
        deadline: task.prazo?.trim() || '31/12/2020',
        done: task.done || false,
        subtasks: updatedSubtasks,
      });

      await fetchTaskDetails(); // Atualiza a lista após salvar

      const updatedInputs = [...subtaskInputs];
      updatedInputs.splice(index, 1);
      setSubtaskInputs(updatedInputs);
    } catch (error) {
      console.error('Erro ao enviar subtask para API:', error);
      Alert.alert('Erro', 'Erro ao criar subtask');
    }
  };


  const toggleSubtaskChecked = (index: number) => {
    const updated = [...confirmedSubtasks];
    updated[index] = {
      ...updated[index],
      checked: !updated[index].checked,
    };
    setConfirmedSubtasks(updated);
  };

  const deleteTask = async () => {
    try {
      await api.delete(`/tasks/${task.id}`);
      Alert.alert('Sucesso', 'Tarefa resolvida com sucesso!');
      navigation.reset({ index: 0, routes: [{ name: 'HomePage' }] });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível resolver a tarefa.');
      console.error(error);
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
  };

  function getPriorityStyle() {
    return { backgroundColor: '#32C25B' };
  }

  return (
    <View style={styles.screen}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#583CC4" />
        </View>
      ) : (
        <>
          <View style={styles.container}>
            <Header
              onBack={() => navigation.reset({ index: 0, routes: [{ name: 'HomePage' }] })}
              avatarUrl={profile?.picture}
            />
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.editIcon}
                onPress={() => navigation.navigate('EditTask', { task })}
              >
                <Image source={require('../assets/avatars/Vector1.png')} />
              </TouchableOpacity>

              <Text style={styles.label1}>Título</Text>
              <Text style={styles.value}>{task.title}</Text>

              <Text style={styles.label}>Descrição</Text>
              <Text style={styles.description}>{task.description}</Text>

              <Text style={styles.label}>Tags</Text>
              {task.tags?.length > 0 ? (
                <View style={styles.chips}>
                  {task.tags.map((tag, index) => (
                    <View key={index} style={styles.chip}>
                      <Text style={styles.chipText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyInfoText}>Nenhuma tag adicionada</Text>
              )}

              <Text style={styles.label}>Prioridade</Text>
              {task.prioridade ? (
                <View style={[styles.priorityChip, getPriorityStyle()]}>
                  <Text style={styles.priorityChipText}>{task.prioridade.toUpperCase()}</Text>
                </View>
              ) : (
                <Text style={styles.emptyInfoText}>Sem prioridade definida</Text>
              )}

              <TouchableOpacity style={styles.resolveButton} onPress={deleteTask}>
                <Text style={styles.resolveButtonText}>RESOLVER TAREFA</Text>
              </TouchableOpacity>
            </View>
            {/* Inputs de novas subtasks */}
            {subtaskInputs.map((input, i) => (
              <View key={`input-${i}`} style={styles.subtaskInputContainer}>
                <TextInput
                  value={input}
                  placeholder="Digite a subtask"
                  onChangeText={(text) => updateSubtaskInput(i, text)}
                />
                <TouchableOpacity onPress={() => confirmSubtask(i)}>
                  <MaterialCommunityIcons name="arrow-right-circle" size={24} color="#32C25B" />
                </TouchableOpacity>
              </View>
            ))}
            {!isLoading && confirmedSubtasks.length === 0 && (
            <TouchableOpacity onPress={addSubtaskInput} style={styles.subtaskButton}>
              <Text style={styles.subtaskButtonText}>ADICIONAR SUBTASK</Text>
            </TouchableOpacity>
            )}
            <View style={styles.subtasksScrollArea}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
                >
                {/* Subtasks confirmadas */}
                {confirmedSubtasks.map((sub, i) => (
                  <View key={`confirmed-${i}`} style={styles.confirmedSubtask}>
                    {editingIndex !== i && (
                      <TouchableOpacity onPress={() => toggleSubtaskChecked(i)}>
                        <MaterialCommunityIcons
                          name={sub.checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                          size={20}
                          color={sub.checked ? '#32C25B' : '#B58B46'}
                        />
                      </TouchableOpacity>
                    )}
                    {editingIndex === i ? (
                      <TextInput
                        style={styles.confirmedSubtaskText}
                        value={sub.text}
                        onChangeText={(text) => {
                          const updated = [...confirmedSubtasks];
                          updated[i].text = text;
                          setConfirmedSubtasks(updated);
                        }}
                        autoFocus
                      />
                    ) : (
                      <Text style={styles.confirmedSubtaskText}>{sub.text}</Text>
                    )}
                    <TouchableOpacity
                      onPress={() => (editingIndex === i ? setEditingIndex(null) : startEditing(i))}
                    >
                      {editingIndex === i ? (
                        <MaterialCommunityIcons name="arrow-right-circle" size={24} color="#32C25B" />
                      ) : (
                        <Image source={require('../assets/avatars/Vector.png')} />
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
            {/* Botão Adicionar Subtask */}
            {!isLoading && (confirmedSubtasks.length > 0) && (
              <TouchableOpacity onPress={addSubtaskInput} style={styles.buttonFloating}>
                <Text style={styles.subtaskButtonText}>ADICIONAR SUBTASK</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Barra de Navegação Inferior */}
          <TabBar
            onClipboardPress={() => console.log('Clipboard')}
            onBellPress={() => console.log('Bell')}
            onMenuPress={() => console.log('Menu')}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    justifyContent: 'space-between',
  },
  container: {
    paddingLeft: 27,
    paddingRight: 27,
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 4,
  },
  editIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  label1: {
    marginTop: 10,
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#AAAAAA',
  },
  label: {
    marginTop: 10,
    fontSize: 18,
    fontFamily: 'Roboto-Regular',
    color: '#AAAAAA',
  },
  value: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Roboto-Regular',
    color: '#1E1E1E',
  },
  description: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: 'Roboto-Regular',
    color: '#1E1E1E',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#E6E0F7',
    marginRight: 8,
    marginTop: 4,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Roboto-Base',
    color: '#1E1E1E',
  },
  priorityChip: {
    backgroundColor: '#32C26B',
    marginTop: 4,
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  priorityChipText: {
    fontSize: 12,
    fontFamily: 'Roboto-Base',
    color: '#FFFFFF',
  },
  emptyInfoText: {
    fontStyle: 'italic',
    color: '#999',
  },
  resolveButton: {
    marginTop: 14,
    borderColor: '#583CC4',
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: 'center',
  },
  resolveButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto-Base',
    color: '#5B3CC4',
    textAlign: 'center',
  },
  subtasksScrollArea: {
    flex: 1,
    maxHeight: 250,
    marginTop: 10,
    paddingBottom: 10,
  },
  subtasksContainer: {
    flex: 1,
    marginTop: 10,
    paddingBottom: 90,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  subtaskInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#5B3CC4',
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    height: 45,
    marginTop: 10,
  },
  confirmedSubtask: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E6E0F7',
  },
  confirmedSubtaskText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'Roboto-Base',
    fontSize: 16,
    color: '#000000',
  },
  subtaskButton: {
    marginTop: 25,
    borderRadius: 8,
    backgroundColor: '#583CC4',
    paddingVertical: 2,
  },
  subtaskButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto-Base',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    elevation: 8,
  },
  buttonFloating: {
    position: 'absolute',
    bottom: 70,
    left: 27,
    right: 27,
    marginTop: 14,
    backgroundColor: '#583CC4',
    borderRadius: 8,
    justifyContent: 'center',
    paddingVertical: 2,
    marginBottom: 0,
    zIndex: 10,
  },
});
