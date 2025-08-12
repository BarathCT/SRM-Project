import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Paper from './models/Paper.js';

dotenv.config();

async function diagnosePaperSchema() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const schema = Paper.schema;
    console.log('\n🔍 Paper Schema Detailed Analysis:');
    console.log('==================================');

    // Get specific info about subjectArea and subjectCategories
    const subjectAreaPath = schema.path('subjectArea');
    const subjectCategoriesPath = schema.path('subjectCategories');

    console.log('\n📋 subjectArea field:');
    console.log('--------------------');
    if (subjectAreaPath) {
      console.log('Type:', subjectAreaPath.instance);
      console.log('Required:', subjectAreaPath.isRequired);
      console.log('Enum values:', subjectAreaPath.enumValues);
      console.log('Validators:', subjectAreaPath.validators.length);
      
      // Try to get the enum values or options
      if (subjectAreaPath.options) {
        console.log('Options:', JSON.stringify(subjectAreaPath.options, null, 2));
      }
    } else {
      console.log('subjectArea field not found in schema');
    }

    console.log('\n📋 subjectCategories field:');
    console.log('---------------------------');
    if (subjectCategoriesPath) {
      console.log('Type:', subjectCategoriesPath.instance);
      console.log('Required:', subjectCategoriesPath.isRequired);
      console.log('Validators:', subjectCategoriesPath.validators.length);
      
      if (subjectCategoriesPath.options) {
        console.log('Options:', JSON.stringify(subjectCategoriesPath.options, null, 2));
      }
      
      // Check if it's an array and what the array contains
      if (subjectCategoriesPath.schema) {
        console.log('Array element type:', subjectCategoriesPath.schema.instance);
        console.log('Array element options:', JSON.stringify(subjectCategoriesPath.schema.options, null, 2));
      }
    } else {
      console.log('subjectCategories field not found in schema');
    }

    // List all schema paths to see the full structure
    console.log('\n📋 All Schema Fields:');
    console.log('=====================');
    schema.eachPath((pathname, schematype) => {
      console.log(`${pathname}: ${schematype.instance} ${schematype.isRequired ? '(required)' : ''}`);
    });

    // Try different test documents to understand the validation
    console.log('\n🧪 Testing Different Subject Area Values:');
    console.log('==========================================');

    const testSubjectAreas = [
      'Computer Science',
      'Engineering', 
      'Mathematics',
      'Medicine',
      'Arts and Humanities'
    ];

    for (const subjectArea of testSubjectAreas) {
      console.log(`\nTesting subjectArea: "${subjectArea}"`);
      try {
        const testDoc = new Paper({
          authors: [{ name: 'Test Author', isCorresponding: true }],
          title: 'Test Paper Title',
          journal: 'Test Journal',
          publisher: 'Test Publisher',
          volume: '1',
          issue: '1',
          pageNo: '1-10',
          doi: '10.1234/test.2025.001',
          publicationType: 'scopus',
          facultyId: 'FAC-0001',
          publicationId: '12345678901',
          year: 2025,
          claimedBy: 'Test Author',
          authorNo: '1',
          isStudentScholar: 'no',
          studentScholars: [],
          qRating: 'Q1',
          typeOfIssue: 'Regular Issue',
          subjectArea: subjectArea,
          subjectCategories: ['Artificial Intelligence'] // Try a common category
        });

        await testDoc.validate();
        console.log(`✅ "${subjectArea}" - VALID`);
        
      } catch (error) {
        console.log(`❌ "${subjectArea}" - INVALID: ${error.message}`);
      }
    }

    // Test different category combinations
    console.log('\n🧪 Testing Different Category Combinations:');
    console.log('===========================================');

    const testCategories = [
      ['Artificial Intelligence'],
      ['Computer Science Applications'],
      ['Software'],
      ['Engineering (miscellaneous)'],
      ['Applied Mathematics'],
      ['Medicine (miscellaneous)']
    ];

    for (const categories of testCategories) {
      console.log(`\nTesting categories: ${JSON.stringify(categories)}`);
      try {
        const testDoc = new Paper({
          authors: [{ name: 'Test Author', isCorresponding: true }],
          title: 'Test Paper Title',
          journal: 'Test Journal',
          publisher: 'Test Publisher',
          volume: '1',
          issue: '1', 
          pageNo: '1-10',
          doi: '10.1234/test.2025.002',
          publicationType: 'scopus',
          facultyId: 'FAC-0001',
          publicationId: '12345678902',
          year: 2025,
          claimedBy: 'Test Author',
          authorNo: '1',
          isStudentScholar: 'no',
          studentScholars: [],
          qRating: 'Q1',
          typeOfIssue: 'Regular Issue',
          subjectArea: 'Computer Science',
          subjectCategories: categories
        });

        await testDoc.validate();
        console.log(`✅ ${JSON.stringify(categories)} - VALID`);
        
      } catch (error) {
        console.log(`❌ ${JSON.stringify(categories)} - INVALID: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

diagnosePaperSchema();