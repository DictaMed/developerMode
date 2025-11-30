/**
 * User Migration Helper for DictaMed
 * 
 * This script helps with migrating existing users to Firebase Authentication
 * You can run this in the browser console for individual users or adapt it for bulk migration
 */

// Import Firebase Auth service
// Note: Make sure Firebase is properly configured before running this

/**
 * Example user data structure for migration
 * Replace with your actual user data
 */
const SAMPLE_USERS = [
    {
        oldUsername: "dr.martin",
        oldAccessCode: "ADMIN123",
        newEmail: "dr.martin@example.com",
        newPassword: "NewSecurePassword123"
    },
    {
        oldUsername: "nurse.anne", 
        oldAccessCode: "USER456",
        newEmail: "anne.laurent@example.com",
        newPassword: "SecurePassword123"
    }
    // Add more users as needed
];

/**
 * Migrate a single user
 */
async function migrateSingleUser(userData) {
    try {
        console.log(`Starting migration for user: ${userData.oldUsername}`);
        
        // Import the Firebase Auth service
        const { firebaseAuth } = await import('./firebase-auth-service.js');
        
        // Migrate the user
        const result = await firebaseAuth.migrateUser(
            userData.oldUsername,
            userData.oldAccessCode, 
            userData.newEmail,
            userData.newPassword
        );
        
        if (result.success) {
            console.log(`✅ Successfully migrated: ${userData.oldUsername}`);
            return { success: true, username: userData.oldUsername };
        } else {
            console.error(`❌ Failed to migrate: ${userData.oldUsername}`, result.error);
            return { success: false, username: userData.oldUsername, error: result.error };
        }
        
    } catch (error) {
        console.error(`Error migrating user ${userData.oldUsername}:`, error);
        return { success: false, username: userData.oldUsername, error: error.message };
    }
}

/**
 * Migrate multiple users (bulk migration)
 */
async function migrateMultipleUsers(usersArray) {
    console.log(`Starting bulk migration for ${usersArray.length} users...`);
    
    const results = [];
    const successCount = 0;
    const failureCount = 0;
    
    for (const user of usersArray) {
        console.log(`\n--- Migrating user ${usersArray.indexOf(user) + 1}/${usersArray.length} ---`);
        
        const result = await migrateSingleUser(user);
        results.push(result);
        
        if (result.success) {
            successCount++;
        } else {
            failureCount++;
        }
        
        // Add delay between migrations to avoid rate limiting
        if (usersArray.indexOf(user) < usersArray.length - 1) {
            console.log('Waiting 2 seconds before next migration...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Summary
    console.log('\n=== MIGRATION SUMMARY ===');
    console.log(`Total users: ${usersArray.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failureCount}`);
    console.log(`Success rate: ${((successCount / usersArray.length) * 100).toFixed(1)}%`);
    
    return {
        total: usersArray.length,
        successful: successCount,
        failed: failureCount,
        results: results
    };
}

/**
 * Validate user data before migration
 */
function validateUserData(userData) {
    const errors = [];
    
    if (!userData.oldUsername || userData.oldUsername.trim() === '') {
        errors.push('Old username is required');
    }
    
    if (!userData.oldAccessCode || userData.oldAccessCode.trim() === '') {
        errors.push('Old access code is required');
    }
    
    if (!userData.newEmail || !userData.newEmail.includes('@')) {
        errors.push('Valid email address is required');
    }
    
    if (!userData.newPassword || userData.newPassword.length < 6) {
        errors.push('Password must be at least 6 characters');
    }
    
    return errors;
}

/**
 * Validate migration data array
 */
function validateMigrationData(usersArray) {
    const validationResults = {
        valid: [],
        invalid: [],
        total: usersArray.length
    };
    
    usersArray.forEach((user, index) => {
        const errors = validateUserData(user);
        
        if (errors.length === 0) {
            validationResults.valid.push({
                index: index,
                username: user.oldUsername,
                email: user.newEmail
            });
        } else {
            validationResults.invalid.push({
                index: index,
                username: user.oldUsername,
                errors: errors
            });
        }
    });
    
    return validationResults;
}

/**
 * Generate migration report
 */
function generateMigrationReport(migrationResults) {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalUsers: migrationResults.total,
            successfulMigrations: migrationResults.successful,
            failedMigrations: migrationResults.failed,
            successRate: `${((migrationResults.successful / migrationResults.total) * 100).toFixed(1)}%`
        },
        successfulUsers: [],
        failedUsers: []
    };
    
    // Categorize results
    migrationResults.results.forEach(result => {
        if (result.success) {
            report.successfulUsers.push({
                oldUsername: result.username,
                newEmail: migrationResults.userData.find(u => u.oldUsername === result.username)?.newEmail,
                migratedAt: new Date().toISOString()
            });
        } else {
            report.failedUsers.push({
                oldUsername: result.username,
                error: result.error,
                failedAt: new Date().toISOString()
            });
        }
    });
    
    return report;
}

/**
 * Example usage functions
 */

// Example 1: Migrate a single user (for testing)
async function exampleMigrateSingleUser() {
    const testUser = {
        oldUsername: "test.user",
        oldAccessCode: "TEST123",
        newEmail: "test@example.com",
        newPassword: "TestPassword123"
    };
    
    console.log('Example: Migrating single user');
    const result = await migrateSingleUser(testUser);
    console.log('Migration result:', result);
}

// Example 2: Migrate multiple users
async function exampleMigrateMultipleUsers() {
    console.log('Example: Migrating multiple users');
    const results = await migrateMultipleUsers(SAMPLE_USERS);
    console.log('Bulk migration results:', results);
    
    // Generate and log report
    const report = generateMigrationReport(results);
    console.log('Migration report:', report);
}

// Example 3: Validate migration data
async function exampleValidateData() {
    console.log('Example: Validating migration data');
    const validation = validateMigrationData(SAMPLE_USERS);
    
    console.log(`Validation Results:`);
    console.log(`- Valid users: ${validation.valid.length}`);
    console.log(`- Invalid users: ${validation.invalid.length}`);
    
    if (validation.invalid.length > 0) {
        console.log('Invalid users:');
        validation.invalid.forEach(invalid => {
            console.log(`- ${invalid.username}: ${invalid.errors.join(', ')}`);
        });
    }
}

/**
 * Interactive migration function
 * Call this in browser console with custom user data
 */
async function interactiveMigration() {
    const oldUsername = prompt('Enter old username:');
    const oldAccessCode = prompt('Enter old access code:');
    const newEmail = prompt('Enter new email address:');
    const newPassword = prompt('Enter new password (min 6 chars):');
    
    if (!oldUsername || !oldAccessCode || !newEmail || !newPassword) {
        console.log('Migration cancelled - missing required fields');
        return;
    }
    
    const userData = {
        oldUsername: oldUsername.trim(),
        oldAccessCode: oldAccessCode.trim(),
        newEmail: newEmail.trim(),
        newPassword: newPassword.trim()
    };
    
    console.log('Migration data:', userData);
    
    const proceed = confirm('Proceed with migration?');
    if (proceed) {
        const result = await migrateSingleUser(userData);
        console.log('Migration result:', result);
        
        if (result.success) {
            alert(`Successfully migrated user: ${oldUsername}`);
        } else {
            alert(`Migration failed: ${result.error}`);
        }
    }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        migrateSingleUser,
        migrateMultipleUsers,
        validateUserData,
        validateMigrationData,
        generateMigrationReport,
        exampleMigrateSingleUser,
        exampleMigrateMultipleUsers,
        exampleValidateData,
        interactiveMigration
    };
}

// Make available in global scope for browser console
if (typeof window !== 'undefined') {
    window.DictaMedMigration = {
        migrateSingleUser,
        migrateMultipleUsers,
        validateUserData,
        validateMigrationData,
        generateMigrationReport,
        exampleMigrateSingleUser,
        exampleMigrateMultipleUsers,
        exampleValidateData,
        interactiveMigration,
        SAMPLE_USERS
    };
    
    console.log('DictaMed Migration Helper loaded!');
    console.log('Available functions:');
    console.log('- DictaMedMigration.interactiveMigration() - Interactive user migration');
    console.log('- DictaMedMigration.exampleMigrateSingleUser() - Example single user migration');
    console.log('- DictaMedMigration.exampleMigrateMultipleUsers() - Example bulk migration');
    console.log('- DictaMedMigration.exampleValidateData() - Example data validation');
}