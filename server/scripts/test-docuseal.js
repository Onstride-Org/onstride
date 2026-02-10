/**
 * Test DocuSeal integration
 */

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const docuseal = require('../src/services/docuseal');

const DIVIDER = '─'.repeat(50);

async function testDocuseal() {
  console.log(`\n${DIVIDER}`);
  console.log('  DocuSeal Integration Test');
  console.log(DIVIDER);

  // 1. Check configuration
  console.log('\n1. Configuration');
  console.log(`   API URL:          ${process.env.DOCUSEAL_API_URL || 'https://api.docuseal.com'}`);
  console.log(`   API Key:          ${process.env.DOCUSEAL_API_KEY ? '****' + process.env.DOCUSEAL_API_KEY.slice(-8) : '(not set)'}`);
  console.log(`   Application Email: ${process.env.WINDCAVE_APPLICATION_EMAIL}`);
  console.log(`   isConfigured():   ${docuseal.isConfigured() ? '✅ Yes' : '❌ No'}`);

  if (!docuseal.isConfigured()) {
    console.log('\n❌ DocuSeal is not configured. Add DOCUSEAL_API_KEY to .env');
    process.exit(1);
  }

  // 2. List templates
  console.log('\n2. List Templates');
  try {
    const templates = await docuseal.listTemplates();
    console.log(`   Found: ${templates.length} template(s)`);
    for (const t of templates) {
      console.log(`   📄 [${t.id}] ${t.name} (created: ${t.created_at})`);
    }
    if (templates.length === 0) {
      console.log('   (No templates yet — upload a PDF via the admin dashboard)');
    }
  } catch (err) {
    console.error(`   ❌ Failed: ${err.response?.data?.error || err.message}`);
    if (err.response?.status === 401) {
      console.error('   → API key is invalid. Check DOCUSEAL_API_KEY.');
    }
    process.exit(1);
  }

  // 3. Summary
  console.log(`\n${DIVIDER}`);
  console.log('  ✅ DocuSeal API connection verified!');
  console.log(DIVIDER);
  console.log();
}

testDocuseal();
