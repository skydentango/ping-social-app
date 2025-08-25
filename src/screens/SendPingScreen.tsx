import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList, Modal } from 'react-native';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { Group } from '../types';

const SendPingScreen = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;

    const groupsQuery = query(
      collection(db, 'groups'),
      where('members', 'array-contains', user.id)
    );

    const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Group[];
      
      setGroups(groupsData);
    });

    return unsubscribe;
  }, [user]);

  const sendPing = async () => {
    if (!user || !selectedGroup || !message.trim()) {
      Alert.alert('Error', 'Please select a group and enter a message');
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, 'pings'), {
        message: message.trim(),
        groupId: selectedGroup.id,
        senderId: user.id,
        sentAt: new Date(),
        responses: []
      });

      Alert.alert('Success', 'Ping sent successfully!');
      setMessage('');
      setSelectedGroup(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to send ping');
    } finally {
      setSending(false);
    }
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() => {
        setSelectedGroup(item);
        setShowGroupPicker(false);
      }}
    >
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupMembers}>{item.members.length} members</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Select Group</Text>
        <TouchableOpacity
          style={styles.groupSelector}
          onPress={() => setShowGroupPicker(true)}
        >
          <Text style={[styles.groupSelectorText, !selectedGroup && styles.placeholder]}>
            {selectedGroup ? selectedGroup.name : 'Choose a group...'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        <Text style={styles.label}>Message</Text>
        <TextInput
          style={styles.messageInput}
          placeholder="What's the plan? (e.g., Anyone down to get boba?)"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={200}
        />
        <Text style={styles.characterCount}>{message.length}/200</Text>

        <TouchableOpacity
          style={[styles.sendButton, (!selectedGroup || !message.trim() || sending) && styles.sendButtonDisabled]}
          onPress={sendPing}
          disabled={!selectedGroup || !message.trim() || sending}
        >
          <Ionicons name="send" size={20} color="white" />
          <Text style={styles.sendButtonText}>
            {sending ? 'Sending...' : 'Send Ping'}
          </Text>
        </TouchableOpacity>
      </View>

      {groups.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Groups Yet</Text>
          <Text style={styles.emptySubtitle}>Create a group in the Groups tab to start sending pings!</Text>
        </View>
      )}

      <Modal
        visible={showGroupPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowGroupPicker(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Group</Text>
            <View style={styles.modalSpacer} />
          </View>
          
          <FlatList
            data={groups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.id}
            style={styles.groupList}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  groupSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  groupSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCancel: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  modalSpacer: {
    width: 50,
  },
  groupList: {
    flex: 1,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
  },
  groupMembers: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default SendPingScreen; 