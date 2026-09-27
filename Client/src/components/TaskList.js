import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
// Pastikan nama impor di dalam { } persis seperti ini:
import { getTasks, createTask, toggleTaskCompleted } from '../services/taskService';

export default function TaskList({ selectedTaskId, onSelectTask }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await getTasks();
      if (res && res.success) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error('Gagal memuat tugas:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async () => {
    if (!title.trim()) return;
    try {
      const res = await createTask(title.trim(), 1);
      if (res && res.success) {
        setTitle('');
        fetchTasks();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error('Gagal menambah tugas:', msg);
      if (Platform.OS === 'web') {
        window.alert(`Gagal menambah tugas: ${msg}`);
      } else {
        Alert.alert('Gagal', msg);
      }
    }
  };

  const handleToggle = async (task) => {
    const id = task.taskId || task.id;
    try {
      const res = await toggleTaskCompleted(id, !task.isCompleted);
      if (res && res.success) {
        fetchTasks();
      }
    } catch (err) {
      console.error('Gagal update status:', err.message);
    }
  };

  return (
    <View style={{ width: '100%', maxWidth: 420, marginTop: 32 }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2C4E3F', marginBottom: 12 }}>
        Fokus Tugas Hari Ini
      </Text>

      {/* Input Form Tugas Baru */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Tambah tugas baru..."
          style={{
            flex: 1,
            backgroundColor: '#F3EFEA',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#D8E8DD',
            fontSize: 13,
          }}
        />
        <TouchableOpacity
          onPress={handleAddTask}
          style={{
            backgroundColor: '#2C4E3F',
            paddingHorizontal: 16,
            borderRadius: 12,
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Tambah</Text>
        </TouchableOpacity>
      </View>

      {/* List Tugas */}
      {loading ? (
        <ActivityIndicator color="#2C4E3F" />
      ) : tasks.length === 0 ? (
        <View style={{ padding: 14, backgroundColor: '#F3EFEA', borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: '#8E948F', fontSize: 12 }}>Belum ada tugas. Tambahkan di atas!</Text>
        </View>
      ) : (
        tasks.map((item) => {
          const currentId = item.taskId || item.id;
          const isSelected = selectedTaskId === currentId;
          return (
            <TouchableOpacity
              key={currentId}
              onPress={() => onSelectTask(isSelected ? null : currentId)}
              style={{
                backgroundColor: isSelected ? '#E2ECE9' : '#F3EFEA',
                padding: 12,
                borderRadius: 12,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: isSelected ? 2 : 0,
                borderColor: '#2C4E3F',
              }}
            >
              <TouchableOpacity
                onPress={() => handleToggle(item)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: '#2C4E3F',
                  backgroundColor: item.isCompleted ? '#2C4E3F' : 'transparent',
                  marginRight: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {item.isCompleted && (
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                )}
              </TouchableOpacity>

              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: '#2C4E3F',
                  textDecorationLine: item.isCompleted ? 'line-through' : 'none',
                  opacity: item.isCompleted ? 0.6 : 1,
                }}
              >
                {item.title}
              </Text>
              {isSelected && (
                <Text style={{ fontSize: 10, color: '#2C4E3F', fontWeight: 'bold' }}>Aktif Fokus</Text>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}