// Test script for QA Notes data structure migration
// This can be run in browser console to test the migration function

// Test data with old structure (title + content)
const oldStructureData = [
    { title: "Performance Observation", content: "Response times were good" },
    { title: "Memory Usage", content: "Memory peaked at 85%" },
    { content: "No title provided" }, // Content only
    { title: "Title only" }, // Title only
    { note: "Already correct structure" }, // Already new structure
    { someOtherField: "Unknown structure" } // Unknown structure
];

// Test data with mixed structures
const mixedData = [
    { note: "Standard note" },
    { title: "Old Title", content: "Old Content" },
    { content: "Content without title" }
];

// Migration function (copy from performance_report.js)
function migrateQANotesData(qaData) {
    if (!Array.isArray(qaData)) return [];
    
    return qaData.map(item => {
        // If it has the old structure (title + content), convert to new structure (note)
        if (item.title && item.content) {
            return { note: `${item.title}: ${item.content}` };
        }
        // If it has title but no content, use title as note
        else if (item.title && !item.content) {
            return { note: item.title };
        }
        // If it has content but no title, use content as note
        else if (item.content && !item.title) {
            return { note: item.content };
        }
        // If it already has the new structure, keep it
        else if (item.note) {
            return item;
        }
        // Fallback for any other structure
        else {
            return { note: JSON.stringify(item) };
        }
    });
}

// Run tests
console.log('=== QA Notes Migration Test ===');

console.log('\n1. Testing old structure data:');
console.log('Input:', oldStructureData);
const migratedOld = migrateQANotesData(oldStructureData);
console.log('Output:', migratedOld);

console.log('\n2. Testing mixed structure data:');
console.log('Input:', mixedData);
const migratedMixed = migrateQANotesData(mixedData);
console.log('Output:', migratedMixed);

console.log('\n3. Testing edge cases:');
console.log('Empty array:', migrateQANotesData([]));
console.log('Null input:', migrateQANotesData(null));
console.log('Non-array input:', migrateQANotesData("not an array"));

// Verify all outputs have the correct structure
function validateMigratedData(data) {
    return data.every(item => 
        typeof item === 'object' && 
        item.hasOwnProperty('note') && 
        typeof item.note === 'string'
    );
}

console.log('\n4. Validation Results:');
console.log('Old structure migration valid:', validateMigratedData(migratedOld));
console.log('Mixed structure migration valid:', validateMigratedData(migratedMixed));

console.log('\n=== Test Complete ===');

// Expected output verification
const expectedOldOutput = [
    { note: "Performance Observation: Response times were good" },
    { note: "Memory Usage: Memory peaked at 85%" },
    { note: "No title provided" },
    { note: "Title only" },
    { note: "Already correct structure" },
    { note: '{"someOtherField":"Unknown structure"}' }
];

console.log('\n5. Expected vs Actual Comparison:');
console.log('Expected:', expectedOldOutput);
console.log('Actual:', migratedOld);
console.log('Match:', JSON.stringify(expectedOldOutput) === JSON.stringify(migratedOld));