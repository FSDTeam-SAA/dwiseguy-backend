import mongoose from 'mongoose';
import { Instrument } from '../modules/instrument/instrument.model';
import { Module } from '../modules/module/module.model';
import { Lesson } from '../modules/lesson/lesson.model';
import config from '../config/config'; // Ensure this points to your DB URI

const seedDatabase = async () => {
  try {
    // 1. Connect to Database
    await mongoose.connect(config.database.uri as string);
    //console.log("Connected to DB for seeding...");

    // 2. Clear Existing Data (Careful! This wipes these collections)
    await Instrument.deleteMany({});
    await Module.deleteMany({});
    await Lesson.deleteMany({});
    //console.log("Cleared old curriculum data.");

    // 3. Create an Instrument
    const instrument = await Instrument.create({
      instrumentTitle: "Piano Basics",        // Changed from title
      instrumentDescription: "Fundamentals",  // Changed from description
      instructor: "Master Mozart",
      level: "beginner",                      // Try lowercase 'beginner' 
      thumbnail: "piano-thumb.jpg",
      modules: []
    });

    // 4. Create Modules (Formerly Lessons)
    const module1 = await Module.create({
      instrumentId: instrument._id,
      title: "Module 1: Introduction to Keys",
      description: "Getting to know the white and black keys",
      order: 1,
      images: [{ url: "keys.jpg", public_id: "p1" }],
      lessons: []
    });

    const module2 = await Module.create({
      instrumentId: instrument._id,
      title: "Module 2: Basic Chords",
      description: "Playing your first C-Major chord",
      order: 2,
      images: [{ url: "chords.jpg", public_id: "p2" }],
      lessons: []
    });

    // 5. Create Lessons (Formerly Sublessons)
    const lesson1 = await Lesson.create({
      moduleId: module1._id,
      title: "The White Keys",
      content: "Explanation of A, B, C, D, E, F, G...",
      media: { images: [], audio: null },
      isExercise: false,
      order: 1
    });

    const lesson2 = await Lesson.create({
      moduleId: module1._id,
      title: "The Black Keys",
      content: "Understanding sharps and flats",
      media: { images: [], audio: null },
      isExercise: true, // Piano exercise trigger
      order: 2
    });

    // 6. Link Everything (The "Chain" Sync)
    await Instrument.findByIdAndUpdate(instrument._id, {
      $push: { modules: { $each: [module1._id, module2._id] } }
    });

    await Module.findByIdAndUpdate(module1._id, {
      $push: { lessons: { $each: [lesson1._id, lesson2._id] } }
    });

    //console.log("✅ Database seeded successfully!");
    //console.log(`Instrument ID: ${instrument._id}`);
    //console.log(`Module ID: ${module1._id}`);
    //console.log(`Lesson ID: ${lesson1._id}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();