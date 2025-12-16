import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { Comment } from '../models/Comment';

dotenv.config();

async function seed() {
  try {
    await connectDatabase();

    // Clear existing data
    await User.deleteMany({});
    await Event.deleteMany({});
    await Registration.deleteMany({});
    await Comment.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create users
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'ADMIN',
      },
      {
        name: 'John Organizer',
        email: 'organizer@example.com',
        password: 'password123',
        role: 'ORGANIZER',
      },
      {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        role: 'USER',
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'password123',
        role: 'USER',
      },
    ]);

    console.log(`✅ Created ${users.length} users`);

    const [admin, organizer, jane, bob] = users;

    // Create events with future dates
    const now = new Date();
    const events = await Event.create([
      {
        title: 'Tech Conference 2025',
        description:
          'Join us for an exciting tech conference featuring the latest innovations in software development, AI, and cloud computing.',
        date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        location: 'San Francisco Convention Center',
        capacity: 500,
        organizerId: organizer._id,
        status: 'PUBLISHED',
        category: 'CONFERENCE',
      },
      {
        title: 'React Workshop',
        description:
          'Hands-on workshop on React hooks, context API, and modern React patterns.',
        date: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        location: 'Online',
        capacity: 50,
        organizerId: organizer._id,
        status: 'PUBLISHED',
        category: 'WORKSHOP',
      },
      {
        title: 'Networking Mixer',
        description: 'Meet fellow developers and expand your professional network.',
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        location: 'Downtown Bar & Grill',
        capacity: 100,
        organizerId: organizer._id,
        status: 'PUBLISHED',
        category: 'NETWORKING',
      },
      {
        title: 'GraphQL Seminar',
        description: 'Deep dive into GraphQL queries, mutations, and subscriptions.',
        date: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        location: 'Tech Hub Building',
        capacity: 75,
        organizerId: organizer._id,
        status: 'DRAFT',
        category: 'SEMINAR',
      },
    ]);

    console.log(`✅ Created ${events.length} events`);

    const [techConference, reactWorkshop, networkingMixer, graphqlSeminar] = events;

    // Create registrations
    const registrations = await Registration.create([
      {
        userId: jane._id,
        eventId: techConference._id,
        status: 'CONFIRMED',
        notes: 'Looking forward to it!',
      },
      {
        userId: bob._id,
        eventId: techConference._id,
        status: 'PENDING',
      },
      {
        userId: jane._id,
        eventId: reactWorkshop._id,
        status: 'CONFIRMED',
      },
      {
        userId: bob._id,
        eventId: networkingMixer._id,
        status: 'CONFIRMED',
      },
    ]);

    console.log(`✅ Created ${registrations.length} registrations`);

    // Create comments
    const comments = await Comment.create([
      {
        userId: jane._id,
        eventId: techConference._id,
        content: 'This looks amazing! Can\'t wait to attend.',
        rating: 5,
      },
      {
        userId: bob._id,
        eventId: techConference._id,
        content: 'Great lineup of speakers!',
        rating: 4,
      },
      {
        userId: jane._id,
        eventId: reactWorkshop._id,
        content: 'Perfect for beginners!',
        rating: 5,
      },
    ]);

    console.log(`✅ Created ${comments.length} comments`);

    console.log('\n📊 Seed Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Events: ${events.length}`);
    console.log(`   Registrations: ${registrations.length}`);
    console.log(`   Comments: ${comments.length}`);
    console.log('\n✅ Seeding completed successfully!');
    console.log('\n🔑 Test Credentials:');
    console.log('   Admin: admin@example.com / password123');
    console.log('   Organizer: organizer@example.com / password123');
    console.log('   User: jane@example.com / password123');

    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}

seed();

