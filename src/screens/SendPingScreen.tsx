import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList, Modal, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { collection, addDoc, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Group, User } from '../types';
import { getColors, typography, spacing, borderRadius, shadows } from '../utils/theme';
import { sendPingNotification, scheduleLocalNotification } from '../services/NotificationService';

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  form: {
    padding: spacing.md,
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
  },
  label: {
    fontSize: typography.base,
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.textPrimary,
  },
  groupSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  groupSelectorText: {
    fontSize: typography.base,
    color: colors.textPrimary,
  },
  placeholder: {
    color: colors.textTertiary,
  },
  expirationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: typography.base,
    minHeight: 100,
    textAlignVertical: 'top',
    color: colors.textPrimary,
  },
  characterCount: {
    textAlign: 'right',
    color: colors.textSecondary,
    fontSize: typography.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  sendButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: '600',
    marginLeft: spacing.xs,
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
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalCancel: {
    color: colors.primary,
    fontSize: typography.base,
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.textPrimary,
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
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: typography.base,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  groupMembers: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.md,
    padding: 2,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.white,
    fontWeight: '600',
  },
  modalDone: {
    color: colors.primary,
    fontSize: typography.base,
    fontWeight: '600',
  },
  selectedCount: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  selectedCountText: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  expirationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  expirationModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '60%',
    paddingBottom: spacing.xl,
  },
  expirationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  expirationOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  expirationOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  expirationOptionText: {
    fontSize: typography.base,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  expirationOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});

const SendPingScreen = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const styles = createStyles(colors);
  const [message, setMessage] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedFriends, setSelectedFriends] = useState<User[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'groups' | 'friends'>('groups');
  const [sending, setSending] = useState(false);
  const [expirationMinutes, setExpirationMinutes] = useState<number | null>(30); // Default 30 minutes
  const [showExpirationModal, setShowExpirationModal] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');

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

    // Load all users as potential friends (excluding current user)
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

  const expirationOptions = [
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: '6 hours', value: 360 },
    { label: '12 hours', value: 720 },
    { label: '1 day', value: 1440 },
    { label: 'Custom...', value: -1 },
  ];

  const getExpirationText = () => {
    if (expirationMinutes === null) return 'No expiration';
    
    const option = expirationOptions.find(opt => opt.value === expirationMinutes);
    if (option && option.value !== -1) return option.label;
    
    // Custom time
    if (expirationMinutes < 60) {
      return `${expirationMinutes} minutes`;
    } else if (expirationMinutes < 1440) {
      const hours = Math.floor(expirationMinutes / 60);
      const mins = expirationMinutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(expirationMinutes / 1440);
      const hours = Math.floor((expirationMinutes % 1440) / 60);
      return hours > 0 ? `${days}d ${hours}h` : `${days} day${days > 1 ? 's' : ''}`;
    }
  };

  const handleExpirationSelect = (value: number) => {
    if (value === -1) {
      // Custom option
      setCustomMinutes('');
      setShowExpirationModal(false);
      // Show a simple prompt
      Alert.prompt(
        'Custom Expiration Time',
        'Enter the number of minutes until this ping expires:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Set',
            onPress: (text?: string) => {
              const minutes = parseInt(text || '0', 10);
              if (minutes > 0 && minutes <= 10080) { // Max 7 days
                setExpirationMinutes(minutes);
              } else {
                Alert.alert('Invalid Time', 'Please enter a value between 1 and 10080 minutes (7 days)');
              }
            }
          }
        ],
        'plain-text',
        '',
        'number-pad'
      );
    } else {
      setExpirationMinutes(value);
      setShowExpirationModal(false);
    }
  };

  const sendPing = async () => {
    if (!user || !message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    // Check if we have recipients
    const hasGroupSelected = pickerMode === 'groups' && selectedGroup;
    const hasFriendsSelected = pickerMode === 'friends' && selectedFriends.length > 0;
    
    if (!hasGroupSelected && !hasFriendsSelected) {
      Alert.alert('Error', `Please select ${pickerMode === 'groups' ? 'a group' : 'friends'}`);
      return;
    }

    // Dismiss keyboard when sending
    Keyboard.dismiss();

    setSending(true);
    try {
      let recipients: string[] = [];
      let pingData: any = {
        message: message.trim(),
        senderId: user.id,
        sentAt: new Date(),
        responses: []
      };

      // Add expiration if set
      if (expirationMinutes !== null) {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);
        pingData.expiresAt = expiresAt;
      }

      let recipientName = '';
      if (pickerMode === 'groups' && selectedGroup) {
        // Group ping
        recipients = selectedGroup.members;
        pingData.groupId = selectedGroup.id;
        pingData.type = 'group';
        pingData.recipients = recipients;
        recipientName = selectedGroup.name;
      } else if (pickerMode === 'friends' && selectedFriends.length > 0) {
        // Friends ping - include sender + selected friends
        recipients = [user.id, ...selectedFriends.map(friend => friend.id)];
        pingData.type = 'friends';
        pingData.recipients = recipients;
        recipientName = `${selectedFriends.length} friend${selectedFriends.length > 1 ? 's' : ''}`;
      }

      await addDoc(collection(db, 'pings'), pingData);

      // Send push notifications to all recipients (excluding sender)
      const recipientsToNotify = recipients.filter(id => id !== user.id);
      
      for (const recipientId of recipientsToNotify) {
        try {
          const recipientDoc = await getDoc(doc(db, 'users', recipientId));
          if (recipientDoc.exists()) {
            const recipientData = recipientDoc.data();
            const pushToken = recipientData.pushToken;
            const status = recipientData.status;
            
            // Check if user's status is "Busy" - if so, skip notification
            const isBusy = status?.text?.toLowerCase().includes('busy');
            
            if (pushToken && !isBusy) {
              await sendPingNotification(
                pushToken,
                user.displayName,
                message.trim(),
                pickerMode === 'groups' && selectedGroup ? selectedGroup.name : 'Direct Ping'
              );
            } else if (isBusy) {
              console.log(`Skipping notification for ${recipientId} - status is Busy`);
            }
          }
        } catch (notifError) {
          console.log('Failed to send notification to recipient:', recipientId, notifError);
        }
      }

      // Show local notification for sender too (only if sender is not busy)
      const senderIsBusy = user.status?.text?.toLowerCase().includes('busy');
      if (!senderIsBusy) {
        await scheduleLocalNotification(
          '🎉 Ping Sent!',
          `Your ping was sent to ${recipientName}`,
          { type: 'ping_sent' }
        );
      }

      Alert.alert('Success', `Ping sent to ${recipientName}!`);
      
      // Reset form
      setMessage('');
      setSelectedGroup(null);
      setSelectedFriends([]);
    } catch (error) {
      console.error('Error sending ping:', error);
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
        setShowPicker(false);
      }}
    >
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupMembers}>{item.members.length} members</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

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

  const renderFriendItem = ({ item }: { item: User }) => {
    const isSelected = selectedFriends.some(f => f.id === item.id);
    
    return (
      <TouchableOpacity
        style={styles.groupItem}
        onPress={() => toggleFriendSelection(item)}
      >
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.displayName}</Text>
          <Text style={styles.groupMembers}>{item.status.emoji} {item.status.text}</Text>
        </View>
        <Ionicons 
          name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
          size={24} 
          color={isSelected ? colors.primary : colors.textSecondary} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.label}>Send To</Text>
          
          {/* Tab selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, pickerMode === 'groups' && styles.activeTab]}
              onPress={() => setPickerMode('groups')}
            >
              <Text style={[styles.tabText, pickerMode === 'groups' && styles.activeTabText]}>
                Groups
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, pickerMode === 'friends' && styles.activeTab]}
              onPress={() => setPickerMode('friends')}
            >
              <Text style={[styles.tabText, pickerMode === 'friends' && styles.activeTabText]}>
                Friends
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Selection display */}
          <TouchableOpacity
            style={styles.groupSelector}
            onPress={() => setShowPicker(true)}
          >
            <Text style={[styles.groupSelectorText, (!selectedGroup && selectedFriends.length === 0) && styles.placeholder]}>
              {pickerMode === 'groups' 
                ? (selectedGroup ? selectedGroup.name : 'Choose a group...') 
                : (selectedFriends.length > 0 
                    ? `${selectedFriends.length} friend${selectedFriends.length > 1 ? 's' : ''} selected`
                    : 'Choose friends...')
              }
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="What's the plan? (e.g., Anyone down to get boba?)"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={200}
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={Keyboard.dismiss}
          />
          <Text style={styles.characterCount}>{message.length}/200</Text>

          <Text style={styles.label}>Expires In</Text>
          <TouchableOpacity
            style={styles.groupSelector}
            onPress={() => setShowExpirationModal(true)}
          >
            <View style={styles.expirationDisplay}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.groupSelectorText}>
                {getExpirationText()}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendButton, (
              (pickerMode === 'groups' && !selectedGroup) || 
              (pickerMode === 'friends' && selectedFriends.length === 0) || 
              !message.trim() || 
              sending
            ) && styles.sendButtonDisabled]}
            onPress={sendPing}
            disabled={
              (pickerMode === 'groups' && !selectedGroup) || 
              (pickerMode === 'friends' && selectedFriends.length === 0) || 
              !message.trim() || 
              sending
            }
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
          visible={showPicker}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {pickerMode === 'groups' ? 'Select Group' : 'Select Friends'}
              </Text>
              {pickerMode === 'friends' && selectedFriends.length > 0 ? (
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.modalDone}>Done</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.modalSpacer} />
              )}
            </View>
            
            {pickerMode === 'friends' && selectedFriends.length > 0 && (
              <View style={styles.selectedCount}>
                <Text style={styles.selectedCountText}>
                  {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''} selected
                </Text>
              </View>
            )}
            
            {pickerMode === 'groups' ? (
              <FlatList
                data={groups}
                renderItem={renderGroupItem}
                keyExtractor={(item) => item.id}
                style={styles.groupList}
              />
            ) : (
              <FlatList
                data={friends}
                renderItem={renderFriendItem}
                keyExtractor={(item) => item.id}
                style={styles.groupList}
              />
            )}
          </View>
        </Modal>

        {/* Expiration Time Picker Modal */}
        <Modal
          visible={showExpirationModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowExpirationModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowExpirationModal(false)}>
            <View style={styles.expirationModalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.expirationModalContent}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalSpacer} />
                    <Text style={styles.modalTitle}>Expires In</Text>
                    <TouchableOpacity onPress={() => setShowExpirationModal(false)}>
                      <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  
                  <FlatList
                    data={expirationOptions}
                    keyExtractor={(item) => item.value.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.expirationOption,
                          expirationMinutes === item.value && styles.expirationOptionSelected
                        ]}
                        onPress={() => handleExpirationSelect(item.value)}
                      >
                        <View style={styles.expirationOptionContent}>
                          <Ionicons 
                            name={item.value === -1 ? "create-outline" : "time-outline"} 
                            size={20} 
                            color={expirationMinutes === item.value ? colors.primary : colors.textSecondary} 
                          />
                          <Text style={[
                            styles.expirationOptionText,
                            expirationMinutes === item.value && styles.expirationOptionTextSelected
                          ]}>
                            {item.label}
                          </Text>
                        </View>
                        {expirationMinutes === item.value && (
                          <Ionicons name="checkmark" size={24} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SendPingScreen; 