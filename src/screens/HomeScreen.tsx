import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, StatusBar, Platform, RefreshControl, Modal, Image } from 'react-native';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ping, PingResponse, Group, User } from '../types';
import { getColors, typography, spacing, borderRadius, shadows } from '../utils/theme';
import Card from '../components/Card';

const HomeScreen = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const styles = createStyles(colors);
  const [pings, setPings] = useState<Ping[]>([]);
  const [groups, setGroups] = useState<{[key: string]: Group}>({});
  const [users, setUsers] = useState<{[key: string]: User}>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingTo, setRespondingTo] = useState<{[key: string]: string}>({}); // pingId -> responseType
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedResponseType, setSelectedResponseType] = useState<'yes' | 'no' | 'maybe' | null>(null);
  const [selectedPingResponses, setSelectedPingResponses] = useState<PingResponse[]>([]);

  useEffect(() => {
    if (!user) return;

    // Load pings
    const pingsQuery = query(
      collection(db, 'pings'),
      orderBy('sentAt', 'desc')
    );

    const unsubscribePings = onSnapshot(pingsQuery, async (snapshot) => {
      const allPings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate() || null,
        responses: doc.data().responses || []
      })) as Ping[];
      
      // Filter pings to only show ones the user should see AND not expired
      const userPings = allPings.filter(ping => {
        // User should see pings where they are in the recipients array
        const isRecipient = ping.recipients && ping.recipients.includes(user.id);
        
        // Check if ping is expired
        const isExpired = ping.expiresAt && new Date() > ping.expiresAt;
        
        return isRecipient && !isExpired;
      });
      
      // Load only the groups and users we need for these pings
      const groupIds = new Set<string>();
      const userIds = new Set<string>();
      
      userPings.forEach(ping => {
        if (ping.type === 'group' && ping.groupId) {
          groupIds.add(ping.groupId);
        }
        if (ping.recipients) {
          ping.recipients.forEach(userId => userIds.add(userId));
        }
      });

      // Load required groups
      const groupsMap: {[key: string]: Group} = {};
      for (const groupId of groupIds) {
        try {
          const groupDoc = await getDoc(doc(db, 'groups', groupId));
          if (groupDoc.exists()) {
            groupsMap[groupId] = {
              id: groupId,
              ...groupDoc.data(),
              createdAt: groupDoc.data().createdAt?.toDate() || new Date(),
              updatedAt: groupDoc.data().updatedAt?.toDate() || new Date(),
            } as Group;
          }
        } catch (error) {
          console.log('Could not load group:', groupId);
        }
      }

      // Load required users
      const usersMap: {[key: string]: User} = {};
      for (const userId of userIds) {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            usersMap[userId] = {
              id: userId,
              ...userDoc.data(),
              createdAt: userDoc.data().createdAt?.toDate() || new Date(),
              updatedAt: userDoc.data().updatedAt?.toDate() || new Date(),
              status: {
                emoji: userDoc.data().status?.emoji || '🟢',
                text: userDoc.data().status?.text || 'Free',
                updatedAt: userDoc.data().status?.updatedAt?.toDate() || new Date(),
              }
            } as User;
          }
        } catch (error) {
          console.log('Could not load user:', userId);
        }
      }

      setGroups(groupsMap);
      setUsers(usersMap);
      setPings(userPings);
      setLoading(false);
    });

    return unsubscribePings;
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    // The onSnapshot listener will automatically update with fresh data
    // We just need to simulate a brief refresh period for user feedback
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getPingRecipientText = (ping: Ping): string => {
    if (ping.type === 'group' && ping.groupId && groups[ping.groupId]) {
      return `👥 ${groups[ping.groupId].name}`;
    } else if (ping.type === 'friends' && ping.recipients) {
      // Filter out the sender from recipients to show only the actual friends
      const friendIds = ping.recipients.filter(id => id !== ping.senderId);
      const friendNames = friendIds.map(id => users[id]?.displayName || 'Friend').slice(0, 3);
      
      if (friendNames.length === 0) {
        return '👤 Friends';
      } else if (friendNames.length === 1) {
        return `👤 ${friendNames[0]}`;
      } else if (friendNames.length === 2) {
        return `👤 ${friendNames[0]} & ${friendNames[1]}`;
      } else {
        const remaining = friendIds.length - 2;
        return `👤 ${friendNames[0]}, ${friendNames[1]} & ${remaining} more`;
      }
    }
    
    // Fallback
    return ping.type === 'group' ? '👥 Group' : '👤 Friends';
  };

  const handleResponse = async (pingId: string, response: 'yes' | 'no' | 'maybe') => {
    if (!user) return;

    // Check if user already selected this response - if so, unselect it
    const ping = pings.find(p => p.id === pingId);
    const currentUserResponse = ping?.responses.find(r => r.userId === user.id);
    const isUnselectingSameResponse = currentUserResponse?.response === response;

    // Set loading state for this specific ping
    setRespondingTo(prev => ({ ...prev, [pingId]: response }));

    // Determine new responses array
    const getNewResponses = (existingResponses: PingResponse[]) => {
      const filteredResponses = existingResponses.filter(r => r.userId !== user.id);
      
      // If unselecting, just return filtered (removes user's response)
      if (isUnselectingSameResponse) {
        return filteredResponses;
      }
      
      // Otherwise, add the new response
      const newResponse: PingResponse = {
        userId: user.id,
        response,
        respondedAt: new Date()
      };
      return [...filteredResponses, newResponse];
    };

    // Optimistic update - immediately update the UI
    setPings(prevPings => 
      prevPings.map(p => {
        if (p.id === pingId) {
          return {
            ...p,
            responses: getNewResponses(p.responses)
          };
        }
        return p;
      })
    );

    try {
      // Update Firebase in the background
      const pingRef = doc(db, 'pings', pingId);
      if (ping) {
        await updateDoc(pingRef, {
          responses: getNewResponses(ping.responses)
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setPings(prevPings => 
        prevPings.map(p => {
          if (p.id === pingId) {
            return {
              ...p,
              responses: ping?.responses || []
            };
          }
          return p;
        })
      );
      Alert.alert('Error', 'Failed to respond to ping. Please try again.');
    } finally {
      // Clear loading state
      setRespondingTo(prev => {
        const newState = { ...prev };
        delete newState[pingId];
        return newState;
      });
    }
  };

  const handleDeletePing = async (pingId: string) => {
    if (!user) return;

    Alert.alert(
      'Delete Ping',
      'Are you sure you want to delete this ping? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistic deletion - remove from UI immediately
              const originalPings = pings;
              setPings(prevPings => prevPings.filter(p => p.id !== pingId));
              
              try {
                await deleteDoc(doc(db, 'pings', pingId));
              } catch (deleteError) {
                // Revert optimistic deletion on error
                setPings(originalPings);
                throw deleteError;
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              Alert.alert('Error', `Failed to delete ping: ${errorMessage}`);
            }
          },
        },
      ]
    );
  };

  const getUserResponse = (ping: Ping): PingResponse | undefined => {
    return ping.responses.find(r => r.userId === user?.id);
  };

  const getTimeAgo = (date: Date | any): string => {
    const now = new Date();
    // Ensure date is a proper Date object
    const dateObj = date instanceof Date ? date : (date?.toDate ? date.toDate() : new Date(date));
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const showResponseDetails = (ping: Ping, responseType: 'yes' | 'no' | 'maybe') => {
    const responsesOfType = ping.responses.filter(r => r.response === responseType);
    
    // Only show if there's at least one response
    if (responsesOfType.length > 0) {
      setSelectedResponseType(responseType);
      setSelectedPingResponses(responsesOfType);
      setShowResponseModal(true);
    }
  };

  const renderResponseButton = (
    ping: Ping, 
    responseType: 'yes' | 'no' | 'maybe', 
    icon: string, 
    color: string,
    label: string
  ) => {
    const userResponse = getUserResponse(ping);
    const isSelected = userResponse?.response === responseType;
    const count = ping.responses.filter(r => r.response === responseType).length;
    const isLoading = respondingTo[ping.id] === responseType;

    return (
      <TouchableOpacity
        style={[
          styles.responseButton,
          isSelected && { backgroundColor: color, borderColor: color },
          isLoading && styles.responseButtonLoading
        ]}
        onPress={() => handleResponse(ping.id, responseType)}
        onLongPress={() => showResponseDetails(ping, responseType)}
        disabled={isLoading}
      >
        {isLoading ? (
          <Ionicons 
            name="hourglass" 
            size={16} 
            color={isSelected ? colors.white : color} 
          />
        ) : (
          <Ionicons 
            name={icon as any} 
            size={16} 
            color={isSelected ? colors.white : color} 
          />
        )}
        <Text style={[
          styles.responseButtonText,
          isSelected && { color: colors.white }
        ]}>
          {label}
        </Text>
        {count > 0 && (
          <View style={[styles.responseBadge, { backgroundColor: isSelected ? colors.white : color }]}>
            <Text style={[styles.responseBadgeText, { color: isSelected ? color : colors.white }]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderPing = ({ item }: { item: Ping }) => {
    const isMyPing = item.senderId === user?.id;
    
    // Calculate expiration progress
    const getExpirationProgress = () => {
      if (!item.expiresAt) return null;
      
      const now = new Date().getTime();
      const sent = item.sentAt.getTime();
      const expires = item.expiresAt.getTime();
      const total = expires - sent;
      const remaining = expires - now;
      const progress = Math.max(0, Math.min(1, remaining / total));
      
      return {
        progress,
        timeRemaining: Math.max(0, Math.ceil(remaining / (1000 * 60))), // minutes
        isExpiringSoon: remaining < 15 * 60 * 1000, // Less than 15 minutes
      };
    };

    const expirationData = getExpirationProgress();

    return (
      <Card style={styles.pingCard} shadow="small">
        <View style={styles.pingHeader}>
          <View style={styles.pingInfo}>
            <View style={styles.pingMessageRow}>
              <Text style={styles.pingMessage}>{item.message}</Text>
              {isMyPing && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePing(item.id)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.pingMetaRow}>
              <View style={styles.pingTimeContainer}>
                <Text style={styles.pingTime}>{getTimeAgo(item.sentAt)}</Text>
                <Text style={styles.pingType}>
                  {getPingRecipientText(item)}
                </Text>
              </View>
              {isMyPing && (
                <Text style={styles.yourPingLabel}>Your ping</Text>
              )}
            </View>
          </View>
        </View>
        
        {/* Expiration Progress Bar */}
        {expirationData && (
          <View style={styles.expirationContainer}>
            <View style={styles.expirationHeader}>
              <View style={styles.expirationTextContainer}>
                <Ionicons 
                  name="time-outline" 
                  size={14} 
                  color={expirationData.isExpiringSoon ? colors.error : colors.textSecondary} 
                />
                <Text style={[
                  styles.expirationText,
                  expirationData.isExpiringSoon && styles.expirationTextUrgent
                ]}>
                  {expirationData.timeRemaining < 60 
                    ? `${expirationData.timeRemaining}m remaining`
                    : `${Math.floor(expirationData.timeRemaining / 60)}h ${expirationData.timeRemaining % 60}m remaining`
                  }
                </Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${expirationData.progress * 100}%`,
                    backgroundColor: expirationData.isExpiringSoon ? colors.error : colors.primary 
                  }
                ]} 
              />
            </View>
          </View>
        )}
        
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>Your response</Text>
          <View style={styles.responseButtons}>
            {renderResponseButton(item, 'yes', 'checkmark-circle', colors.success, 'Yes')}
            {renderResponseButton(item, 'maybe', 'help-circle', colors.warning, 'Maybe')}
            {renderResponseButton(item, 'no', 'close-circle', colors.error, 'No')}
          </View>
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="chatbubbles-outline" size={64} color={colors.gray300} />
      </View>
      <Text style={styles.emptyTitle}>No pings yet</Text>
      <Text style={styles.emptySubtitle}>
        When friends send pings, they'll appear here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading pings...</Text>
        </View>
      ) : pings.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={pings}
          renderItem={renderPing}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Response Details Modal */}
      <Modal
        visible={showResponseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowResponseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedResponseType === 'yes' && '✅ Yes Responses'}
                {selectedResponseType === 'maybe' && '🤔 Maybe Responses'}
                {selectedResponseType === 'no' && '❌ No Responses'}
              </Text>
              <TouchableOpacity onPress={() => setShowResponseModal(false)}>
                <Ionicons name="close" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedPingResponses.map((response, index) => {
                const respondent = users[response.userId];
                const hasProfilePicture = respondent?.profilePicture && respondent.profilePicture.trim() !== '';
                
                return (
                  <View key={index} style={styles.responseItem}>
                    <View style={styles.responseUserInfo}>
                      <View style={styles.responseAvatar}>
                        {hasProfilePicture ? (
                          <Image 
                            source={{ uri: respondent.profilePicture }} 
                            style={styles.responseAvatarImage}
                          />
                        ) : (
                          <Text style={styles.responseAvatarText}>
                            {respondent?.displayName?.charAt(0).toUpperCase() || '?'}
                          </Text>
                        )}
                      </View>
                      <View style={styles.responseDetails}>
                        <Text style={styles.responseName}>
                          {respondent?.displayName || 'Unknown'}
                          {response.userId === user?.id && ' (You)'}
                        </Text>
                        <Text style={styles.responseTime}>
                          {getTimeAgo(response.respondedAt)}
                        </Text>
                      </View>
                    </View>
                    {respondent?.status && (
                      <Text style={styles.responseStatus}>
                        {respondent.status.emoji} {respondent.status.text}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  listContainer: {
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.xl,
  },
  pingCard: {
    marginBottom: spacing.md,
  },
  pingHeader: {
    marginBottom: spacing.sm,
  },
  pingInfo: {
    flex: 1,
  },
  pingMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  pingMessage: {
    flex: 1,
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    lineHeight: 22,
    marginRight: spacing.sm,
  },
  deleteButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray50,
  },
  pingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pingTimeContainer: {
    flexDirection: 'column',
  },
  pingTime: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  pingType: {
    fontSize: typography.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  yourPingLabel: {
    fontSize: typography.xs,
    color: colors.primary,
    fontWeight: typography.medium,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  responseContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.sm,
  },
  expirationContainer: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  expirationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  expirationTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expirationText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  expirationTextUrgent: {
    color: colors.error,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  responseLabel: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  responseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginHorizontal: 2,
    position: 'relative',
    minHeight: 36,
  },
  responseButtonLoading: {
    opacity: 0.7,
  },
  responseButtonText: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  responseBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseBadgeText: {
    fontSize: 10,
    fontWeight: typography.bold,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  modalBody: {
    padding: spacing.md,
  },
  responseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  responseUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  responseAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  responseAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  responseAvatarText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  responseDetails: {
    flex: 1,
  },
  responseName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  responseTime: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  responseStatus: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
});

export default HomeScreen; 