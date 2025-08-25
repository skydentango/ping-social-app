import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { UserStatus } from '../types';

const StatusScreen = () => {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);

  const statusOptions: UserStatus[] = [
    { emoji: '😊', text: 'Available', updatedAt: new Date() },
    { emoji: '🏃', text: 'At the gym', updatedAt: new Date() },
    { emoji: '🧠', text: 'Studying', updatedAt: new Date() },
    { emoji: '💼', text: 'Working', updatedAt: new Date() },
    { emoji: '🍽️', text: 'Eating', updatedAt: new Date() },
    { emoji: '🚗', text: 'Driving', updatedAt: new Date() },
    { emoji: '🏠', text: 'At home', updatedAt: new Date() },
    { emoji: '🎉', text: 'Partying', updatedAt: new Date() },
    { emoji: '😴', text: 'Sleeping', updatedAt: new Date() },
    { emoji: '🤒', text: 'Sick', updatedAt: new Date() },
    { emoji: '✈️', text: 'Traveling', updatedAt: new Date() },
    { emoji: '📵', text: 'Do not disturb', updatedAt: new Date() },
  ];

  const updateStatus = async (newStatus: UserStatus) => {
    if (!user) return;

    setUpdating(true);
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        status: {
          ...newStatus,
          updatedAt: new Date(),
        },
        updatedAt: new Date(),
      });

      Alert.alert('Success', 'Status updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const renderStatusOption = (status: UserStatus) => {
    const isSelected = user?.status.emoji === status.emoji && user?.status.text === status.text;
    
    return (
      <TouchableOpacity
        key={`${status.emoji}-${status.text}`}
        style={[styles.statusOption, isSelected && styles.selectedStatus]}
        onPress={() => updateStatus(status)}
        disabled={updating}
      >
        <Text style={styles.statusEmoji}>{status.emoji}</Text>
        <Text style={[styles.statusText, isSelected && styles.selectedStatusText]}>
          {status.text}
        </Text>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.currentStatus}>
        <Text style={styles.currentStatusLabel}>Current Status</Text>
        <View style={styles.currentStatusDisplay}>
          <Text style={styles.currentStatusEmoji}>{user?.status.emoji}</Text>
          <Text style={styles.currentStatusText}>{user?.status.text}</Text>
        </View>
        <Text style={styles.lastUpdated}>
          Last updated: {user?.status.updatedAt.toLocaleString()}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Choose Your Vibe</Text>
      
      <ScrollView style={styles.statusList} showsVerticalScrollIndicator={false}>
        {statusOptions.map(renderStatusOption)}
      </ScrollView>
      
      <Text style={styles.hint}>
        Your status will be visible to friends in your groups
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  currentStatus: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentStatusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  currentStatusDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentStatusEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  currentStatusText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  statusList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedStatus: {
    backgroundColor: '#007AFF',
  },
  statusEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  statusText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectedStatusText: {
    color: 'white',
    fontWeight: '600',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    margin: 16,
    fontStyle: 'italic',
  },
});

export default StatusScreen; 