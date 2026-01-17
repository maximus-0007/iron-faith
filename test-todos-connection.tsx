import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { supabase, DBTodo } from './utils/supabase';
import { useAuth } from './utils/AuthContext';

export default function TestTodosConnection() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<DBTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getTodos = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError('User not authenticated. Please log in first.');
          setLoading(false);
          return;
        }

        console.log('✅ User is authenticated:', session.user.id);

        // Your original code
        const { data: todos, error: fetchError } = await supabase.from('todos').select();

        if (fetchError) {
          console.error('❌ Error fetching todos:', fetchError.message);
          setError(`Error: ${fetchError.message}`);
          Alert.alert('Error', fetchError.message);
          return;
        }

        console.log('✅ Fetched todos:', todos?.length || 0);

        if (todos && todos.length > 0) {
          setTodos(todos);
        } else {
          setTodos([]);
          console.log('ℹ️  No todos found (this is normal if table is empty)');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('❌ Error:', errorMessage);
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    getTodos();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Connecting to Supabase...</Text>
        <Text style={styles.subtext}>Checking authentication...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>⚠️ {error}</Text>
        <Text style={styles.subtext}>
          {!user ? 'You need to be logged in to fetch todos' : 'Check the console for details'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ Supabase Connection Works!</Text>
      <Text style={styles.subtitle}>Todo List ({todos.length} items)</Text>
      
      {todos.length === 0 ? (
        <Text style={styles.empty}>No todos found</Text>
      ) : (
        <FlatList
          data={todos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.todoItem}>
              <Text style={styles.todoText}>{item.title}</Text>
              <Text style={styles.todoStatus}>
                {item.completed ? '✓ Done' : '○ Pending'}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  subtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  error: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  empty: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 20,
  },
  todoItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    minWidth: 300,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todoText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  todoStatus: {
    fontSize: 14,
    color: '#6b7280',
  },
});
