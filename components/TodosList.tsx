import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { supabase, DBTodo } from '../utils/supabase';
import { useAuth } from '../utils/AuthContext';

export default function TodosList() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<DBTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getTodos = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const { data, error: fetchError } = await supabase
          .from('todos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Error fetching todos:', fetchError.message);
          setError(fetchError.message);
          return;
        }

        if (data && data.length > 0) {
          setTodos(data);
        } else {
          setTodos([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch todos';
        console.error('Error fetching todos:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    getTodos();
  }, [user]);

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Please log in to view your todos</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading todos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Todo List</Text>
      {todos.length === 0 ? (
        <Text style={styles.emptyText}>No todos yet</Text>
      ) : (
        <FlatList
          data={todos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.todoItem}>
              <Text style={[styles.todoText, item.completed && styles.todoCompleted]}>
                {item.title}
              </Text>
              {item.completed && <Text style={styles.completedBadge}>✓</Text>}
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
  },
  error: {
    fontSize: 16,
    color: '#dc2626',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    minWidth: 200,
  },
  todoText: {
    fontSize: 16,
    flex: 1,
    color: '#1f2937',
  },
  todoCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  completedBadge: {
    color: '#10b981',
    fontSize: 18,
    marginLeft: 8,
  },
});
