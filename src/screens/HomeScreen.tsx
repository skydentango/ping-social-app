import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, StatusBar, Platform } from 'react-native';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { Ping, PingResponse } from '../types';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/theme';
import Card from '../components/Card';

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
              await deleteDoc(doc(db, 'pings', pingId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete ping');
            }
          },
        },
      ]
    );
  };

  const getUserResponse = (ping: Ping): PingResponse | undefined => {
    return ping.responses.find(r => r.userId === user?.id);
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
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

    return (
      <TouchableOpacity
        style={[
          styles.responseButton,
          isSelected && { backgroundColor: color, borderColor: color }
        ]}
        onPress={() => handleResponse(ping.id, responseType)}
      >
        <Ionicons 
          name={icon as any} 
          size={16} 
          color={isSelected ? colors.white : color} 
        />
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
              <Text style={styles.pingTime}>{getTimeAgo(item.sentAt)}</Text>
              {isMyPing && (
                <Text style={styles.yourPingLabel}>Your ping</Text>
              )}
            </View>
          </View>
        </View>
        
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
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  pingTime: {
    fontSize: typography.sm,
    color: colors.textSecondary,
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
});

export default HomeScreen; 