#!/usr/bin/env node

/**
 * Component Scaffolding CLI
 * 
 * Usage:
 *   npm run scaffold:list MyEntity
 *   npm run scaffold:detail MyEntity
 *   npm run scaffold:dashboard MyModule
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const templates = {
  list: require('./templates/list-page.template'),
  detail: require('./templates/detail-page.template'),
  dashboard: require('./templates/dashboard-page.template'),
};

async function scaffold() {
  console.log('\n🎨 RiskReady Component Scaffolding\n');
  
  // Get template type
  const type = await question('Select template type (list/detail/dashboard): ');
  
  if (!['list', 'detail', 'dashboard'].includes(type)) {
    console.error('❌ Invalid type. Must be: list, detail, or dashboard');
    rl.close();
    return;
  }
  
  // Get entity/module name
  const name = await question('Enter entity name (e.g., Nonconformity, Risk): ');
  
  if (!name) {
    console.error('❌ Name is required');
    rl.close();
    return;
  }
  
  // Get module path
  const modulePath = await question('Enter module path (e.g., audits, risks): ');
  
  if (!modulePath) {
    console.error('❌ Module path is required');
    rl.close();
    return;
  }
  
  // Generate file
  const template = templates[type];
  const fileName = type === 'dashboard' 
    ? `${name}DashboardPage.tsx`
    : type === 'list'
    ? `${name}RegisterPage.tsx`
    : `${name}DetailPage.tsx`;
  
  const outputDir = path.join(__dirname, '..', 'apps', 'web', 'src', 'pages', modulePath);
  const outputPath = path.join(outputDir, fileName);
  
  // Check if directory exists
  if (!fs.existsSync(outputDir)) {
    const create = await question(`Directory ${outputDir} doesn't exist. Create it? (y/n): `);
    if (create.toLowerCase() === 'y') {
      fs.mkdirSync(outputDir, { recursive: true });
    } else {
      console.log('❌ Cancelled');
      rl.close();
      return;
    }
  }
  
  // Check if file exists
  if (fs.existsSync(outputPath)) {
    const overwrite = await question(`File ${fileName} already exists. Overwrite? (y/n): `);
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ Cancelled');
      rl.close();
      return;
    }
  }
  
  // Generate content
  const content = template.generate({
    name,
    modulePath,
    fileName,
  });
  
  // Write file
  fs.writeFileSync(outputPath, content);
  
  console.log('\n✅ Successfully created:');
  console.log(`   ${outputPath}`);
  console.log('\n📝 Next steps:');
  console.log('   1. Update the API imports');
  console.log('   2. Define your columns/fields');
  console.log('   3. Add to routes in App.tsx');
  console.log('   4. Test the component\n');
  
  rl.close();
}

// Run if called directly
if (require.main === module) {
  scaffold().catch(console.error);
}

module.exports = { scaffold };
