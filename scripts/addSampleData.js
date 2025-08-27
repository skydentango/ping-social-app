const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, setDoc, doc } = require('firebase/firestore');

// Your Firebase config (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyBX8F9qvQZK7wHVn8oY2pL3mN4jR5sT6uV",
  authDomain: "ping-social-app.firebaseapp.com",
  projectId: "ping-social-app",
  storageBucket: "ping-social-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample users (friends)
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

// Sample groups
const sampleGroups = [
  {
    name: 'College Friends',
    members: ['user_alice', 'user_bob', 'user_charlie'], // Add your user ID here
    createdBy: 'user_alice', // Replace with your user ID
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Work Squad',
    members: ['user_diana', 'user_ethan', 'user_alice'], // Add your user ID here
    createdBy: 'user_diana', // Replace with your user ID
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Weekend Crew',
    members: ['user_bob', 'user_charlie', 'user_diana', 'user_ethan'], // Add your user ID here
    createdBy: 'user_bob', // Replace with your user ID
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Study Group',
    members: ['user_alice', 'user_charlie', 'user_ethan'], // Add your user ID here
    createdBy: 'user_alice', // Replace with your user ID
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function addSampleData() {
  try {
    console.log('🚀 Adding sample users...');
    
    // Add sample users
    for (const user of sampleUsers) {
      await setDoc(doc(db, 'users', user.id), user);
      console.log(`✅ Added user: ${user.displayName}`);
    }

    console.log('\n🏢 Adding sample groups...');
    
    // Add sample groups
    for (const group of sampleGroups) {
      const docRef = await addDoc(collection(db, 'groups'), group);
      console.log(`✅ Added group: ${group.name} (ID: ${docRef.id})`);
    }

    console.log('\n🎉 Sample data added successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Replace the member arrays in groups with your actual user ID');
    console.log('2. Update createdBy fields with your user ID');
    console.log('3. Test the app - you should see friends and groups now!');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }
}

// Run the script
addSampleData(); 