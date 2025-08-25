import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { Ping, PingResponse } from '../types';

const HomeScreen = () => {
  const { user } = useAuth();
  const [pings, setPings] = useState<Ping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const pingsQuery = query(
      collection(db, 'pings'),
      orderBy('sentAt', 'desc')
    );

    const unsubscribe = onSnapshot(pingsQuery, (snapshot) => {
      const pingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate() || new Date(),
        responses: doc.data().responses || []
      })) as Ping[];
      
      setPings(pingsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleResponse = async (pingId: string, response: 'yes' | 'no' | 'maybe') => {
    if (!user) return;

    try {
      const pingRef = doc(db, 'pings', pingId);
      const newResponse: PingResponse = {
        userId: user.id,
        response,
        respondedAt: new Date()
      };

      // Remove any existing response from this user and add the new one
      const ping = pings.find(p => p.id === pingId);
      if (ping) {
        const filteredResponses = ping.responses.filter(r => r.userId !== user.id);
        await updateDoc(pingRef, {
          responses: [...filteredResponses, newResponse]
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to respond to ping');
    }
  };

  const getUserResponse = (ping: Ping): PingResponse | undefined => {
    return ping.responses.find(r => r.userId === user?.id);
  };

  const renderPing = ({ item }: { item: Ping }) => {
    const userResponse = getUserResponse(item);
    
    return (
      <View style={styles.pingCard}>
        <Text style={styles.pingMessage}>{item.message}</Text>
        <Text style={styles.pingTime}>
          {item.sentAt.toLocaleString()}
        </Text>
        
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>Your response:</Text>
          <View style={styles.responseButtons}>
            <TouchableOpacity
              style={[
                styles.responseButton,
                userResponse?.response === 'yes' && styles.selectedButton
              ]}
              onPress={() => handleResponse(item.id, 'yes')}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color={userResponse?.response === 'yes' ? 'white' : '#4CAF50'} 
              />
              <Text style={[
                styles.responseText,
                userResponse?.response === 'yes' && styles.selectedText
              ]}>Yes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.responseButton,
                userResponse?.response === 'maybe' && styles.selectedButton
              ]}
              onPress={() => handleResponse(item.id, 'maybe')}
            >
              <Ionicons 
                name="help-circle" 
                size={24} 
                color={userResponse?.response === 'maybe' ? 'white' : '#FF9800'} 
              />
              <Text style={[
                styles.responseText,
                userResponse?.response === 'maybe' && styles.selectedText
              ]}>Maybe</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.responseButton,
                userResponse?.response === 'no' && styles.selectedButton
              ]}
              onPress={() => handleResponse(item.id, 'no')}
            >
              <Ionicons 
                name="close-circle" 
                size={24} 
                color={userResponse?.response === 'no' ? 'white' : '#F44336'} 
              />
              <Text style={[
                styles.responseText,
                userResponse?.response === 'no' && styles.selectedText
              ]}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.responseSummary}>
          <Text style={styles.summaryText}>
            ✅ {item.responses.filter(r => r.response === 'yes').length} • 
            🤔 {item.responses.filter(r => r.response === 'maybe').length} • 
            ❌ {item.responses.filter(r => r.response === 'no').length}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading pings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {pings.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No pings yet!</Text>
          <Text style={styles.emptySubtext}>Send your first ping to get started</Text>
        </View>
      ) : (
        <FlatList
          data={pings}
          renderItem={renderPing}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  pingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pingMessage: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  pingTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  responseContainer: {
    marginBottom: 12,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  responseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  responseText: {
    marginLeft: 4,
    fontSize: 14,
  },
  selectedText: {
    color: 'white',
  },
  responseSummary: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  summaryText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

export default HomeScreen; 