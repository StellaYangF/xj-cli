const program = require('commander');
const path = require('path');
const { version } = require('./constants');

const mapActions = {
  create: {
    alias: 'x',
    description: 'create a project',
    examples: [
      'xj-cli create <project-name>',
    ],
  },
  config: {
    alias: 'conf',
    description: 'config project variable',
    examples: [
      'xj-cli config set <k> <v>',
      'xj-cli config get <k>',
    ],
  },
  '*': {
    alias: '',
    description: 'command not found',
    examples: [],
  },
};

Reflect
  .ownKeys(mapActions)
  .forEach(
    (action) => {
      program
        .command(action)
        .alias(mapActions[action].alias)
        .description(mapActions[action].description)
        .action(() => {
          switch (action) {
            case 'create':
              require(path.resolve(__dirname, action))(process.argv[3]);
              break;
            case 'config':
              require(path.resolve(__dirname, action))(process.argv.slice(3));
              break;
            default:
              console.log(mapActions[action].description);
          }
        });
    },
  );

program.on('--help', () => {
  console.log('\nExamples:');
  Reflect.ownKeys(mapActions).forEach((action) => {
    mapActions[action].examples.forEach((example) => console.log(`  ${example}`));
  });
});

program
  .version(version)
  .parse(process.argv);
