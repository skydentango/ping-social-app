import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Group, User } from '../types';
import { getColors, typography, spacing, borderRadius, shadows } from '../utils/theme';

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  createButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  createButtonText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  listContainer: {
    padding: spacing.md,
  },
  groupCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: typography.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.textPrimary,
  },
  groupMembers: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: 4,
  },
  groupDate: {
    fontSize: typography.xs,
    color: colors.textTertiary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.xl,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalCancel: {
    color: colors.primary,
    fontSize: typography.base,
  },
  modalTitle: {
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalSave: {
    color: colors.primary,
    fontSize: typography.base,
    fontWeight: '600',
  },
  modalSaveDisabled: {
    color: colors.gray400,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  label: {
    fontSize: typography.base,
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: typography.base,
    color: colors.textPrimary,
  },
  hint: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  selectedCount: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  friendsList: {
    marginBottom: spacing.md,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: typography.base,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: spacing.xs,
  },
  currentMembersList: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  currentMember: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  currentMemberName: {
    fontSize: typography.base,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  currentMemberStatus: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
});

const GroupsScreen = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const styles = createStyles(colors);
  const [groups, setGroups] = useState<Group[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<User[]>([]);
  const [currentMembers, setCurrentMembers] = useState<User[]>([]);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Load groups
    const groupsQuery = query(
      collection(db, 'groups'),
      where('members', 'array-contains', user.id)
    );

    const unsubscribeGroups = onSnapshot(groupsQuery, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Group[];
      
      setGroups(groupsData);
    });

    // Load friends (all users except current user)
    const usersQuery = collection(db, 'users');
    const unsubscribeFriends = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        status: {
          emoji: doc.data().status?.emoji || '🟢',
          text: doc.data().status?.text || 'Free',
          updatedAt: doc.data().status?.updatedAt?.toDate() || new Date(),
        }
      })) as User[];
      
      // Filter out current user
      const friendsData = usersData.filter(u => u.id !== user.id);
      setFriends(friendsData);
    });

    return () => {
      unsubscribeGroups();
      unsubscribeFriends();
    };
  }, [user]);

  const createGroup = async () => {
    if (!user || !newGroupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setCreating(true);
    try {
      // Include creator + selected friends as members
      const members = [user.id, ...selectedFriends.map(friend => friend.id)];
      
      await addDoc(collection(db, 'groups'), {
        name: newGroupName.trim(),
        members: members,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Reset form
      setNewGroupName('');
      setSelectedFriends([]);
      setShowCreateModal(false);
      
      const memberCount = members.length;
      Alert.alert('Success', `Group "${newGroupName.trim()}" created with ${memberCount} member${memberCount > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const toggleFriendSelection = (friend: User) => {
    setSelectedFriends(prev => {
      const isSelected = prev.some(f => f.id === friend.id);
      if (isSelected) {
        return prev.filter(f => f.id !== friend.id);
      } else {
        return [...prev, friend];
      }
    });
  };

  const openEditGroup = async (group: Group) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    
    // Load current members
    const memberUsers: User[] = [];
    for (const memberId of group.members) {
      try {
        const userDoc = await getDoc(doc(db, 'users', memberId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          memberUsers.push({
            id: userDoc.id,
            ...userData,
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
            status: {
              emoji: userData.status?.emoji || '🟢',
              text: userData.status?.text || 'Free',
              updatedAt: userData.status?.updatedAt?.toDate() || new Date(),
            }
          } as User);
        }
      } catch (error) {
        console.error('Error loading member:', error);
      }
    }
    
    setCurrentMembers(memberUsers);
    
    // Set selected friends to non-current-user members
    const nonUserMembers = memberUsers.filter(member => member.id !== user?.id);
    setSelectedFriends(nonUserMembers);
    
    setShowEditModal(true);
  };

  const updateGroup = async () => {
    if (!editingGroup || !user || !newGroupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setUpdating(true);
    try {
      // Include creator + selected friends as members
      const members = [user.id, ...selectedFriends.map(friend => friend.id)];
      
      await updateDoc(doc(db, 'groups', editingGroup.id), {
        name: newGroupName.trim(),
        members: members,
        updatedAt: new Date(),
      });

      // Reset form
      setNewGroupName('');
      setSelectedFriends([]);
      setCurrentMembers([]);
      setEditingGroup(null);
      setShowEditModal(false);
      
      const memberCount = members.length;
      Alert.alert('Success', `Group "${newGroupName.trim()}" updated with ${memberCount} member${memberCount > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error('Error updating group:', error);
      Alert.alert('Error', 'Failed to update group');
    } finally {
      setUpdating(false);
    }
  };

  const deleteGroup = (group: Group) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${group.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'groups', group.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete group');
            }
          },
        },
      ]
    );
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupMembers}>{item.members.length} members</Text>
        </View>
        {item.createdBy === user?.id && (
          <View style={styles.groupActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openEditGroup(item)}
            >
              <Ionicons name="pencil-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deleteGroup(item)}
            >
              <Ionicons name="trash-outline" size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Text style={styles.groupDate}>
        Created {item.createdAt.toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.createButtonText}>Create New Group</Text>
      </TouchableOpacity>

      {groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Groups Yet</Text>
          <Text style={styles.emptySubtitle}>Create your first group to start pinging friends!</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Group</Text>
            <TouchableOpacity onPress={createGroup} disabled={creating}>
              <Text style={[styles.modalSave, creating && styles.modalSaveDisabled]}>
                {creating ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={() => Keyboard.dismiss()}
              style={{ flex: 1 }}
            >
            <Text style={styles.label}>Group Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter group name (e.g., College Friends)"
              value={newGroupName}
              onChangeText={setNewGroupName}
              maxLength={50}
              autoFocus
            />
            
                          <Text style={[styles.label, { marginTop: spacing.lg }]}>Add Friends</Text>
              {selectedFriends.length > 0 && (
                <Text style={styles.selectedCount}>
                  {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''} selected
                </Text>
              )}
              
              <View style={styles.friendsList}>
                {friends.map((item) => {
                  const isSelected = selectedFriends.some(f => f.id === item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.friendItem}
                      onPress={() => toggleFriendSelection(item)}
                    >
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{item.displayName}</Text>
                        <Text style={styles.friendStatus}>{item.status.emoji} {item.status.text}</Text>
                      </View>
                      <Ionicons 
                        name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                        size={24} 
                        color={isSelected ? colors.primary : colors.textSecondary} 
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              <Text style={styles.hint}>
                You'll be automatically added as the group creator. Selected friends will be added as members.
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Group</Text>
            <TouchableOpacity onPress={updateGroup} disabled={updating}>
              <Text style={[styles.modalSave, updating && styles.modalSaveDisabled]}>
                {updating ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={() => Keyboard.dismiss()}
              style={{ flex: 1 }}
            >
              <Text style={styles.label}>Group Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter group name"
                value={newGroupName}
                onChangeText={setNewGroupName}
                maxLength={50}
                autoFocus={false}
              />
            
            <Text style={[styles.label, { marginTop: spacing.lg }]}>Current Members</Text>
            {currentMembers.length > 0 && (
              <View style={styles.currentMembersList}>
                {currentMembers.map((member) => (
                  <View key={member.id} style={styles.currentMember}>
                    <Text style={styles.currentMemberName}>
                      {member.displayName} {member.id === user?.id && '(You)'}
                    </Text>
                    <Text style={styles.currentMemberStatus}>
                      {member.status.emoji} {member.status.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
                          <Text style={[styles.label, { marginTop: spacing.lg }]}>Add/Remove Friends</Text>
              {selectedFriends.length > 0 && (
                <Text style={styles.selectedCount}>
                  {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''} selected
                </Text>
              )}
              
              <View style={styles.friendsList}>
                {friends.map((item) => {
                  const isSelected = selectedFriends.some(f => f.id === item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.friendItem}
                      onPress={() => toggleFriendSelection(item)}
                    >
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{item.displayName}</Text>
                        <Text style={styles.friendStatus}>{item.status.emoji} {item.status.text}</Text>
                      </View>
                      <Ionicons 
                        name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                        size={24} 
                        color={isSelected ? colors.primary : colors.textSecondary} 
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              <Text style={styles.hint}>
                You'll remain as the group creator. Add or remove friends as needed.
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default GroupsScreen; 