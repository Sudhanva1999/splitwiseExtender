#!/usr/bin/env node

/**
 * Splitwise Groups Fetcher
 * 
 * This script fetches all Splitwise groups you're a member of
 * and displays their IDs and names so you can pick the right group ID for your .env file
 * 
 * Usage: node scripts/fetchGroups.js
 */

import 'dotenv/config';
import fetch from 'node-fetch';

const SPLITWISE_API_BASE = 'https://secure.splitwise.com/api/v3.0';

async function fetchAllGroups() {
  const apiKey = process.env.VITE_SPLITWISE_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: VITE_SPLITWISE_API_KEY not found in .env file');
    console.log('\nPlease add your Splitwise API key to the .env file:');
    console.log('VITE_SPLITWISE_API_KEY=your-api-key-here\n');
    process.exit(1);
  }

  console.log('🔍 Fetching your Splitwise groups...\n');

  try {
    const response = await fetch(`${SPLITWISE_API_BASE}/get_groups`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    const groups = data.groups || [];

    if (groups.length === 0) {
      console.log('📭 No groups found. Create a group on Splitwise first!');
      console.log('Visit: https://secure.splitwise.com/groups/new\n');
      return;
    }

    console.log(`✅ Found ${groups.length} group(s):\n`);
    console.log('=' .repeat(80));

    groups.forEach((group, index) => {
      console.log(`\n${index + 1}. ${group.name}`);
      console.log(`   Group ID: ${group.id}`);
      console.log(`   Members: ${group.members ? group.members.length : 0}`);
      
      if (group.members && group.members.length > 0) {
        const memberNames = group.members
          .map(m => `${m.first_name} ${m.last_name || ''}`.trim())
          .join(', ');
        console.log(`   → ${memberNames}`);
      }
      
      if (group.simplify_by_default !== undefined) {
        console.log(`   Simplify debts: ${group.simplify_by_default ? 'Yes' : 'No'}`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n📝 To use a group, add this to your .env file:');
    console.log(`VITE_SPLITWISE_GROUP_ID=${groups[0].id}`);
    console.log('\n(Replace with the Group ID of your choice from the list above)\n');

  } catch (error) {
    console.error('❌ Error fetching groups:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n💡 Your API key might be invalid. Get a new one at:');
      console.log('https://secure.splitwise.com/apps\n');
    } else if (error.message.includes('fetch')) {
      console.log('\n💡 Check your internet connection\n');
    }
    
    process.exit(1);
  }
}

// Run the script
fetchAllGroups();

