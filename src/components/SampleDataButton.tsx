import React, { useState } from 'react';
import { TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { collection, addDoc, setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { colors, typography, spacing, borderRadius } from '../utils/theme';

const SampleDataButton = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const sampleUsers = [
    {
      id: 'user_alice',
      email: 'alice@example.com',
      displayName: 'Alice Johnson',
      profilePicture: '',
      status: {
        emoji: '🟢',
        text: 'Free',
        updatedAt: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'user_bob',
      email: 'bob@example.com',
      displayName: 'Bob Smith',
      profilePicture: '',
      status: {
        emoji: '🟡',
        text: 'Maybe',
        updatedAt: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'user_charlie',
      email: 'charlie@example.com',
      displayName: 'Charlie Brown',
      profilePicture: '',
      status: {
        emoji: '🔴',
        text: 'Busy',
        updatedAt: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'user_diana',
      email: 'diana@example.com',
      displayName: 'Diana Prince',
      profilePicture: '',
      status: {
        emoji: '🟢',
        text: 'Free',
        updatedAt: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'user_ethan',
      email: 'ethan@example.com',
      displayName: 'Ethan Hunt',
      profilePicture: '',
      status: {
        emoji: '🟡',
        text: 'Maybe',
        updatedAt: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const getSampleGroups = (userId: string) => [
    {
      name: 'College Friends',
      members: [userId, 'user_alice', 'user_bob', 'user_charlie'],
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Work Squad',
      members: [userId, 'user_diana', 'user_ethan', 'user_alice'],
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Weekend Crew',
      members: [userId, 'user_bob', 'user_charlie', 'user_diana', 'user_ethan'],
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Study Group',
      members: [userId, 'user_alice', 'user_charlie'],
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const addSampleData = async () => {
    if (!user) return;

    Alert.alert(
      'Add Sample Data',
      'This will add 5 sample friends and 4 sample groups to test with. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Sample Data',
          onPress: async () => {
            setLoading(true);
            try {
              let usersAdded = 0;
              let groupsAdded = 0;

              // Check and add sample users
              for (const sampleUser of sampleUsers) {
                const userDoc = await getDoc(doc(db, 'users', sampleUser.id));
                if (!userDoc.exists()) {
                  await setDoc(doc(db, 'users', sampleUser.id), sampleUser);
                  usersAdded++;
                } else {
                  console.log(`User ${sampleUser.displayName} already exists, skipping...`);
                }
              }

              // Add sample groups (always add new ones since they have unique IDs)
              const sampleGroups = getSampleGroups(user.id);
              for (const group of sampleGroups) {
                await addDoc(collection(db, 'groups'), group);
                groupsAdded++;
              }

              Alert.alert(
                'Success! 🎉',
                `Sample data processed!\n\n` +
                `✅ ${usersAdded} new friends added\n` +
                `✅ ${groupsAdded} new groups created\n` +
                `⏭️ ${sampleUsers.length - usersAdded} friends already existed\n\n` +
                'You can now test sending pings to groups or individual friends!'
              );
            } catch (error: any) {
              console.error('Error adding sample data:', error);
              Alert.alert(
                'Error Details', 
                `Failed to add sample data:\n\n${error.message || error.toString()}\n\nCheck the console for more details.`
              );
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={addSampleData}
      disabled={loading}
    >
      <Text style={styles.buttonText}>
        {loading ? 'Adding Sample Data...' : '🧪 Add Sample Data'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: '600',
  },
});

export default SampleDataButton; 